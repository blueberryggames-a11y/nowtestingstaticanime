import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseConfigured } from '../firebase/config.js';

export default function AuthModal({ open, onClose, initialMode = 'login' }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(''); setInfo('');
    }
  }, [open, initialMode]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    try {
      if (!firebaseConfigured) throw new Error('Firebase not configured. See README.');
      if (mode === 'login') {
        await signIn(email, password);
        onClose();
      } else if (mode === 'signup') {
        await signUp(email, password, displayName);
        onClose();
      } else if (mode === 'reset') {
        await resetPassword(email);
        setInfo('Password reset email sent.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset password'}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {!firebaseConfigured && (
          <div className="notice">
            Firebase isn't configured yet. Add your keys to <code>.env</code> —
            see the README for setup steps.
          </div>
        )}

        <form onSubmit={submit} className="modal-form">
          {mode === 'signup' && (
            <label>
              Display name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                minLength={2}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          {mode !== 'reset' && (
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
          )}

          {error && <div className="error">{error}</div>}
          {info && <div className="info">{info}</div>}

          <button className="btn primary full" disabled={busy} type="submit">
            {busy && <Loader2 size={16} className="spin" />}
            {mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
          </button>
        </form>

        <div className="modal-foot">
          {mode === 'login' && (
            <>
              <button className="link-btn" onClick={() => setMode('reset')}>Forgot password?</button>
              <span className="muted">New here? </span>
              <button className="link-btn accent" onClick={() => setMode('signup')}>Sign up</button>
            </>
          )}
          {mode === 'signup' && (
            <>
              <span className="muted">Have an account? </span>
              <button className="link-btn accent" onClick={() => setMode('login')}>Log in</button>
            </>
          )}
          {mode === 'reset' && (
            <button className="link-btn accent" onClick={() => setMode('login')}>Back to login</button>
          )}
        </div>

        <style>{`
          .modal-backdrop {
            position: fixed; inset: 0; z-index: 300;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center; padding: 20px;
            animation: fadeIn 0.2s ease;
          }
          .modal {
            width: 100%; max-width: 420px; border-radius: 16px;
            padding: 24px; animation: fadeIn 0.25s ease;
          }
          .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
          .modal-head h2 { margin: 0; font-size: 20px; }
          .modal-form { display: flex; flex-direction: column; gap: 14px; }
          .modal-form label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--text-dim); font-weight: 500; }
          .modal-form input {
            background: var(--panel-2); border: 1px solid var(--border);
            border-radius: 10px; padding: 12px 14px; color: var(--text);
            font-size: 14px; outline: none; transition: var(--transition);
          }
          .modal-form input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
          .full { width: 100%; justify-content: center; padding: 12px; }
          .error { padding: 10px; background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.35); color: var(--danger); border-radius: 8px; font-size: 13px; }
          .info { padding: 10px; background: var(--accent-soft); border: 1px solid var(--accent); border-radius: 8px; font-size: 13px; color: var(--accent); }
          .notice { padding: 10px; background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3); border-radius: 8px; font-size: 12px; color: var(--blue); margin-bottom: 16px; }
          .notice code { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; }
          .modal-foot { margin-top: 18px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; }
          .link-btn { background: transparent; border: none; color: var(--text-dim); font-size: 13px; padding: 2px; }
          .link-btn.accent { color: var(--accent); font-weight: 600; }
          .link-btn:hover { text-decoration: underline; }
          .spin { animation: spin 0.9s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}