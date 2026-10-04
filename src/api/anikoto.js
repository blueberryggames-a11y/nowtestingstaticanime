// Anikoto API client.
// Docs: https://anikotoapi.site
// Intended for server-side use, so we cache aggressively and never call it
// speculatively. Only fetched when the user requests a MegaPlay legacy stream.
//
// Endpoints used:
//   GET /series/{id}       -> { anime, episodes: [{ episode_embed_id, ... }] }
//   GET /recent-anime      -> page of anime
//
// Rate limit: 60 requests / 120 seconds per IP.
// We keep a small in-memory + sessionStorage cache to reduce calls.

const BASE = 'https://anikotoapi.site';

const memCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function cacheKey(path) {
  return `anikoto:${path}`;
}

function readCache(path) {
  const k = cacheKey(path);
  const hit = memCache.get(k);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.v;
  try {
    const raw = sessionStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.t > CACHE_TTL) {
      sessionStorage.removeItem(k);
      return null;
    }
    memCache.set(k, parsed);
    return parsed.v;
  } catch {
    return null;
  }
}

function writeCache(path, value) {
  const entry = { t: Date.now(), v: value };
  memCache.set(cacheKey(path), entry);
  try {
    sessionStorage.setItem(cacheKey(path), JSON.stringify(entry));
  } catch {
    /* quota exceeded — ignore */
  }
}

async function request(path, { signal } = {}) {
  const cached = readCache(path);
  if (cached) return cached;

  const res = await fetch(`${BASE}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (res.status === 429) {
    throw new Error('Anikoto rate limit reached. Try again shortly.');
  }
  if (res.status === 403) {
    throw new Error('Anikoto blocked this request.');
  }
  if (!res.ok) {
    throw new Error(`Anikoto request failed (${res.status})`);
  }

  const data = await res.json();
  writeCache(path, data);
  return data;
}

/**
 * Fetch a series with its full episode list from Anikoto.
 * Each episode has `episode_embed_id` which feeds MegaPlay's legacy route.
 */
export async function getSeries(id, opts) {
  if (!id) throw new Error('Series id is required');
  return request(`/series/${encodeURIComponent(id)}`, opts);
}

/**
 * Recent anime list — useful for diagnostics and a "New on MegaPlay" rail.
 */
export async function getRecentAnime({ page = 1, perPage = 20, signal } = {}) {
  const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  return request(`/recent-anime?${q}`, { signal });
}

/**
 * Best-effort lookup of a single episode entry inside a series payload.
 * Returns null when the payload shape is unexpected.
 */
export function pickEpisode(seriesPayload, episodeNumber) {
  const list =
    seriesPayload?.episodes ||
    seriesPayload?.data?.episodes ||
    seriesPayload?.series?.episodes ||
    [];
  if (!Array.isArray(list)) return null;

  const n = Number(episodeNumber);
  return (
    list.find((e) => Number(e.episode) === n || Number(e.number) === n) ||
    list[n - 1] ||
    null
  );
}