import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListFilter, Search } from 'lucide-react';

export default function EpisodeSidebar({ animeId, totalEpisodes, currentEpisode }) {
  const [filter, setFilter] = useState('');

  const episodes = useMemo(() => {
    const total = Number(totalEpisodes) || 0;
    if (!total) return [];
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [totalEpisodes]);

  const visible = useMemo(() => {
    if (!filter.trim()) return episodes;
    return episodes.filter((n) => String(n).includes(filter.trim()));
  }, [episodes, filter]);

  return (
    <div className="episode-sidebar glass">
      <div className="ep-header">
        <div className="ep-range">
          <ListFilter size={13} />
          <span>
            {episodes.length ? `1 – ${episodes.length}` : 'No episodes'}
          </span>
        </div>
      </div>

      <div className="ep-search">
        <Search size={14} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter episodes…"
          aria-label="Filter episodes"
        />
      </div>

      {episodes.length === 0 ? (
        <p className="ep-empty muted">
          AniList hasn't published an episode count for this title yet.
        </p>
      ) : (
        <div className="ep-grid" role="list">
          {visible.map((n) => (
            <Link
              key={n}
              to={`/watch/${animeId}/${n}`}
              role="listitem"
              className={`ep-btn ${n === Number(currentEpisode) ? 'active' : ''}`}
              aria-current={n === Number(currentEpisode) ? 'page' : undefined}
            >
              {n}
            </Link>
          ))}
          {visible.length === 0 && (
            <p className="ep-empty muted">No matching episodes.</p>
          )}
        </div>
      )}

      <style>{`
        .episode-sidebar { border-radius: var(--radius); padding: 14px; }
        .ep-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .ep-range {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          color: var(--text-dim); background: var(--panel-2);
          border: 1px solid var(--border); border-radius: 8px;
          padding: 6px 10px;
        }
        .ep-search {
          display: flex; align-items: center; gap: 8px;
          background: var(--panel-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 10px; margin-bottom: 10px;
          transition: var(--transition);
        }
        .ep-search:focus-within { border-color: var(--accent); }
        .ep-search svg { color: var(--text-muted); flex-shrink: 0; }
        .ep-search input {
          flex: 1; min-width: 0; background: transparent; border: none;
          outline: none; color: var(--text); font-size: 13px;
        }
        .ep-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
          gap: 6px;
          max-height: 260px; overflow-y: auto;
          padding-right: 4px;
        }
        .ep-btn {
          display: flex; align-items: center; justify-content: center;
          aspect-ratio: 1 / 1; border-radius: 8px;
          background: var(--panel-2); border: 1px solid var(--border);
          color: var(--text-dim); font-size: 13px; font-weight: 600;
          transition: var(--transition);
        }
        .ep-btn:hover {
          border-color: var(--accent); color: var(--text);
          transform: translateY(-1px);
        }
        .ep-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #0b0b12;
          font-weight: 800;
          box-shadow: 0 6px 18px rgba(167,139,250,0.35);
        }
        .ep-empty {
          grid-column: 1 / -1; font-size: 12px; margin: 4px 0;
        }
      `}</style>
    </div>
  );
}