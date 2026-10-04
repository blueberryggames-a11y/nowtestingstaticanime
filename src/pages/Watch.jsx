import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ExternalLink, Plus, ChevronLeft, ChevronRight, Loader2, Star, Tv, AlertCircle,
} from 'lucide-react';
import EmbedPlayer from '../components/EmbedPlayer.jsx';
import ServerSelector from '../components/ServerSelector.jsx';
import CommentSection from '../components/CommentSection.jsx';
import AnimeCard from '../components/AnimeCard.jsx';
import EpisodeSidebar from '../components/EpisodeSidebar.jsx';
import { getAnimeById } from '../api/anilist.js';
import { useStreamResolver } from '../hooks/useStreamResolver.js';
import { useWatchHistory } from '../hooks/useWatchHistory.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { addToWatchlist } from '../firebase/firestore.js';

export default function Watch() {
  const { animeId, episode: episodeParam } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { settings, update } = useSettings();
  const { addEntry } = useWatchHistory();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const episode = Number(episodeParam || 1);
  const language = settings.streamLanguage || 'sub';
  const providerId = settings.streamProvider || 'megaplay';

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getAnimeById(animeId)
      .then((res) => { if (alive) { setAnime(res); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, [animeId]);

  const stream = useStreamResolver({
    providerId,
    anilistId: anime?.id,
    episode,
    language,
  });

  if (loading) {
    return (
      <div className="container page">
        <Loader2 size={32} className="spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container page">
        <div className="empty-state">Failed to load: {error.message}</div>
      </div>
    );
  }
  if (!anime) return null;

  const title =
    anime.title?.english || anime.title?.userPreferred || anime.title?.romaji;
  const totalEpisodes = anime.episodes || 0;
  const cleanDesc = DOMPurify.sanitize(anime.description || '');
  const recommendations = (anime.recommendations?.nodes || [])
    .map((n) => n.mediaRecommendation)
    .filter(Boolean);
  const related = (anime.relations?.edges || [])
    .map((e) => e.node)
    .filter(Boolean);
  const malLink = anime.externalLinks?.find((l) => l.site === 'MyAnimeList');

  const onProgress = async (pos, dur) => {
    if (!pos) return;
    await addEntry({
      animeId: anime.id,
      title,
      episode,
      position: pos,
      duration: dur || 0,
      image: anime.coverImage?.extraLarge || anime.coverImage?.large,
      provider: providerId,
      language,
    });
  };

  const onComplete = () => {
    if (settings.autoNext && (!totalEpisodes || episode < totalEpisodes)) {
      nav(`/watch/${anime.id}/${episode + 1}`);
    }
  };

  return (
    <div className="page watch">
      <div className="container watch-grid">
        <div className="watch-main">
          <div className="watch-title-bar">
            <div>
              <h1>{title}</h1>
              <p className="muted">
                Episode {episode}
                {totalEpisodes ? ` of ${totalEpisodes}` : ''}
              </p>
            </div>
            <ServerSelector
              providerId={providerId}
              language={language}
              status={stream.status}
              onProviderChange={(id) => update({ streamProvider: id })}
              onLanguageChange={(lang) => update({ streamLanguage: lang })}
            />
          </div>

          <EmbedPlayer
            url={stream.url}
            title={`${title} — Episode ${episode}`}
            onProgress={onProgress}
            onComplete={onComplete}
          />

          {stream.error && stream.status === 'error' && (
            <div className="stream-warning">
              <AlertCircle size={16} />
              <span>{stream.error}</span>
            </div>
          )}

          <div className="ep-nav-bar">
            <button
              className="btn ghost sm"
              disabled={episode <= 1}
              onClick={() => nav(`/watch/${anime.id}/${episode - 1}`)}
            >
              <ChevronLeft size={14} /> Previous Episode
            </button>
            <button
              className="btn ghost sm"
              disabled={totalEpisodes ? episode >= totalEpisodes : false}
              onClick={() => nav(`/watch/${anime.id}/${episode + 1}`)}
            >
              Next Episode <ChevronRight size={14} />
            </button>
          </div>

          <div className="anime-info-card glass">
            <img src={anime.coverImage?.extraLarge} alt={title} />
            <div className="anime-info-body">
              <h2>{title}</h2>
              {anime.title?.native && <p className="native">{anime.title.native}</p>}
              <div className="genre-list">
                {(anime.genres || []).map((g) => (
                  <span key={g} className="chip">{g}</span>
                ))}
              </div>
              <div
                className="description"
                dangerouslySetInnerHTML={{ __html: cleanDesc }}
              />
              <div className="info-grid">
                <InfoCell label="Format" value={anime.format} />
                <InfoCell
                  label="Season"
                  value={
                    anime.season && anime.seasonYear
                      ? `${anime.season} ${anime.seasonYear}`
                      : null
                  }
                />
                <InfoCell label="Status" value={anime.status?.replace('_', ' ')} />
                <InfoCell label="Episodes" value={anime.episodes} />
                <InfoCell
                  label="Score"
                  value={anime.averageScore ? `${anime.averageScore} / 100` : null}
                />
                <InfoCell
                  label="Duration"
                  value={anime.duration ? `${anime.duration} min` : null}
                />
                <InfoCell
                  label="Studios"
                  value={(anime.studios?.nodes || []).map((s) => s.name).join(', ')}
                />
                <InfoCell label="Country" value={anime.countryOfOrigin} />
              </div>
              <div className="actions-row">
                {anime.trailer?.id && anime.trailer.site === 'youtube' && (
                  <a
                    className="btn sm"
                    href={`https://www.youtube.com/watch?v=${anime.trailer.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={14} /> Trailer
                  </a>
                )}
                <button
                  className="btn sm"
                  onClick={() =>
                    user ? addToWatchlist(user.uid, anime, 'WATCHING') : null
                  }
                  disabled={!user}
                >
                  <Plus size={14} /> Watchlist
                </button>
                <a
                  className="btn sm"
                  href={`https://anilist.co/anime/${anime.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Star size={14} /> AniList
                </a>
                {malLink && (
                  <a className="btn sm" href={malLink.url} target="_blank" rel="noreferrer">
                    <Tv size={14} /> MyAnimeList
                  </a>
                )}
              </div>
            </div>
          </div>

          <CommentSection animeId={anime.id} episode={episode} animeTitle={title} />
        </div>

        <aside className="watch-side">
          <EpisodeSidebar
            animeId={anime.id}
            totalEpisodes={totalEpisodes}
            currentEpisode={episode}
          />

          <SidePanel title="Related Anime">
            {(related.length ? related : recommendations).slice(0, 8).map((a) => (
              <AnimeCard key={a.id} anime={a} showMeta={false} />
            ))}
          </SidePanel>
          <SidePanel title="Recommendations">
            {recommendations.slice(0, 8).map((a) => (
              <AnimeCard key={a.id} anime={a} showMeta={false} />
            ))}
          </SidePanel>
        </aside>
      </div>

      <style>{`
        .watch-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; }
        @media (max-width: 1000px) { .watch-grid { grid-template-columns: 1fr; } }
        .watch-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .watch-title-bar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .watch-title-bar h1 { margin: 0 0 4px; font-size: 22px; }
        .stream-warning {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          color: var(--danger); font-size: 13px;
        }
        .ep-nav-bar { display: flex; gap: 8px; justify-content: space-between; }
        .anime-info-card {
          border-radius: var(--radius); padding: 18px;
          display: grid; grid-template-columns: 160px 1fr; gap: 20px;
        }
        @media (max-width: 600px) { .anime-info-card { grid-template-columns: 1fr; } }
        .anime-info-card img {
          width: 100%; border-radius: 12px; aspect-ratio: 2/3; object-fit: cover;
        }
        .anime-info-body { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .anime-info-body h2 { margin: 0; font-size: 22px; }
        .native { margin: 0; font-size: 13px; color: var(--text-dim); }
        .genre-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .description { font-size: 13.5px; line-height: 1.6; color: var(--text-dim); }
        .description p { margin: 0 0 8px; }
        .info-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }
        .info-cell { display: flex; flex-direction: column; gap: 2px; }
        .info-cell .lbl {
          font-size: 10.5px; color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.05em; font-weight: 700;
        }
        .info-cell .val { font-size: 13px; font-weight: 600; }
        .actions-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn.sm { padding: 6px 12px; font-size: 12px; }
        .watch-side { display: flex; flex-direction: column; gap: 16px; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="info-cell">
      <span className="lbl">{label}</span>
      <span className="val">{value || '—'}</span>
    </div>
  );
}

function SidePanel({ title, children }) {
  return (
    <div className="side-panel glass">
      <h3>{title}</h3>
      <div className="side-grid">{children}</div>
      <style>{`
        .side-panel { border-radius: var(--radius); padding: 14px; }
        .side-panel h3 {
          margin: 0 0 12px; font-size: 13px; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--text-dim);
        }
        .side-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      `}</style>
    </div>
  );
}