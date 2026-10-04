import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <svg width="24" height="24" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M20 14v36M20 32h14M44 14v36" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" fill="none"/>
              <circle cx="44" cy="20" r="3" fill="var(--accent)" />
            </svg>
            <span>HOSHII</span>
          </div>
          <p className="muted footer-desc">
            Hoshii is an anime discovery interface. Anime metadata is provided by the
            AniList GraphQL API. Hoshii does not host or stream any video files.
          </p>
        </div>
        <div>
          <h4>Browse</h4>
          <Link to="/">Home</Link>
          <Link to="/trending">Trending</Link>
          <Link to="/schedule">Schedule</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/profile">Profile</Link>
          <Link to="/watchlist">Watchlist</Link>
          <Link to="/settings">Settings</Link>
        </div>
        <div>
          <h4>About</h4>
          <a href="https://anilist.co" target="_blank" rel="noreferrer">AniList</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          <Link to="/search">Search</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span className="muted-2">© {new Date().getFullYear()} Hoshii</span>
        <span className="muted-2">Data provided by AniList</span>
      </div>

      <style>{`
        .footer {
          margin-top: 60px;
          border-top: 1px solid var(--border-soft);
          background: var(--bg-soft);
          padding: 40px 0 20px;
        }
        .footer-grid {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px;
        }
        .footer-grid h4 { font-size: 13px; margin: 0 0 12px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-dim); }
        .footer-grid a { display: block; padding: 4px 0; color: var(--text-dim); font-size: 13px; }
        .footer-grid a:hover { color: var(--accent); }
        .footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; margin-bottom: 12px; }
        .footer-desc { font-size: 13px; max-width: 420px; line-height: 1.6; }
        .footer-bottom {
          margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-soft);
          display: flex; justify-content: space-between; font-size: 12px;
        }
        @media (max-width: 720px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </footer>
  );
}