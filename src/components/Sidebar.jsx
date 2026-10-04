import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, TrendingUp, Search as SearchIcon, Calendar, History,
  Bookmark, Settings as SettingsIcon, User as UserIcon, X, Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/seasonal', label: 'Seasonal Anime', icon: Compass },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/history', label: 'Watch History', icon: History },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="sidebar-head">
          <div className="sidebar-brand">
            <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M20 14v36M20 32h14M44 14v36" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" fill="none"/>
              <circle cx="44" cy="20" r="3" fill="var(--accent)" />
            </svg>
            <span>HOSHII</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            {user ? (
              <>
                <div className="avatar-sm">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" />
                    : (user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="meta">
                  <span className="name">{user.displayName || 'User'}</span>
                  <span className="email">{user.email}</span>
                </div>
              </>
            ) : (
              <span className="muted">Not signed in</span>
            )}
          </div>
          <div className="version">Hoshii · v1.0.0</div>
        </div>
      </aside>

      <style>{`
        .sidebar-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          opacity: 0; pointer-events: none; transition: var(--transition); z-index: 150;
        }
        .sidebar-backdrop.show { opacity: 1; pointer-events: auto; }
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
          background: rgba(14,14,20,0.96);
          backdrop-filter: blur(24px);
          border-right: 1px solid var(--border);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          display: flex; flex-direction: column; z-index: 200;
        }
        .sidebar.open { transform: translateX(0); }
        .sidebar-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--border-soft);
        }
        .sidebar-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: 0.5px; }
        .sidebar-nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
        .sidebar-link {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 10px;
          color: var(--text-dim); font-weight: 600; font-size: 14px;
          border-left: 2px solid transparent;
          transition: var(--transition);
        }
        .sidebar-link:hover { background: var(--panel); color: var(--text); }
        .sidebar-link.active {
          background: var(--accent-soft); color: var(--text);
          border-left-color: var(--accent);
        }
        .sidebar-foot {
          padding: 14px 20px; border-top: 1px solid var(--border-soft);
          display: flex; flex-direction: column; gap: 12px;
        }
        .sidebar-user { display: flex; align-items: center; gap: 10px; }
        .avatar-sm {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent));
          color: #0b0b12; font-weight: 700; display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-user .meta { display: flex; flex-direction: column; min-width: 0; }
        .sidebar-user .name { font-size: 13px; font-weight: 600; }
        .sidebar-user .email { font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; }
        .version { font-size: 11px; color: var(--text-muted); text-align: center; }
      `}</style>
    </>
  );
}