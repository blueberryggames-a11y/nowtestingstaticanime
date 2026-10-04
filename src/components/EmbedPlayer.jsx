import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

// Iframe-based player.
// Receives events from MegaPlay via postMessage (documented channel "megacloud"
// and type "watching-log"). FilmU does not publish events, so we fall back to
// iframe visibility tracking for progress hints.

export default function EmbedPlayer({
  url,
  title,
  onProgress,
  onComplete,
  onError,
}) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const watchStart = useRef(Date.now());
  const lastReported = useRef(0);

  // Reset whenever the URL changes (server switch, episode change).
  useEffect(() => {
    setLoading(true);
    setError(null);
    watchStart.current = Date.now();
    lastReported.current = 0;
  }, [url]);

  // MegaPlay postMessage bridge.
  useEffect(() => {
    const handler = (event) => {
      const fromMega = event.origin === 'https://megaplay.buzz';
      const fromFilmu = event.origin === 'https://embed.filmu.in';
      if (!fromMega && !fromFilmu) return;

      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || typeof data !== 'object') return;

      if (data.event === 'time' && typeof data.time === 'number') {
        if (onProgress) onProgress(data.time, data.duration || 0);
        lastReported.current = Date.now();
      }
      if (data.event === 'complete') {
        if (onComplete) onComplete();
      }
      if (data.event === 'error') {
        setError('The player reported a playback error.');
        if (onError) onError(data);
      }
      if (data.type === 'watching-log' && typeof data.currentTime === 'number') {
        if (onProgress) onProgress(data.currentTime, data.duration || 0);
        lastReported.current = Date.now();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onProgress, onComplete, onError]);

  // Fallback heartbeat so history is still written for FilmU.
  useEffect(() => {
    const id = setInterval(() => {
      if (!onProgress) return;
      const sinceLast = Date.now() - lastReported.current;
      if (sinceLast > 15000) {
        const elapsed = Math.floor((Date.now() - watchStart.current) / 1000);
        onProgress(elapsed, 0);
      }
    }, 20000);
    return () => clearInterval(id);
  }, [onProgress]);

  if (!url) {
    return (
      <div className="player-empty">
        <AlertTriangle size={36} />
        <h3>No stream available for this episode</h3>
        <p className="muted">
          Neither server could resolve a source for this anime and episode.
          Try switching to the other server, or pick a different episode.
        </p>
        <style>{`
          .player-empty {
            aspect-ratio: 16/9; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 10px;
            background: linear-gradient(135deg, #0e0e16, #16161f);
            border: 1px solid var(--border); border-radius: 14px;
            padding: 40px; text-align: center;
          }
          .player-empty svg { color: var(--accent); }
          .player-empty h3 { margin: 0; font-size: 18px; }
          .player-empty p { margin: 0; max-width: 420px; font-size: 13px; line-height: 1.6; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="embed-player">
      {loading && (
        <div className="player-overlay">
          <Loader2 size={40} className="spin" />
          <p>Loading stream…</p>
        </div>
      )}

      {error && (
        <div className="player-overlay error">
          <AlertTriangle size={36} />
          <p>{error}</p>
          <button className="btn sm" onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Reload
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={url}
        title={title || 'Anime stream'}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError('Failed to load the player.'); }}
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="no-referrer"
      />

      <style>{`
        .embed-player {
          position: relative; width: 100%; aspect-ratio: 16/9;
          background: #000; border-radius: 14px; overflow: hidden;
          border: 1px solid var(--border);
        }
        .embed-player iframe {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
        }
        .player-overlay {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 12px;
          background: rgba(0,0,0,0.85); color: var(--accent);
          backdrop-filter: blur(6px);
        }
        .player-overlay p { margin: 0; color: var(--text-dim); font-size: 13px; }
        .player-overlay.error { color: var(--danger); }
        .btn.sm { padding: 6px 12px; font-size: 12px; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}