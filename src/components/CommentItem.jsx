import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Reply, Pencil, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { subscribeReplies, postReply, hasLiked, toggleLike } from '../firebase/firestore.js';

export default function CommentItem({
  comment, animeId, user, onLike, onEdit, onDelete, depth = 0,
}) {
  const [showReplies, setShowReplies] = useState(depth === 0);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!showReplies) return;
    const unsub = subscribeReplies(animeId, comment.id, setReplies);
    return () => unsub();
  }, [showReplies, animeId, comment.id]);

  useEffect(() => {
    if (!user) { setLiked(false); return; }
    hasLiked({ animeId, commentId: comment.id, uid: user.uid })
      .then(setLiked)
      .catch(() => {});
  }, [user, animeId, comment.id]);

  const postReplyHere = async () => {
    if (!user) return;
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      await postReply({ animeId, commentId: comment.id, user, text: replyText.trim() });
      setReplyText('');
    } catch (e) {
      console.warn(e);
    } finally {
      setPosting(false);
    }
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    await onEdit(editText.trim());
    setEditing(false);
  };

  const isMine = user && comment.authorId === user.uid;

  return (
    <div className={`comment ${depth > 0 ? 'nested' : ''}`}>
      <div className="comment-head">
        <div className="avatar-sm">
          {comment.authorAvatar
            ? <img src={comment.authorAvatar} alt="" />
            : (comment.authorName || 'U')[0].toUpperCase()}
        </div>
        <div className="name-row">
          <span className="name">{comment.authorName || 'Anonymous'}</span>
          <span className="dot">•</span>
          <span className="time">{timeAgo(comment.createdAt)}</span>
        </div>
      </div>

      <div className="comment-body">
        {editing ? (
          <div className="edit-wrap">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} />
            <div className="edit-actions">
              <button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        ) : (
          <p className="text">{comment.text}</p>
        )}
      </div>

      <div className="comment-actions">
        <button
          className={`action ${liked ? 'active' : ''}`}
          onClick={async () => {
            if (!user) { onLike?.(); return; }
            await onLike?.();
            setLiked(l => !l);
          }}
        >
          <ThumbsUp size={13} /> {comment.likeCount || 0}
        </button>
        <button className="action" disabled><ThumbsDown size={13} /></button>
        {depth < 2 && (
          <button className="action" onClick={() => setShowReplies(s => !s)}>
            <Reply size={13} /> Reply
          </button>
        )}
        {isMine && !editing && (
          <>
            <button className="action" onClick={() => setEditing(true)}><Pencil size={12} /> Edit</button>
            <button className="action danger" onClick={onDelete}><Trash2 size={12} /> Delete</button>
          </>
        )}
      </div>

      {depth < 2 && showReplies && (
        <div className="replies-wrap">
          {replies.length > 0 && (
            <div className="replies">
              {replies.map(r => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  animeId={animeId}
                  user={user}
                  depth={depth + 1}
                  onLike={async () => {
                    if (!user) return;
                    try {
                      await toggleLike({ animeId, commentId: r.id, uid: user.uid });
                    } catch (e) { console.warn(e); }
                  }}
                  onEdit={async (t) => {
                    const { editComment } = await import('../firebase/firestore.js');
                    await editComment(animeId, r.id, t);
                  }}
                  onDelete={async () => {
                    const { deleteComment } = await import('../firebase/firestore.js');
                    if (confirm('Delete this reply?')) await deleteComment(animeId, r.id);
                  }}
                />
              ))}
            </div>
          )}
          {user && (
            <div className="reply-editor">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                onKeyDown={(e) => e.key === 'Enter' && postReplyHere()}
              />
              <button className="btn primary sm" onClick={postReplyHere} disabled={posting}>
                {posting && <Loader2 size={12} className="spin" />} Reply
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .comment { padding: 12px 0; }
        .comment.nested {
          padding-left: 20px; margin-left: 14px;
          border-left: 1px solid var(--border-soft);
        }
        .comment-head { display: flex; align-items: center; gap: 10px; }
        .avatar-sm {
          width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent)); color: #0b0b12; font-weight: 700;
          font-size: 13px; overflow: hidden; flex-shrink: 0;
        }
        .avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
        .name-row { display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .name { font-weight: 600; }
        .dot, .time { color: var(--text-muted); font-size: 12px; }
        .comment-body { margin: 8px 0 8px 42px; }
        .text { margin: 0; font-size: 14px; line-height: 1.55; color: var(--text); white-space: pre-wrap; word-wrap: break-word; }
        .edit-wrap { display: flex; flex-direction: column; gap: 8px; }
        .edit-wrap textarea {
          background: var(--panel-2); border: 1px solid var(--border); border-radius: 8px;
          padding: 10px; color: var(--text); font-family: inherit; font-size: 14px; resize: vertical;
        }
        .edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .comment-actions { display: flex; gap: 4px; margin-left: 42px; }
        .action {
          background: transparent; border: none; color: var(--text-dim);
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;
          transition: var(--transition);
        }
        .action:hover:not(:disabled) { background: var(--panel-2); color: var(--text); }
        .action.active { color: var(--accent); }
        .action.danger { color: var(--danger); }
        .action:disabled { opacity: 0.5; cursor: default; }
        .replies-wrap { margin-left: 42px; margin-top: 6px; animation: fadeIn 0.2s ease; }
        .replies { display: flex; flex-direction: column; }
        .reply-editor { display: flex; gap: 8px; margin-top: 8px; }
        .reply-editor input {
          flex: 1; background: var(--panel-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 12px; color: var(--text); font-family: inherit; font-size: 13px;
          outline: none;
        }
        .reply-editor input:focus { border-color: var(--accent); }
        .btn.sm { padding: 6px 12px; font-size: 12px; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return 'just now';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)} months ago`;
  return `${Math.floor(s / 31536000)} years ago`;
}