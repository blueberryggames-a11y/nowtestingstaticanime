import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, Search, X, Dices, User as UserIcon, LogOut, History,
  Bookmark, Settings as SettingsIcon, LogIn, UserPlus, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { searchAnime, getRandomAnime } from '../api/anilist.js';
import AuthModal from './AuthModal.jsx';

export default function Navbar({ onMenu }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const searchWrap = useRef(null);
  const profileWrap = useRef(null);
  const abortRef = useRef(null);

  // Debounced live suggestions, fetched from AniList.
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    const id = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await searchAnime({
          query,
          perPage: 8,
          signal: ctrl.signal,
          isSuggestion: true,
        });
        setSuggestions(res.media || []);
        setShowSuggest(true);
        setHighlight(-1);
      } catch (e) {
        if (e.name !== 'AbortError') console.warn(e);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onClick = (e) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target)) setShowSuggest(false);
      if (profileWrap.current && !profileWrap.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        document.getElementById('hoshii-search')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    setShowSuggest(false);
  };

  const onKeyDown = (e) => {
    if (!showSuggest || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      const item = suggestions[highlight];
      navigate(`/anime/${item.id}`);
      setShowSuggest(false);
      setQuery('');
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
    }
  };

  const randomAnime = async () => {
    try {
      const a = await getRandomAnime();
      if (a) navigate(`/anime/${a.id}`);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <>
      <header className="nav">
        <button className="icon-btn" onClick={onMenu} aria-label="Open menu">
          <Menu size={22} />
        </button>

        <Link to="/" className="brand" aria-label="Hoshii home">
          <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M20 14v36M20 32h14M44 14v36" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" fill="none"/>
            <circle cx="44" cy="20" r="3" fill="var(--accent)" />
          </svg>
          <span className="brand-text">
            HOSHII<em>.tv</em>
          </span>
        </Link>

        <form className="nav-search" onSubmit={submit} ref={searchWrap}>
          <Search size={18} className="search-icon" />
          <input
            id="hoshii-search"
            type="text"
            placeholder="Search Anime"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setShowSuggest(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            aria-label="Search anime"
          />
          {query && (
            <button
              type="button"
              className="icon-btn sm"
              aria-label="Clear"
              onClick={() => { setQuery(''); setSuggestions([]); setShowSuggest(false); }}
            >
              <X size={16} />
            </button>
          )}
          <span className="kbd">/</span>
          <button type="submit" className="icon-btn sm" aria-label="Search">
            <Search size={16} />
          </button>
          <button
            type="button"
            className="icon-btn sm"
            aria-label="Random anime"
            onClick={randomAnime}
          >
            <Dices size={16} />
          </button>

          {showSuggest && suggestions.length > 0 && (
            <div className="suggest glass">
              {suggestions.map((a, i) => (
                <button
                  key={a.id}
                  className={`suggest-row ${i === highlight ? 'active' : ''}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    navigate(`/anime/${a.id}`);
                    setShowSuggest(false);
                    setQuery('');
                  }}
                >
                  <img src={a.coverImage?.large} alt="" loading="lazy" />
                  <div className="suggest-info">
                    <span className="suggest-title">
                      {a.title?.english || a.title?.userPreferred || a.title?.romaji}
                    </span>
                    <span className="suggest-meta">
                      {a.seasonYear || '—'} · {a.format || '—'}
                      {a.averageScore ? ` · ★ ${a.averageScore}` : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="nav-right" ref={profileWrap}>
          {user ? (
            <>
              <button
                className="avatar-btn"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Open profile menu"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" />
                ) : (
                  <span className="avatar-fallback">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </span>
                )}
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="dropdown glass" onClick={() => setProfileOpen(false)}>
                  <Link to="/profile" className="dropdown-item">
                    <UserIcon size={16} /> Profile
                  </Link>
                  <Link to="/history" className="dropdown-item">
                    <History size={16} /> Watch History
                  </Link>
                  <Link to="/watchlist" className="dropdown-item">
                    <Bookmark size={16} /> Watchlist
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <SettingsIcon size={16} /> Settings
                  </Link>
                  <button
                    className="dropdown-item danger"
                    onClick={async () => { await signOut(); navigate('/'); }}
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="auth-buttons">
              <button className="btn ghost sm" onClick={() => setAuthOpen(true)}>
                <LogIn size={16} /> Log In
              </button>
              <button className="btn primary sm" onClick={() => setAuthOpen(true)}>
                <UserPlus size={16} /> Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <style>{`
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; gap: 16px;
          height: var(--navbar-h);
          padding: 0 20px;
          background: rgba(8,8,12,0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-soft);
        }
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          background: transparent; border: 1px solid transparent;
          color: var(--text); transition: var(--transition);
        }
        .icon-btn:hover { background: var(--panel-2); border-color: var(--border); }
        .icon-btn.sm { width: 30px; height: 30px; }
        .brand { display: flex; align-items: center; gap: 8px; font-weight: 800; letter-spacing: 0.5px; }
        .brand-text { font-size: 18px; }
        .brand-text em { color: var(--accent); font-style: normal; font-weight: 600; font-size: 11px; }
        .nav-search {
          position: relative; flex: 1; max-width: 720px; margin: 0 auto;
          display: flex; align-items: center; gap: 6px;
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 12px; padding: 0 8px 0 14px; height: 44px;
          transition: var(--transition);
        }
        .nav-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .nav-search input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text); font-size: 14px;
        }
        .search-icon { color: var(--text-muted); flex-shrink: 0; }
        .kbd {
          font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px;
          background: var(--panel-2); color: var(--text-muted);
          border: 1px solid var(--border);
        }
        .suggest {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0;
          border-radius: 12px; padding: 6px; z-index: 200;
          max-height: 420px; overflow-y: auto;
          animation: fadeIn 0.15s ease;
        }
        .suggest-row {
          display: flex; gap: 10px; align-items: center;
          padding: 8px; width: 100%; text-align: left;
          background: transparent; border: none; color: var(--text);
          border-radius: 8px; transition: var(--transition);
        }
        .suggest-row:hover, .suggest-row.active { background: var(--accent-soft); }
        .suggest-row img { width: 40px; height: 56px; object-fit: cover; border-radius: 6px; }
        .suggest-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .suggest-title { font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .suggest-meta { font-size: 11px; color: var(--text-muted); }
        .nav-right { display: flex; align-items: center; gap: 8px; position: relative; }
        .auth-buttons { display: flex; gap: 6px; }
        .btn.sm { padding: 8px 12px; font-size: 13px; }
        .avatar-btn {
          display: flex; align-items: center; gap: 6px;
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 10px; padding: 4px 8px 4px 4px; color: var(--text);
          transition: var(--transition);
        }
        .avatar-btn:hover { border-color: var(--accent); }
        .avatar-btn img { width: 28px; height: 28px; border-radius: 8px; object-fit: cover; }
        .avatar-fallback {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent));
          color: #0b0b12; font-weight: 700;
          display: flex; align-items: center; justify-content: center; font-size: 13px;
        }
        .dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          min-width: 220px; padding: 6px; border-radius: 12px; z-index: 200;
          animation: fadeIn 0.15s ease;
        }
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          background: transparent; border: none; color: var(--text);
          font-size: 13px; font-weight: 500; width: 100%; text-align: left;
          transition: var(--transition);
        }
        .dropdown-item:hover { background: var(--accent-soft); }
        .dropdown-item.danger { color: var(--danger); }
        @media (max-width: 720px) {
          .nav { padding: 0 12px; gap: 8px; }
          .brand-text { display: none; }
          .auth-buttons .btn span { display: none; }
          .kbd { display: none; }
        }
      `}</style>
    </>
  );
}