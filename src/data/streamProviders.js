// Provider definitions for the Hoshii watch page.
// Every provider exposes:
//   id, label, languages, buildUrl({ anilistId, episode, language, anikotoEpisode })
// buildUrl may return null when the provider cannot serve the request
// (e.g. MegaPlay legacy route needs an Anikoto episode id).

export const PROVIDERS = [
  {
    id: 'megaplay',
    label: 'MegaPlay',
    languages: ['sub', 'dub'],
    // Two routes: legacy HiAnime episode id (from Anikoto), or AniList id.
    buildUrl({ anilistId, episode, language, anikotoEpisode }) {
      if (anikotoEpisode?.episode_embed_id) {
        return `https://megaplay.buzz/stream/s-2/${anikotoEpisode.episode_embed_id}/${language}`;
      }
      // Fallback: AniList-id route (no Anikoto lookup required).
      if (anilistId && episode) {
        return `https://megaplay.buzz/stream/ani/${anilistId}/${episode}/${language}`;
      }
      return null;
    },
  },
  {
    id: 'filmu',
    label: 'FilmU',
    languages: ['sub', 'dub'],
    // Documented route: https://embed.filmu.in/anime/{anilistId}/{season}/{episode}
    // FilmU uses "1" as season for single-cour shows; we default to 1.
    buildUrl({ anilistId, episode, language }) {
      if (!anilistId || !episode) return null;
      return `https://embed.filmu.in/anime/${anilistId}/1/${episode}`;
    },
  },
];

export const PROVIDER_BY_ID = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));

export function getProvider(id) {
  return PROVIDER_BY_ID[id] || PROVIDERS[0];
}