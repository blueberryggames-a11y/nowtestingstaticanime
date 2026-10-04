import { createContext, useContext, useEffect, useState } from 'react';

const defaults = {
  accent: '#a78bfa',
  reducedMotion: false,
  autoplay: true,
  autoNext: true,
  subtitleLang: 'en',
  streamProvider: 'megaplay',
  streamLanguage: 'sub',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('hoshii:settings');
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('hoshii:settings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--accent', settings.accent);
    document.documentElement.style.setProperty(
      '--accent-soft',
      hexToRgba(settings.accent, 0.15)
    );
  }, [settings]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const reset = () => setSettings(defaults);

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(
    h.length === 3 ? h.split('').map((c) => c + c).join('') : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}