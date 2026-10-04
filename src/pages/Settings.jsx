import { RotateCcw, LogOut } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { PROVIDERS } from '../data/streamProviders.js';
import { clearAniListCache } from '../api/anilist.js';

const ACCENTS = [
  { name: 'Lavender', value: '#a78bfa' },
  { name: 'Cyan', value: '#67e8f9' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Orange', value: '#fb923c' },
];

export default function Settings() {
  const { settings, update, reset } = useSettings();
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  // Languages supported across all providers, deduped.
  const allLanguages = Array.from(
    new Set(PROVIDERS.flatMap((p) => p.languages))
  );

  return (
    <div className="page container settings">
      <h1>Settings</h1>

      <section className="settings-card glass">
        <h2>Appearance</h2>
        <div className="setting-row">
          <div>
            <label>Accent color</label>
            <p className="muted">Choose the highlight color used throughout Hoshii.</p>
          </div>
          <div className="accent-swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                className={`swatch ${settings.accent === a.value ? 'active' : ''}`}
                style={{ background: a.value }}
                onClick={() => update({ accent: a.value })}
                aria-label={a.name}
              />
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <label>Reduced motion</label>
            <p className="muted">Disable animations and transitions.</p>
          </div>
          <Toggle
            checked={settings.reducedMotion}
            onChange={(v) => update({ reducedMotion: v })}
          />
        </div>
      </section>

      <section className="settings-card glass">
        <h2>Playback</h2>
        <div className="setting-row">
          <div>
            <label>Autoplay</label>
            <p className="muted">Start playing as soon as the page loads.</p>
          </div>
          <Toggle
            checked={settings.autoplay}
            onChange={(v) => update({ autoplay: v })}
          />
        </div>
        <div className="setting-row">
          <div>
            <label>Auto Next</label>
            <p className="muted">Automatically continue to the next episode.</p>
          </div>
          <Toggle
            checked={settings.autoNext}
            onChange={(v) => update({ autoNext: v })}
          />
        </div>
        <div className="setting-row">
          <div>
            <label>Subtitle Language</label>
            <p className="muted">Default subtitle track when available.</p>
          </div>
          <select
            value={settings.subtitleLang}
            onChange={(e) => update({ subtitleLang: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="off">Off</option>
          </select>
        </div>
      </section>

      <section className="settings-card glass">
        <h2>Streaming</h2>
        <div className="setting-row">
          <div>
            <label>Default server</label>
            <p className="muted">Preferred embed provider on the watch page.</p>
          </div>
          <select
            value={settings.streamProvider || 'megaplay'}
            onChange={(e) => update({ streamProvider: e.target.value })}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-row">
          <div>
            <label>Default language</label>
            <p className="muted">
              Sub or dub, when the selected server supports it.
            </p>
          </div>
          <select
            value={settings.streamLanguage || 'sub'}
            onChange={(e) => update({ streamLanguage: e.target.value })}
          >
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-row">
          <div>
            <label>Available servers</label>
            <p className="muted">
              Hoshii embeds third-party players. It never hosts or proxies video.
            </p>
          </div>
          <div className="server-pills">
            {PROVIDERS.map((p) => (
              <span key={p.id} className="chip">
                {p.label}
                <span className="langs">
                  {p.languages.map((l) => l.toUpperCase()).join(' · ')}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-card glass">
        <h2>Data</h2>
        <div className="setting-row">
          <div>
            <label>Clear AniList cache</label>
            <p className="muted">
              Forces the next page load to re-fetch all anime data from AniList.
              Cached entries are otherwise refreshed automatically in the background.
            </p>
          </div>
          <button
            className="btn"
            onClick={() => {
              clearAniListCache();
              alert('AniList cache cleared. Reload to fetch fresh data.');
            }}
          >
            <RotateCcw size={14} /> Clear
          </button>
        </div>
        <div className="setting-row">
          <div>
            <label>Clear local cache</label>
            <p className="muted">
              Removes locally stored settings, cache, and logged-out watch history.
            </p>
          </div>
          <button
            className="btn"
            onClick={() => {
              if (confirm('Clear local cache and preferences?')) {
                localStorage.clear();
                reset();
              }
            }}
          >
            <RotateCcw size={14} /> Clear
          </button>
        </div>
        {user && (
          <div className="setting-row">
            <div>
              <label>Log out</label>
              <p className="muted">Sign out of your Hoshii account.</p>
            </div>
            <button
              className="btn"
              onClick={async () => {
                await signOut();
                nav('/');
              }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        )}
      </section>

      <style>{`
        h1 { margin: 0 0 20px; font-size: 28px; }
        .settings { display: flex; flex-direction: column; gap: 20px; }
        .settings-card { border-radius: var(--radius); padding: 22px; }
        .settings-card h2 {
          margin: 0 0 16px; font-size: 16px; letter-spacing: 0.02em;
        }
        .setting-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; padding: 14px 0; border-top: 1px solid var(--border-soft);
          flex-wrap: wrap;
        }
        .setting-row:first-of-type { border-top: none; }
        .setting-row label {
          font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;
        }
        .setting-row p { margin: 0; font-size: 12.5px; max-width: 440px; }
        .setting-row select {
          background: var(--panel-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 12px; color: var(--text);
          font-size: 13px; outline: none; transition: var(--transition);
        }
        .setting-row select:focus { border-color: var(--accent); }
        .accent-swatches { display: flex; gap: 8px; }
        .swatch {
          width: 30px; height: 30px; border-radius: 50%;
          border: 2px solid transparent; transition: var(--transition);
        }
        .swatch.active { border-color: var(--text); transform: scale(1.1); }
        .server-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .server-pills .chip {
          background: var(--panel-2); border: 1px solid var(--border);
          color: var(--text-dim); font-weight: 600; padding: 6px 10px;
          border-radius: 999px; display: inline-flex; align-items: center; gap: 8px;
        }
        .server-pills .langs {
          font-size: 10px; color: var(--text-muted);
          letter-spacing: 0.06em; font-weight: 700;
        }
      `}</style>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="knob" />
      <style>{`
        .toggle {
          width: 46px; height: 26px; border-radius: 999px;
          background: var(--panel-2); border: 1px solid var(--border);
          padding: 2px; display: flex; align-items: center;
          transition: var(--transition); position: relative;
        }
        .toggle .knob {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--text-dim); transition: var(--transition);
        }
        .toggle.on { background: var(--accent); border-color: var(--accent); }
        .toggle.on .knob { background: #0b0b12; transform: translateX(20px); }
      `}</style>
    </button>
  );
}