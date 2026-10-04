import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';
import { getWatchlist, removeFromWatchlist } from '../firebase/firestore.js';

export default function Watchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getWatchlist(user.uid)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h2>Your Watchlist</h2>
          <p>Sign in to save and track anime.</p>
          <button className="btn primary" onClick={() => setAuthOpen(true)}>Sign In</button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const remove = async (id) => {
    await removeFromWatchlist(user.uid, id);
    setItems(list => list.filter(i => i.id !== id));
  };

  return (
    <div className="page container">
      <h1>Your Watchlist</h1>
      {loading ? (
        <div className="loading-row"><Loader2 size={24} className="spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>Your watchlist is empty.</p>
          <Link className="btn primary" to="/search">Browse Anime</Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {items.map(i => (
            <div key={i.id} className="watchlist-card">
              <Link to={`/anime/${i.id}`}>
                <img src={i.coverImage} alt={i.title} loading="lazy" />
                <div className="wc-info">
                  <span className="wc-title">{i.title}</span>
                  <span className="muted">{i.format} · {i.seasonYear} · {i.status}</span>
                </div>
              </Link>
              <button className="wc-remove" onClick={() => remove(i.id)} aria-label="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`
        h1 { margin: 0 0 20px; font-size: 28px; }
        .watchlist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .watchlist-card { position: relative; background: var(--panel); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: var(--transition); }
        .watchlist-card:hover { border-color: var(--accent); }
        .watchlist-card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
        .wc-info { padding: 10px; display: flex; flex-direction: column; gap: 4px; }
        .wc-title { font-size: 13px; font-weight: 600; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .wc-remove {
          position: absolute; top: 8px; right: 8px;
          background: rgba(0,0,0,0.7); color: var(--danger); border: none;
          width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          transition: var(--transition); opacity: 0;
        }
        .watchlist-card:hover .wc-remove { opacity: 1; }
        .wc-remove:hover { background: rgba(248,113,113,0.2); }
        .loading-row { display: flex; align-items: center; gap: 10px; padding: 60px; justify-content: center; color: var(--text-muted); }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}