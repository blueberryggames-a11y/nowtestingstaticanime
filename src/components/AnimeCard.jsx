import { Link } from 'react-router-dom';
import { Star, Play, Calendar, Film, Layers } from 'lucide-react';

export default function AnimeCard({ anime, showMeta = true }) {
  if (!anime) return null;
  const title =
    anime.title?.english || anime.title?.userPreferred || anime.title?.romaji || 'Untitled';
  const cover =
    anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium;

  return (
    <Link to={`/anime/${anime.id}`} className="anime-card">
      <div className="poster">
        {cover ? (
          <img src={cover} alt={title} loading="lazy" />
        ) : (
          <div className="poster-fallback">{title[0]}</div>
        )}
        <div className="overlay">
          <span className="quick-view"><Play size={14} /> Quick View</span>
        </div>
        {anime.averageScore ? (
          <span className="score">
            <Star size={12} /> {anime.averageScore}
          </span>
        ) : null}
      </div>
      <div className="info">
        <h3 className="title" title={title}>{title}</h3>
        {showMeta && (
          <div className="meta">
            {anime.format && <span><Film size={11} /> {anime.format}</span>}
            {anime.seasonYear && <span><Calendar size={11} /> {anime.seasonYear}</span>}
            {anime.episodes ? <span><Layers size={11} /> {anime.episodes} EP</span> : null}
          </div>
        )}
      </div>

      <style>{`
        .anime-card {
          display: flex; flex-direction: column; gap: 8px;
          transition: transform 0.25s cubic-bezier(.4,0,.2,1);
          position: relative;
        }
        .anime-card:hover { transform: translateY(-4px); }
        .poster {
          position: relative; aspect-ratio: 2/3; border-radius: 12px;
          overflow: hidden; background: var(--panel);
          border: 1px solid var(--border-soft);
          transition: var(--transition);
        }
        .anime-card:hover .poster { border-color: var(--accent); box-shadow: 0 8px 30px rgba(167,139,250,0.15); }
        .poster img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .anime-card:hover .poster img { transform: scale(1.06); }
        .poster-fallback {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          font-size: 40px; font-weight: 800; color: var(--text-muted);
        }
        .overlay {
          position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center;
          background: linear-gradient(to top, rgba(0,0,0,0.85), transparent 55%);
          opacity: 0; transition: opacity 0.25s ease;
        }
        .anime-card:hover .overlay { opacity: 1; }
        .quick-view {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--accent); color: #0b0b12; font-weight: 700; font-size: 12px;
          padding: 8px 14px; border-radius: 8px; margin-bottom: 12px;
          transform: translateY(8px); transition: transform 0.25s ease;
        }
        .anime-card:hover .quick-view { transform: translateY(0); }
        .score {
          position: absolute; top: 8px; right: 8px;
          display: inline-flex; align-items: center; gap: 3px;
          background: rgba(0,0,0,0.75); color: #fcd34d;
          font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
          backdrop-filter: blur(4px);
        }
        .info { min-width: 0; }
        .title {
          font-size: 13px; font-weight: 600; margin: 0; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
        .meta span { display: inline-flex; align-items: center; gap: 3px; }
      `}</style>
    </Link>
  );
}