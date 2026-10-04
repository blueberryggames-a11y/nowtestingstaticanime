import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Server, Languages } from 'lucide-react';
import { PROVIDERS } from '../data/streamProviders.js';

export default function ServerSelector({
  providerId, language, onProviderChange, onLanguageChange, status,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const provider = PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];

  return (
    <div className="server-selector" ref={wrapRef}>
      <button
        className="server-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Server size={14} />
        <span className="label">{provider.label}</span>
        <span className="status-dot" data-status={status || 'idle'} />
        <ChevronDown size={14} className={open ? 'rot' : ''} />
      </button>

      <div className="language-toggle" role="group" aria-label="Language">
        {provider.languages.map((lang) => (
          <button
            key={lang}
            className={lang === language ? 'active' : ''}
            onClick={() => onLanguageChange(lang)}
          >
            <Languages size={12} />
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {open && (
        <div className="server-menu glass" role="listbox">
          <div className="menu-head">Servers</div>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              className={`server-item ${p.id === provider.id ? 'active' : ''}`}
              role="option"
              aria-selected={p.id === provider.id}
              onClick={() => {
                onProviderChange(p.id);
                setOpen(false);
              }}
            >
              <div className="item-info">
                <span className="item-label">{p.label}</span>
                <span className="item-langs">
                  {p.languages.map((l) => l.toUpperCase()).join(' · ')}
                </span>
              </div>
              {p.id === provider.id && <Check size={14} />}
            </button>
          ))}
          <div className="menu-foot">
            Both servers are third-party embeds. Hoshii does not host video.
          </div>
        </div>
      )}

      <style>{`
        .server-selector {
          position: relative; display: flex; align-items: center; gap: 8px;
        }
        .server-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--panel); border: 1px solid var(--border);
          color: var(--text); font-size: 13px; font-weight: 600;
          padding: 8px 12px; border-radius: 10px; transition: var(--transition);
        }
        .server-btn:hover { border-color: var(--accent); }
        .server-btn .label { min-width: 60px; text-align: left; }
        .server-btn svg.rot { transform: rotate(180deg); }
        .status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--text-muted); flex-shrink: 0;
        }
        .status-dot[data-status='ready'] { background: #4ade80; }
        .status-dot[data-status='loading'] { background: #fcd34d; }
        .status-dot[data-status='error'] { background: var(--danger); }
        .language-toggle {
          display: inline-flex; background: var(--panel); border: 1px solid var(--border);
          border-radius: 10px; padding: 3px; gap: 2px;
        }
        .language-toggle button {
          display: inline-flex; align-items: center; gap: 4px;
          background: transparent; border: none; color: var(--text-dim);
          font-weight: 700; font-size: 11px; padding: 6px 10px; border-radius: 7px;
          transition: var(--transition);
        }
        .language-toggle button.active { background: var(--accent-soft); color: var(--accent); }
        .language-toggle button:hover:not(.active) { color: var(--text); }
        .server-menu {
          position: absolute; top: calc(100% + 8px); left: 0;
          min-width: 260px; border-radius: 12px; padding: 6px; z-index: 50;
          animation: fadeIn 0.15s ease;
        }
        .menu-head {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-muted); padding: 8px 10px 4px; font-weight: 700;
        }
        .server-item {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 10px 12px; border-radius: 8px;
          background: transparent; border: none; color: var(--text);
          text-align: left; transition: var(--transition);
        }
        .server-item:hover { background: var(--accent-soft); }
        .server-item.active { background: var(--accent-soft); color: var(--accent); }
        .item-info { display: flex; flex-direction: column; gap: 2px; }
        .item-label { font-size: 13px; font-weight: 600; }
        .item-langs { font-size: 10px; color: var(--text-muted); letter-spacing: 0.06em; }
        .menu-foot {
          font-size: 10.5px; color: var(--text-muted); padding: 8px 12px 6px;
          border-top: 1px solid var(--border-soft); margin-top: 4px; line-height: 1.5;
        }
      `}</style>
    </div>
  );
}