import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';
import { getWatchlist, getFavorites } from '../firebase/firestore.js';
import { getUserDoc, updateUserProfile } from '../firebase/auth.js';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getUserDoc(user.uid),
      getWatchlist(user.uid).catch(() => []),
      getFavorites(user.uid).catch(() => []),
    ]).then(([p, wl, fv]) => {
      setProfile(p);
      setWatchlist(wl);
      setFavorites(fv);
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.photoURL || '');
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h2>Profile</h2>
          <p>Sign in to view your profile.</p>
          <button className="btn primary" onClick={() => setAuthOpen(true)}>Sign In</button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user, { displayName, photoURL: avatarUrl || null });
      setEditing(false);
    } catch (e) { console.warn(e); }
    setSaving(false);
  };

  return (
    <div className="page container">
      {loading ? (
        <div className="loading-row"><Loader2 size={24} className="spin" /> Loading profile…</div>
      ) : (
        <>
          <div className="profile-head glass">
            <div className="avatar-lg">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : (user.displayName || 'U')[0].toUpperCase()}
            </div>
            <div className="profile-info">
              {editing ? (
                <>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
                  <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Avatar image URL" />
                  <div className="btn-row">
                    <button className="btn primary" onClick={save} disabled={saving}>
                      {saving && <Loader2 size={14} className="spin" />} <Save size={14} /> Save
                    </button>
                    <button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <h1>{user.displayName || 'User'}</h1>
                  <p className="muted">{user.email}</p>
                  {profile?.createdAt && (
                    <p className="muted-2">
                      Joined {profile.createdAt.toDate?.().toLocaleDateString() || 'recently'}
                    </p>
                  )}
                  <button className="btn ghost sm" onClick={() => setEditing(true)}>Edit Profile</button>
                </>
              )}
            </div>
          </div>

          <section style={{ marginTop: 32 }}>
            <div className="section-head"><h2>Favorites</h2></div>
            {favorites.length === 0
              ? <div className="empty-state">No favorites yet.</div>
              : <div className="mini-grid">{favorites.map(f => (
                  <Link key={f.id} to={`/anime/${f.id}`} className="mini-card">
                    <img src={f.coverImage} alt={f.title} />
                    <span>{f.title}</span>
                  </Link>
                ))}</div>}
          </section>

          <section style={{ marginTop: 32 }}>
            <div className="section-head"><h2>Watchlist</h2></div>
            {watchlist.length === 0
              ? <div className="empty-state">Your watchlist is empty.</div>
              : <div className="mini-grid">{watchlist.map(f => (
                  <Link key={f.id} to={`/anime/${f.id}`} className="mini-card">
                    <img src={f.coverImage} alt={f.title} />
                    <span>{f.title}</span>
                  </Link>
                ))}</div>}
          </section>
        </>
      )}

      <style>{`
        .profile-head { display: flex; gap: 24px; padding: 24px; border-radius: var(--radius); align-items: center; flex-wrap: wrap; }
        .avatar-lg {
          width: 96px; height: 96px; border-radius: 20px;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent));
          color: #0b0b12; display: flex; align-items: center; justify-content: center;
          font-size: 36px; font-weight: 800; overflow: hidden; flex-shrink: 0;
        }
        .avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; }
        .profile-info h1 { margin: 0; font-size: 26px; }
        .profile-info p { margin: 0; font-size: 13px; }
        .profile-info input {
          background: var(--panel-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 12px; color: var(--text); font-size: 14px;
          max-width: 340px; outline: none;
        }
        .btn-row { display: flex; gap: 8px; margin-top: 6px; }
        .btn.sm { padding: 6px 12px; font-size: 12px; }
        .mini-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .mini-card { display: flex; flex-direction: column; gap: 6px; }
        .mini-card img { width: 100%; aspect-ratio: 2/3; border-radius: 10px; object-fit: cover; }
        .mini-card span { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .loading-row { display: flex; align-items: center; gap: 10px; padding: 60px; justify-content: center; color: var(--text-muted); }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}