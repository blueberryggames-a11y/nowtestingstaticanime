import { Link } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { useWatchHistory } from '../hooks/useWatchHistory.js';

export default function History() {
  const { history, loading, removeEntry } = useWatchHistory();

  return (
    <div className="page container">
      <h1>Watch History</h1>
      {loading ? (
        <div className="loading-row"><Loader2 size={24} className="spin" /> Loading…</div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <p>No watch history yet.</p>
          <Link className="btn primary" to="/">Browse Anime</Link>
        </div>
      ) : (
        <div className="history-grid">
          {history.map(h => {
            const progress = h.duration ? Math.min(100, (h.position / h.duration) * 100) : 0;
            return (
              <div key={h.id || `${h.animeId}-${h.episode}`} className="history-card">
                <Link to={`/watch/${h.animeId}/${h.episode}`}>
                  <div className="thumb" style={{ backgroundImage: `url(${h.image})` }}>
                    <span className="ep-badge">EP {h.episode}</span>
                    <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <p className="title">{h.title}</p>
                  <p className="meta">{fmt(h.position)} / {fmt(h.duration)}</p>
                </Link>
                <button className="remove" onClick={() => removeEntry(h.animeId, h.episode)} aria-label="Remove">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        h1 { margin: 0 0 20px; font-size: 28px; }
        .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .history-card { position: relative; }
        .history-card .thumb {
          aspect-ratio: 16/9; border-radius: 10px; background-size: cover; background-position: center;
          background-color: var(--panel); border: 1px solid var(--border); overflow: hidden;
          transition: var(--transition);
        }
        .history-card:hover .thumb { border-color: var(--accent); }
        .ep-badge {
          position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.75); color: #fff;
          font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 5px; backdrop-filter: blur(4px);
        }
        .progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(0,0,0,0.5); }
        .progress-fill { height: 100%; background: var(--accent); }
        .title { margin: 8px 0 4px; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .meta { margin: 0; font-size: 11px; color: var(--text-muted); }
        .remove {
          position: absolute; top: 8px; right: 8px;
          background: rgba(0,0,0,0.75); color: #fff; border: none;
          width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: var(--transition);
        }
        .history-card:hover .remove { opacity: 1; }
        .loading-row { display: flex; align-items: center; gap: 10px; padding: 60px; justify-content: center; color: var(--text-muted); }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function fmt(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}