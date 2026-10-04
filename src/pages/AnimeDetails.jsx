import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Play, Plus, Heart, ExternalLink, Loader2, Star } from 'lucide-react';
import { getAnimeById } from '../api/anilist.js';
import AnimeGrid from '../components/AnimeGrid.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';
import {
  addToWatchlist, removeFromWatchlist, addFavorite, removeFavorite, isInWatchlist,
} from '../firebase/firestore.js';

export default function AnimeDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inList, setInList] = useState(false);
  const [fav, setFav] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getAnimeById(id)
      .then((res) => { if (alive) { setAnime(res); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!user || !anime) return;
    isInWatchlist(user.uid, anime.id).then(setInList).catch(() => {});
  }, [user, anime]);

  if (loading) {
    return (
      <div className="container page">
        <Loader2 className="spin" size={32} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container page">
        <div className="empty-state">Failed to load anime: {error.message}</div>
      </div>
    );
  }
  if (!anime) return null;

  const title =
    anime.title?.english || anime.title?.userPreferred || anime.title?.romaji;
  const banner = anime.bannerImage || anime.coverImage?.extraLarge;
  const cleanDesc = DOMPurify.sanitize(anime.description || '<p>No description available.</p>');
  const recommendations = (anime.recommendations?.nodes || [])
    .map((n) => n.mediaRecommendation).filter(Boolean);
  const related = (anime.relations?.edges || [])
    .map((e) => e.node).filter(Boolean);

  const toggleWatchlist = async () => {
    if (!user) return setAuthOpen(true);
    setBusy(true);
    try {
      if (inList) {
        await removeFromWatchlist(user.uid, anime.id);
        setInList(false);
      } else {
        await addToWatchlist(user.uid, anime, 'PLANNED');
        setInList(true);
      }
    } catch (e) { console.warn(e); }
    setBusy(false);
  };

  const toggleFav = async () => {
    if (!user) return setAuthOpen(true);
    setBusy(true);
    try {
      if (fav) { await removeFavorite(user.uid, anime.id); setFav(false); }
      else { await addFavorite(user.uid, anime); setFav(true); }
    } catch (e) { console.warn(e); }
    setBusy(false);
  };

  const malId = anime.externalLinks?.find((l) => l.site === 'MyAnimeList');

  return (
    <div className="page details">
      <div className="details-hero" style={{ backgroundImage: `url(${banner})` }}>
        <div className="details-overlay" />
        <div className="container details-hero-inner">
          <div className="details-cover">
            <img src={anime.coverImage?.extraLarge} alt={title} />
          </div>
          <div className="details-info">
            <h1>{title}</h1>
            {anime.title?.native && <p className="native">{anime.title.native}</p>}
            <div className="details-meta">
              {anime.format && <span className="pill">{anime.format}</span>}
              {anime.seasonYear && <span className="pill">{anime.season} {anime.seasonYear}</span>}
              {anime.averageScore && <span className="pill gold"><Star size={12} /> {anime.averageScore}</span>}
              {anime.episodes && <span className="pill">{anime.episodes} Episodes</span>}
              {anime.status && <span className="pill">{anime.status.replace('_', ' ')}</span>}
            </div>
            <div className="genre-list">
              {(anime.genres || []).map((g) => <span key={g} className="chip">{g}</span>)}
            </div>
            <div
              className="description"
              dangerouslySetInnerHTML={{ __html: cleanDesc }}
            />
            <div className="details-actions">
              <button className="btn primary" onClick={() => nav(`/watch/${anime.id}`)}>
                <Play size={16} /> Watch Now
              </button>
              <button className="btn" onClick={toggleWatchlist} disabled={busy}>
                <Plus size={16} /> {inList ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
              <button className="btn" onClick={toggleFav} disabled={busy}>
                <Heart size={16} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Favorited' : 'Favorite'}
              </button>
              {anime.trailer?.id && anime.trailer.site === 'youtube' && (
                <a
                  className="btn"
                  href={`https://www.youtube.com/watch?v=${anime.trailer.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} /> Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container details-body">
        <div className="details-main">
          <div className="info-grid">
            <InfoCell label="Format" value={anime.format} />
            <InfoCell label="Status" value={anime.status?.replace('_', ' ')} />
            <InfoCell label="Episodes" value={anime.episodes} />
            <InfoCell label="Duration" value={anime.duration ? `${anime.duration} min` : null} />
            <InfoCell label="Start Date" value={formatDate(anime.startDate)} />
            <InfoCell label="End Date" value={formatDate(anime.endDate)} />
            <InfoCell label="Studios" value={(anime.studios?.nodes || []).map((s) => s.name).join(', ')} />
            <InfoCell label="Country" value={anime.countryOfOrigin} />
            <InfoCell label="Popularity" value={anime.popularity?.toLocaleString()} />
            <InfoCell label="Favorites" value={anime.favourites?.toLocaleString()} />
          </div>

          {(recommendations.length > 0 || related.length > 0) && (
            <section style={{ marginTop: 32 }}>
              <div className="section-head"><h2>Recommendations</h2></div>
              <AnimeGrid anime={[...recommendations, ...related].slice(0, 12)} />
            </section>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <style>{`
        .details-hero {
          position: relative; aspect-ratio: 21/9; min-height: 420px;
          background-size: cover; background-position: center;
        }
        .details-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(to bottom, rgba(8,8,12,0.55), rgba(8,8,12,0.98)),
            linear-gradient(to right, rgba(8,8,12,0.85), transparent);
        }
        .details-hero-inner {
          position: relative; height: 100%; display: flex; gap: 32px;
          align-items: flex-end; padding-bottom: 32px; flex-wrap: wrap;
        }
        .details-cover {
          width: 200px; flex-shrink: 0; border-radius: 14px; overflow: hidden;
          border: 1px solid var(--border); box-shadow: var(--shadow);
        }
        .details-cover img { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
        .details-info { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 10px; }
        .details-info h1 {
          margin: 0; font-size: clamp(24px, 3vw, 40px);
          font-weight: 800; letter-spacing: -0.02em;
        }
        .native { margin: 0; font-size: 13px; color: var(--text-dim); }
        .details-meta { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
        }
        .pill.gold { color: #fcd34d; }
        .genre-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .description { font-size: 14px; line-height: 1.65; color: var(--text-dim); max-width: 780px; }
        .description p { margin: 0 0 8px; }
        .details-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .details-body { margin-top: 40px; }
        .details-main { max-width: 1000px; }
        .info-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px; background: var(--panel); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px;
        }
        .info-cell { display: flex; flex-direction: column; gap: 4px; }
        .info-cell .lbl {
          font-size: 11px; color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.05em; font-weight: 600;
        }
        .info-cell .val { font-size: 14px; font-weight: 600; }
        @media (max-width: 720px) {
          .details-hero { aspect-ratio: auto; padding: 40px 0 24px; }
          .details-hero-inner { padding: 0 20px; }
          .details-cover { width: 130px; }
        }
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

function formatDate(d) {
  if (!d || !d.year) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[(d.month || 1) - 1]} ${d.day || 1}, ${d.year}`;
}