import { useEffect, useRef, useState } from 'react';
import { getProvider } from '../data/streamProviders.js';
import { getSeries, pickEpisode } from '../api/anikoto.js';

// Resolves a stream URL for the given provider.
// MegaPlay legacy route prefers an Anikoto episode id; we fetch the series
// lazily and only when the user actually selects MegaPlay.
// Falls through to the AniList-id route when Anikoto has no match.

export function useStreamResolver({ providerId, anilistId, episode, language }) {
  const [state, setState] = useState({ url: null, status: 'idle', error: null, source: null });
  const abortRef = useRef(null);
  const anikotoCache = useRef(new Map());

  useEffect(() => {
    if (!anilistId || !episode) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const provider = getProvider(providerId);
    setState({ url: null, status: 'loading', error: null, source: null });

    (async () => {
      try {
        let anikotoEpisode = null;

        // Only hit Anikoto when MegaPlay is active AND we don't have a cached entry.
        if (provider.id === 'megaplay') {
          const cached = anikotoCache.current.get(String(anilistId));
          if (cached) {
            anikotoEpisode = pickEpisode(cached, episode);
          } else {
            try {
              const series = await getSeries(anilistId, { signal: ctrl.signal });
              anikotoCache.current.set(String(anilistId), series);
              anikotoEpisode = pickEpisode(series, episode);
            } catch (e) {
              // Non-fatal — we'll fall back to the AniList-id route.
              console.warn('Anikoto lookup failed, using AniList fallback:', e.message);
            }
          }
        }

        if (ctrl.signal.aborted) return;

        const url = provider.buildUrl({
          anilistId,
          episode,
          language,
          anikotoEpisode: null, // skip Anikoto entirely for now
        });

        if (!url) {
          setState({
            url: null,
            status: 'error',
            error: 'No source available for this episode on ' + provider.label,
            source: provider.id,
          });
          return;
        }

        setState({ url, status: 'ready', error: null, source: provider.id });
      } catch (err) {
        if (err.name === 'AbortError') return;
        setState({ url: null, status: 'error', error: err.message, source: provider.id });
      }
    })();

    return () => ctrl.abort();
  }, [providerId, anilistId, episode, language]);

  return state;
}