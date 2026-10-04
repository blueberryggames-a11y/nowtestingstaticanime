import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel.jsx';
import GenreBar from '../components/GenreBar.jsx';
import AnimeGrid from '../components/AnimeGrid.jsx';
import AnimeCard from '../components/AnimeCard.jsx';
import { AnimeCardSkeleton } from '../components/LoadingSkeleton.jsx';
import { useWatchHistory } from '../hooks/useWatchHistory.js';
import {
  getTrendingAnime, getPopularAnime, getTopRatedAnime,
  getNewestAnime, getCurrentlyAiring, getUpcoming, getMovies,
} from '../api/anilist.js';

export default function Home() {
  const [hero, setHero] = useState([]);
  const [tab, setTab] = useState('POPULAR');
  const [tabData, setTabData] = useState({ media: [] });
  const [tabLoading, setTabLoading] = useState(true);
  const [tabError, setTabError] = useState(null);
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const { history } = useWatchHistory();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const trending = await getTrendingAnime(1, 30);
        if (!alive) return;
        setHero((trending.media || []).slice(0, 5));
      } catch (e) {
        console.warn(e);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setTabLoading(true);
    setTabError(null);
    const loaders = {
      POPULAR: getPopularAnime,
      TRENDING: getTrendingAnime,
      TOP: getTopRatedAnime,
      NEWEST: getNewestAnime,
    };
    loaders[tab](1, 24)
      .then((res) => { if (alive) { setTabData(res); setTabLoading(false); } })
      .catch((e) => { if (alive) { setTabError(e); setTabLoading(false); } });
    return () => { alive = false; };
  }, [tab]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const results = {};
      const defs = [
        ['airing', getCurrentlyAiring],
        ['upcoming', getUpcoming],
        ['movies', getMovies],
      ];
      for (const [key, fn] of defs) {
        try {
          const res = await fn(1, 12);
          results[key] = res.media || [];
        } catch {
          results[key] = [];
        }
        if (!alive) return;
      }
      if (alive) { setSections(results); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="page home">
      <HeroCarousel items={hero} />

      <div className="container">
        <GenreBar />

        {history.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>Continue Watching</h2>
              <Link to="/history" className="btn ghost sm">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="history-row">
              {history.slice(0, 6).map((h) => (
                <Link
                  key={h.id || `${h.animeId}-${h.episode}`}
                  to={`/watch/${h.animeId}/${h.episode}`}
                  className="history-card"
                >
                  <div className="thumb" style={{ backgroundImage: `url(${h.image})` }}>
                    <span className="ep-badge">EP {h.episode}</span>
                    <div className="progress">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, ((h.position || 0) / (h.duration || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="history-title">{h.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-head">
            <h2>Browse Anime</h2>
            <div className="tabs">
              {[
                { key: 'NEWEST', label: 'Newest' },
                { key: 'POPULAR', label: 'Popular' },
                { key: 'TOP', label: 'Top Rated' },
                { key: 'TRENDING', label: 'Trending' },
              ].map((t) => (
                <button
                  key={t.key}
                  className={t.key === tab ? 'active' : ''}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <AnimeGrid
            anime={tabData.media || []}
            loading={tabLoading}
            error={tabError}
          />
        </section>

        <div className="two-col">
          <div className="main-col">
            <SectionBlock title="Currently Airing" items={sections.airing} loading={loading} />
            <SectionBlock title="Upcoming" items={sections.upcoming} loading={loading} />
            <SectionBlock title="Top Movies" items={sections.movies} loading={loading} />
          </div>

          <aside className="right-col">
            <SidebarPanel title="Top Airing">
              {(sections.airing || []).slice(0, 6).map((a) => <MiniRow key={a.id} anime={a} />)}
            </SidebarPanel>
            <SidebarPanel title="Trending Now">
              {hero.slice(0, 6).map((a) => <MiniRow key={a.id} anime={a} />)}
            </SidebarPanel>
          </aside>
        </div>
      </div>

      <style>{`
        .home { padding-top: 0; }
        .section { margin-top: 36px; }
        .history-row {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }
        .history-card { display: flex; flex-direction: column; gap: 8px; }
        .thumb {
          position: relative; aspect-ratio: 16/9; border-radius: 10px;
          background-size: cover; background-position: center;
          background-color: var(--panel); border: 1px solid var(--border-soft);
          overflow: hidden; transition: var(--transition);
        }
        .history-card:hover .thumb { border-color: var(--accent); }
        .ep-badge {
          position: absolute; top: 8px; left: 8px;
          background: rgba(0,0,0,0.75); color: #fff;
          font-size: 10px; font-weight: 700; padding: 3px 7px;
          border-radius: 5px; backdrop-filter: blur(4px);
        }
        .progress {
          position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
          background: rgba(0,0,0,0.55);
        }
        .progress-fill { height: 100%; background: var(--accent); }
        .history-title {
          margin: 0; font-size: 13px; font-weight: 600;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .two-col {
          display: grid; grid-template-columns: minmax(0, 1fr) 320px;
          gap: 28px; margin-top: 36px;
        }
        @media (max-width: 1000px) { .two-col { grid-template-columns: 1fr; } }
        .main-col { min-width: 0; }
        .right-col { display: flex; flex-direction: column; gap: 16px; }
        .btn.sm { padding: 6px 10px; font-size: 12px; }
      `}</style>
    </div>
  );
}

function SectionBlock({ title, items, loading }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      {loading ? (
        <div className="anime-grid">
          {Array.from({ length: 6 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="anime-grid">
          {items?.map((a) => <AnimeCard key={a.id} anime={a} />)}
        </div>
      )}
    </section>
  );
}

function SidebarPanel({ title, children }) {
  return (
    <div className="sidebar-panel glass">
      <h3>{title}</h3>
      <div className="mini-list">{children}</div>
      <style>{`
        .sidebar-panel { border-radius: var(--radius); padding: 14px; }
        .sidebar-panel h3 {
          margin: 0 0 12px; font-size: 14px; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--text-dim);
        }
        .mini-list { display: flex; flex-direction: column; gap: 8px; }
      `}</style>
    </div>
  );
}

function MiniRow({ anime }) {
  const title =
    anime.title?.english ||
    anime.title?.userPreferred ||
    anime.title?.romaji;
  return (
    <Link to={`/anime/${anime.id}`} className="mini-row">
      <img src={anime.coverImage?.large} alt="" loading="lazy" />
      <div className="mini-info">
        <span className="mini-title">{title}</span>
        <span className="mini-meta">
          {anime.format} · {anime.seasonYear || '—'}
          {anime.averageScore ? ` · ★ ${anime.averageScore}` : ''}
        </span>
      </div>
      <style>{`
        .mini-row {
          display: flex; gap: 10px; padding: 6px; border-radius: 8px;
          transition: var(--transition);
        }
        .mini-row:hover { background: var(--panel-2); }
        .mini-row img {
          width: 44px; height: 62px; object-fit: cover;
          border-radius: 6px; flex-shrink: 0;
        }
        .mini-info {
          min-width: 0; display: flex; flex-direction: column; gap: 3px;
          justify-content: center;
        }
        .mini-title {
          font-size: 12.5px; font-weight: 600; line-height: 1.25;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .mini-meta { font-size: 10.5px; color: var(--text-muted); }
      `}</style>
    </Link>
  );
}