// AniList GraphQL client with a two-tier cache.
//
// Tier 1: in-memory Map — instant, per-tab.
// Tier 2: localStorage    — persists across reloads, ~4MB budget.
//
// Strategy: stale-while-revalidate.
//   age <  softTtl  → serve cached, no network.
//   softTtl..hardTtl → serve cached immediately, refresh in background.
//   age >  hardTtl   → fetch synchronously.
//
// Different queries use different TTL profiles. Search uses very short TTLs
// so results always feel live, while lists use long TTLs so page reloads and
// navigation don't hammer the API.

const ENDPOINT = 'https://graphql.anilist.co';

const memCache = new Map();
const inflight = new Map();
const LS_PREFIX = 'hoshii:al:';
const LS_MAX_BYTES = 4 * 1024 * 1024; // 4MB budget
const LS_SINGLE_ENTRY_LIMIT = 500 * 1024; // skip LS for anything larger

export const TTL = {
  // { soft: when to consider stale, hard: when to discard entirely }
  byId:       { soft: 6 * 60 * 60 * 1000, hard: 7 * 24 * 60 * 60 * 1000 },
  list:       { soft: 60 * 60 * 1000,     hard: 24 * 60 * 60 * 1000 },
  trending:   { soft: 30 * 60 * 1000,     hard: 6 * 60 * 60 * 1000 },
  schedule:   { soft: 30 * 60 * 1000,     hard: 6 * 60 * 60 * 1000 },
  search:     { soft: 5 * 60 * 1000,      hard: 30 * 60 * 1000 },
  suggestion: { soft: 60 * 1000,          hard: 10 * 60 * 1000 },
};

/* -------------------- Cache key + storage helpers -------------------- */

function hashString(s) {
  // djb2 — short, stable, non-cryptographic.
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function cacheKey(query, variables) {
  // Sort variable keys so `{a, b}` and `{b, a}` hash identically.
  const sorted = {};
  if (variables) {
    for (const k of Object.keys(variables).sort()) {
      if (variables[k] !== undefined) sorted[k] = variables[k];
    }
  }
  return LS_PREFIX + hashString(query + '|' + JSON.stringify(sorted));
}

function readEntry(key) {
  const mem = memCache.get(key);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.t !== 'number') {
      localStorage.removeItem(key);
      return null;
    }
    memCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeEntry(key, value) {
  const entry = { t: Date.now(), v: value };
  memCache.set(key, entry);
  try {
    const json = JSON.stringify(entry);
    if (json.length > LS_SINGLE_ENTRY_LIMIT) return; // memory only
    localStorage.setItem(key, json);
    pruneIfNeeded();
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      pruneIfNeeded(true);
    }
  }
}

function pruneIfNeeded(aggressive = false) {
  try {
    const entries = [];
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(LS_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      total += raw.length;
      try {
        const p = JSON.parse(raw);
        entries.push({ k, t: p.t || 0, size: raw.length });
      } catch {
        localStorage.removeItem(k);
      }
    }
    if (!aggressive && total < LS_MAX_BYTES) return;
    entries.sort((a, b) => a.t - b.t); // oldest first
    const target = aggressive ? LS_MAX_BYTES * 0.5 : LS_MAX_BYTES * 0.8;
    let removed = 0;
    for (const e of entries) {
      if (total - removed < target) break;
      localStorage.removeItem(e.k);
      removed += e.size;
    }
  } catch {
    /* localStorage unavailable */
  }
}

/** Clear every cached AniList response (memory + localStorage). */
export function clearAniListCache() {
  memCache.clear();
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/* ------------------------------ Transport ---------------------------- */

async function realFetch(query, variables, signal) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (res.status === 429) {
    const retry = res.headers.get('Retry-After') || 60;
    throw new Error(`AniList rate limited. Try again in ~${retry}s.`);
  }
  if (!res.ok) {
    throw new Error(`AniList request failed (${res.status})`);
  }

  const json = await res.json();
  if (json.errors) {
    console.error('AniList GraphQL error:', json.errors);
    throw new Error(json.errors[0]?.message || 'AniList error');
  }
  return json.data;
}

/**
 * Main GraphQL call with stale-while-revalidate caching.
 *
 * @param {string} query
 * @param {object} variables
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @param {{soft:number,hard:number}} [opts.ttl]
 * @param {boolean} [opts.skipCache]
 */
async function gql(query, variables = {}, opts = {}) {
  const { signal, ttl = TTL.list, skipCache = false } = opts;
  const key = cacheKey(query, variables);
  const now = Date.now();

  if (!skipCache) {
    const entry = readEntry(key);
    if (entry) {
      const age = now - entry.t;
      if (age < ttl.soft) {
        return entry.v;
      }
      if (age < ttl.hard) {
        // Serve stale immediately, revalidate in the background.
        // Only one background revalidation per key at a time.
        if (!inflight.has(key)) {
          const bg = realFetch(query, variables, null)
            .then((data) => {
              writeEntry(key, data);
              return data;
            })
            .catch(() => {})
            .finally(() => inflight.delete(key));
          inflight.set(key, bg);
        }
        return entry.v;
      }
    }
  }

  // Hard miss — synchronous fetch. Dedupe concurrent callers that don't
  // pass an AbortSignal (list views), so mounting three sections at once
  // only fires one network request.
  if (!signal && inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = realFetch(query, variables, signal).then((data) => {
    if (!skipCache) writeEntry(key, data);
    return data;
  });

  if (!signal) {
    inflight.set(key, promise);
    promise.finally(() => inflight.delete(key));
  }

  return promise;
}

/* --------------------------- GraphQL fragments --------------------------- */

const MEDIA_FRAGMENT = `
  id
  title { romaji english native userPreferred }
  description
  coverImage { extraLarge large color }
  bannerImage
  format
  status
  season
  seasonYear
  episodes
  duration
  averageScore
  meanScore
  popularity
  favourites
  genres
  isAdult
  countryOfOrigin
  startDate { year month day }
  endDate { year month day }
  trailer { id site thumbnail }
  studios(isMain: true) { nodes { id name } }
  nextAiringEpisode { episode airingAt timeUntilAiring }
`;

// NOTE: AniList's Media field uses `averageScore_greater`, NOT `minimumScore`.
export const SEARCH_QUERY = `
  query (
    $page: Int,
    $perPage: Int,
    $search: String,
    $genre: String,
    $tag: String,
    $year: Int,
    $season: MediaSeason,
    $status: MediaStatus,
    $format: MediaFormat,
    $sort: [MediaSort],
    $averageScoreGreater: Int,
    $country: CountryCode,
    $isAdult: Boolean
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage perPage }
      media(
        search: $search,
        genre: $genre,
        tag: $tag,
        seasonYear: $year,
        season: $season,
        status: $status,
        format: $format,
        sort: $sort,
        averageScore_greater: $averageScoreGreater,
        countryOfOrigin: $country,
        isAdult: $isAdult,
        type: ANIME
      ) {
        ${MEDIA_FRAGMENT}
      }
    }
  }
`;

/* ------------------------------ Public API ------------------------------ */

/**
 * Search anime. Uses a short TTL so results always feel live, but rapid
 * repeat queries (e.g. back button) still hit the cache.
 */
export async function searchAnime({
  query,
  page = 1,
  perPage = 30,
  genre,
  tag,
  year,
  season,
  status,
  format,
  sort = ['POPULARITY_DESC'],
  minimumScore,
  country,
  isAdult = false,
  signal,
  isSuggestion = false,
  noCache = false,
} = {}) {
  const variables = {
    page,
    perPage,
    search: query || undefined,
    genre: genre || undefined,
    tag: tag || undefined,
    year: year || undefined,
    season: season || undefined,
    status: status || undefined,
    format: format || undefined,
    sort,
    averageScoreGreater: minimumScore || undefined,
    country: country || undefined,
    isAdult,
  };
  const ttl = isSuggestion ? TTL.suggestion : TTL.search;
  const data = await gql(SEARCH_QUERY, variables, {
    signal,
    ttl,
    skipCache: noCache,
  });
  return data.Page;
}

export async function getAnimeById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FRAGMENT}
        relations {
          edges {
            relationType
            node {
              id
              title { romaji english userPreferred }
              coverImage { large extraLarge }
              format
              seasonYear
              episodes
              averageScore
            }
          }
        }
        recommendations(sort: RATING_DESC, perPage: 12) {
          nodes {
            mediaRecommendation {
              id
              title { romaji english userPreferred }
              coverImage { large extraLarge }
              format
              seasonYear
              episodes
              averageScore
            }
          }
        }
        externalLinks { id url site type }
      }
    }
  `;
  const data = await gql(query, { id: Number(id) }, { ttl: TTL.byId });
  return data.Media;
}

/**
 * Warm the details cache on hover so clicking a card is instant.
 * Fire-and-forget; failures are swallowed.
 */
export function prefetchAnime(id) {
  if (!id) return;
  const key = cacheKey(
    `query ($id: Int) { Media(id: $id, type: ANIME) { id } }`,
    { id: Number(id) }
  );
  // Cheap check: only prefetch if we don't already have a full record.
  // (We can't inspect the details cache key directly, so just try.)
  getAnimeById(id).catch(() => {});
}

export async function getTrendingAnime(page = 1, perPage = 30) {
  return searchAnime({ page, perPage, sort: ['TRENDING_DESC'] });
}

export async function getPopularAnime(page = 1, perPage = 30) {
  return searchAnime({ page, perPage, sort: ['POPULARITY_DESC'] });
}

export async function getTopRatedAnime(page = 1, perPage = 30) {
  return searchAnime({ page, perPage, sort: ['SCORE_DESC'] });
}

export async function getNewestAnime(page = 1, perPage = 30) {
  const year = new Date().getFullYear();
  return searchAnime({ page, perPage, year, sort: ['POPULARITY_DESC'] });
}

export async function getCurrentlyAiring(page = 1, perPage = 30) {
  return searchAnime({ page, perPage, status: 'RELEASING', sort: ['POPULARITY_DESC'] });
}

export async function getUpcoming(page = 1, perPage = 30) {
  return searchAnime({ page, perPage, status: 'NOT_YET_RELEASED', sort: ['POPULARITY_DESC'] });
}

export async function getMovies(page = 1, perPage = 30) {
  return searchAnime({ page, perPage, format: 'MOVIE', sort: ['POPULARITY_DESC'] });
}

export async function getSeasonalAnime(season, year, page = 1, perPage = 30) {
  return searchAnime({ page, perPage, season, year, sort: ['POPULARITY_DESC'] });
}

export async function getAiringSchedule({
  page = 1,
  perPage = 50,
  airingAtGreater,
  airingAtLesser,
} = {}) {
  const query = `
    query ($page: Int, $perPage: Int, $airingAtGreater: Int, $airingAtLesser: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        airingSchedules(
          airingAt_greater: $airingAtGreater,
          airingAt_lesser: $airingAtLesser,
          sort: TIME
        ) {
          id
          episode
          airingAt
          timeUntilAiring
          media {
            id
            title { romaji english userPreferred }
            coverImage { large extraLarge }
            format
            status
            episodes
            averageScore
            genres
          }
        }
      }
    }
  `;
  // Round the schedule window to the nearest hour so identical queries
  // within the hour share a cache entry.
  const HOUR = 60 * 60;
  const roundHour = (t) => (t ? Math.floor(t / HOUR) * HOUR : undefined);
  const data = await gql(
    query,
    {
      page,
      perPage,
      airingAtGreater: roundHour(airingAtGreater),
      airingAtLesser: roundHour(airingAtLesser),
    },
    { ttl: TTL.schedule }
  );
  return data.Page;
}

export async function getRandomAnime() {
  const page = Math.floor(Math.random() * 5) + 1;
  const data = await searchAnime({
    page,
    perPage: 30,
    sort: ['POPULARITY_DESC'],
  });
  const list = data.media || [];
  if (!list.length) throw new Error('No anime found');
  return list[Math.floor(Math.random() * list.length)];
}

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];

export const FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'];
export const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'];
export const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
export const SORTS = [
  { value: 'POPULARITY_DESC', label: 'Popularity' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'SCORE_DESC', label: 'Highest Rated' },
  { value: 'START_DATE_DESC', label: 'Newest' },
  { value: 'TITLE_ROMAJI', label: 'Title A-Z' },
];