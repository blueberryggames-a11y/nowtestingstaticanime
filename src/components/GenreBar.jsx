import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GENRES } from '../api/anilist.js';

export default function GenreBar() {
  const nav = useNavigate();
  const ref = useRef(null);

  const scroll = (dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * 400, behavior: 'smooth' });
  };

  return (
    <div className="genre-bar">
      <button className="genre-nav" onClick={() => scroll(-1)} aria-label="Scroll left">
        <ChevronLeft size={18} />
      </button>
      <div className="genre-scroll" ref={ref}>
        {GENRES.map((g) => (
          <button
            key={g}
            className="genre-chip"
            onClick={() => nav(`/search?genre=${encodeURIComponent(g)}`)}
          >
            {g}
          </button>
        ))}
      </div>
      <button className="genre-nav" onClick={() => scroll(1)} aria-label="Scroll right">
        <ChevronRight size={18} />
      </button>

      <style>{`
        .genre-bar {
          display: flex; align-items: center; gap: 8px;
          margin: 24px 0 8px;
        }
        .genre-scroll {
          flex: 1; display: flex; gap: 8px; overflow-x: auto;
          scrollbar-width: none; scroll-behavior: smooth;
        }
        .genre-scroll::-webkit-scrollbar { display: none; }
        .genre-chip {
          flex: 0 0 auto; padding: 8px 16px; border-radius: 999px;
          background: var(--panel); border: 1px solid var(--border);
          color: var(--text-dim); font-weight: 600; font-size: 13px;
          transition: var(--transition);
        }
        .genre-chip:hover {
          background: var(--accent-soft); color: var(--text); border-color: var(--accent);
          transform: translateY(-1px);
        }
        .genre-nav {
          flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%;
          background: var(--panel); border: 1px solid var(--border); color: var(--text);
          display: flex; align-items: center; justify-content: center;
          transition: var(--transition);
        }
        .genre-nav:hover { background: var(--accent-soft); border-color: var(--accent); }
      `}</style>
    </div>
  );
}