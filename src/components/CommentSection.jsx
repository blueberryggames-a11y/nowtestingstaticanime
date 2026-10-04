import { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare, Loader2, ThumbsUp, Reply, Trash2, Pencil, LogIn, UserPlus, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import CommentItem from './CommentItem.jsx';
import {
  subscribeComments, postComment, deleteComment, editComment, toggleLike,
} from '../firebase/firestore.js';
import { firebaseConfigured } from '../firebase/config.js';

export default function CommentSection({ animeId, episode, animeTitle }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeComments(animeId, (list) => {
      setComments(list);
      setLoading(false);
    });
    return () => unsub();
  }, [animeId]);

  const sorted = useMemo(() => {
    const list = [...comments];
    if (sort === 'newest') list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    if (sort === 'oldest') list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    if (sort === 'top') list.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    return list;
  }, [comments, sort]);

  const submit = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!text.trim()) return;
    setBusy(true); setError('');
    try {
      await postComment({ animeId, episode, user, text: text.trim() });
      setText('');
    } catch (e) {
      setError(e.message || 'Failed to post comment.');
    } finally {
      setBusy(false);
    }
  };

  const total = comments.length + comments.reduce((n, c) => n + (c.replyCount || 0), 0);

  return (
    <section className="comments">
      <div className="comments-head">
        <div>
          <h2>The Anime Community</h2>
          <p className="muted">Discuss {animeTitle}{episode ? ` — Episode ${episode}` : ''}</p>
        </div>
        <span className="chip">
          <MessageSquare size={14} /> {total} Comments
        </span>
      </div>

      <div className="comments-toolbar">
        <button className="ghost-link" type="button"><HelpCircle size={14} /> Rules</button>
        <button className="ghost-link" type="button">FAQ</button>
        <div className="spacer" />
        <label className="sort-label">
          Sort by:
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="top">Top</option>
          </select>
        </label>
      </div>

      {!firebaseConfigured && (
        <div className="notice">
          Firebase isn't configured. Add your keys to <code>.env</code> to enable comments.
        </div>
      )}

      <div className="comment-editor glass">
        {user ? (
          <>
            <div className="editor-user">
              <div className="avatar-sm">
                {user.photoURL ? <img src={user.photoURL} alt="" /> : (user.displayName || 'U')[0].toUpperCase()}
              </div>
              <span>{user.displayName || 'User'}</span>
            </div>
            <textarea
              placeholder="Share your thoughts..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={3000}
            />
            {error && <div className="error">{error}</div>}
            <div className="editor-actions">
              <span className="muted-2">{text.length} / 3000</span>
              <button className="btn primary" onClick={submit} disabled={busy || !text.trim()}>
                {busy && <Loader2 size={14} className="spin" />} Post Comment
              </button>
            </div>
          </>
        ) : (
          <div className="logged-out">
            <p>Log in to comment</p>
            <div className="btn-row">
              <button className="btn" onClick={() => setAuthOpen(true)}><LogIn size={14} /> Log In</button>
              <button className="btn primary" onClick={() => setAuthOpen(true)}><UserPlus size={14} /> Sign Up</button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-row"><Loader2 size={20} className="spin" /> Loading comments…</div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">No comments yet. Be the first to share your thoughts.</div>
      ) : (
        <div className="comment-list">
          {sorted.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              animeId={animeId}
              user={user}
              onLike={async () => {
                if (!user) { setAuthOpen(true); return; }
                try { await toggleLike({ animeId, commentId: c.id, uid: user.uid }); }
                catch (e) { console.warn(e); }
              }}
              onEdit={async (newText) => {
                await editComment(animeId, c.id, newText);
              }}
              onDelete={async () => {
                if (!confirm('Delete this comment?')) return;
                await deleteComment(animeId, c.id);
              }}
            />
          ))}
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <style>{`
        .comments {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 22px; margin-top: 24px;
        }
        .comments-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .comments-head h2 { margin: 0 0 4px; font-size: 20px; }
        .comments-head p { margin: 0; font-size: 13px; }
        .comments-toolbar {
          display: flex; align-items: center; gap: 14px; margin: 16px 0;
          padding-bottom: 14px; border-bottom: 1px solid var(--border-soft);
        }
        .ghost-link { background: transparent; border: none; color: var(--text-dim); font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
        .ghost-link:hover { color: var(--accent); }
        .spacer { flex: 1; }
        .sort-label { font-size: 13px; color: var(--text-dim); display: inline-flex; align-items: center; gap: 8px; }
        .sort-label select { background: var(--panel-2); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; font-size: 13px; }
        .comment-editor { border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .editor-user { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; }
        .avatar-sm {
          width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent)); color: #0b0b12; font-weight: 700; overflow: hidden;
        }
        .avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
        .comment-editor textarea {
          background: transparent; border: none; outline: none; color: var(--text);
          font-family: inherit; font-size: 14px; resize: vertical; min-height: 60px;
        }
        .editor-actions { display: flex; align-items: center; justify-content: space-between; }
        .logged-out { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px; }
        .logged-out p { margin: 0; font-weight: 600; }
        .btn-row { display: flex; gap: 10px; }
        .comment-list { display: flex; flex-direction: column; gap: 6px; margin-top: 18px; }
        .loading-row { display: flex; align-items: center; gap: 10px; padding: 30px; justify-content: center; color: var(--text-muted); }
        .notice { padding: 10px; background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3); border-radius: 8px; font-size: 12px; color: var(--blue); }
        .notice code { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; }
        .error { color: var(--danger); font-size: 13px; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}