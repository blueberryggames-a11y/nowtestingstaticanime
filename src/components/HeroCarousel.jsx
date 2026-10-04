import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Info, Play, Star, Clock } from 'lucide-react';

export default function HeroCarousel({ items = [] }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (paused || hovered || items.length <= 1) return;
    timer.current = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer.current);
  }, [paused, hovered, items.length]);

  if (!items.length) return null;
  const current = items[index];
  const title = current.title?.userPreferred || current.title?.english || current.title?.romaji;
  const banner = current.bannerImage || current.coverImage?.extraLarge;

  const desc = (current.description || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  return (
    <div
      className="hero"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${banner})` }}
      />
      <div className="hero-shade" />
      <div className="hero-content container">
        <div className="hero-meta">
          {current.format && <span className="pill">{current.format}</span>}
          {current.averageScore && (
            <span className="pill gold"><Star size={12} /> {current.averageScore}</span>
          )}
          {current.duration && (
            <span className="pill"><Clock size={12} /> {current.duration} mins</span>
          )}
        </div>
        <h1>{title}</h1>
        <p className="hero-desc">{desc.slice(0, 320)}{desc.length > 320 ? '…' : ''}</p>
        <div className="hero-actions">
          <button className="btn" onClick={() => navigate(`/anime/${current.id}`)}>
            <Info size={16} /> Details
          </button>
          <button className="btn primary" onClick={() => navigate(`/watch/${current.id}`)}>
            <Play size={16} /> Watch Now
          </button>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            className="hero-nav left"
            aria-label="Previous"
            onClick={() => { setIndex(i => (i - 1 + items.length) % items.length); setPaused(true); }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="hero-nav right"
            aria-label="Next"
            onClick={() => { setIndex(i => (i + 1) % items.length); setPaused(true); }}
          >
            <ChevronRight size={22} />
          </button>
          <div className="hero-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={i === index ? 'active' : ''}
                onClick={() => { setIndex(i); setPaused(true); }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        .hero {
          position: relative; width: 100%; aspect-ratio: 21/9; min-height: 380px; max-height: 620px;
          overflow: hidden; border-bottom: 1px solid var(--border-soft);
        }
        .hero-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          filter: blur(1px);
          transform: scale(1.03);
        }
        .hero-shade {
          position: absolute; inset: 0;
          background:
            linear-gradient(to top, rgba(8,8,12,0.98) 0%, rgba(8,8,12,0.5) 40%, rgba(8,8,12,0.2) 70%, rgba(8,8,12,0.7) 100%),
            linear-gradient(to right, rgba(8,8,12,0.85) 0%, transparent 60%);
        }
        .hero-content {
          position: absolute; left: 0; right: 0; bottom: 40px;
          max-width: 720px; padding: 0 40px;
          display: flex; flex-direction: column; gap: 12px;
          animation: fadeIn 0.5s ease;
        }
        .hero-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          color: #fff; font-size: 12px; font-weight: 600;
          padding: 5px 10px; border-radius: 999px; backdrop-filter: blur(8px);
        }
        .pill.gold { color: #fcd34d; border-color: rgba(252,211,77,0.3); }
        .hero h1 {
          margin: 0; font-size: clamp(28px, 4.5vw, 52px); font-weight: 800;
          letter-spacing: -0.02em; line-height: 1.05;
          text-shadow: 0 4px 30px rgba(0,0,0,0.7);
        }
        .hero-desc { margin: 0; font-size: 14px; line-height: 1.6; color: #d6d6e2; max-width: 640px; }
        .hero-actions { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .hero-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(255,255,255,0.15);
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.25s;
        }
        .hero:hover .hero-nav { opacity: 1; }
        .hero-nav.left { left: 16px; }
        .hero-nav.right { right: 16px; }
        .hero-nav:hover { background: var(--accent); color: #0b0b12; }
        .hero-dots {
          position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px;
        }
        .hero-dots button {
          width: 24px; height: 4px; border-radius: 4px; border: none;
          background: rgba(255,255,255,0.25); transition: var(--transition);
        }
        .hero-dots button.active { background: var(--accent); width: 32px; }
        @media (max-width: 720px) {
          .hero { aspect-ratio: 4/5; min-height: 460px; }
          .hero-content { padding: 0 20px; bottom: 20px; }
          .hero-desc { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        }
      `}</style>
    </div>
  );
}