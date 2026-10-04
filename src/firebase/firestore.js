import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc, getDocs,
  query, orderBy, limit, startAfter, where, serverTimestamp, onSnapshot,
  increment, writeBatch,
} from 'firebase/firestore';
import { db, firebaseConfigured } from './config.js';

function ensure() {
  if (!firebaseConfigured || !db) {
    throw new Error(
      'Firebase is not configured. Add your credentials to a .env file (see README).'
    );
  }
}

/* ---------- Watchlist ---------- */

export async function addToWatchlist(uid, anime, status = 'PLANNED') {
  ensure();
  const ref = doc(db, 'users', uid, 'watchlist', String(anime.id));
  await setDoc(ref, {
    animeId: anime.id,
    title: anime.title?.userPreferred || anime.title?.romaji || anime.title?.english,
    coverImage: anime.coverImage?.large || anime.coverImage?.extraLarge,
    format: anime.format,
    episodes: anime.episodes || null,
    score: anime.averageScore || null,
    seasonYear: anime.seasonYear || null,
    status,
    addedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeFromWatchlist(uid, animeId) {
  ensure();
  await deleteDoc(doc(db, 'users', uid, 'watchlist', String(animeId)));
}

export async function getWatchlist(uid) {
  ensure();
  const snap = await getDocs(collection(db, 'users', uid, 'watchlist'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function isInWatchlist(uid, animeId) {
  ensure();
  const snap = await getDoc(doc(db, 'users', uid, 'watchlist', String(animeId)));
  return snap.exists() ? snap.data() : null;
}

/* ---------- Favorites ---------- */

export async function addFavorite(uid, anime) {
  ensure();
  await setDoc(doc(db, 'users', uid, 'favorites', String(anime.id)), {
    animeId: anime.id,
    title: anime.title?.userPreferred || anime.title?.romaji,
    coverImage: anime.coverImage?.large || anime.coverImage?.extraLarge,
    addedAt: serverTimestamp(),
  });
}

export async function removeFavorite(uid, animeId) {
  ensure();
  await deleteDoc(doc(db, 'users', uid, 'favorites', String(animeId)));
}

export async function getFavorites(uid) {
  ensure();
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ---------- History ---------- */

export async function saveHistory(uid, entry) {
  ensure();
  const id = `${entry.animeId}_${entry.episode}`;
  await setDoc(doc(db, 'users', uid, 'history', id), {
    ...entry,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getHistory(uid) {
  ensure();
  const q = query(
    collection(db, 'users', uid, 'history'),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteHistoryEntry(uid, entryId) {
  ensure();
  await deleteDoc(doc(db, 'users', uid, 'history', entryId));
}

/* ---------- Preferences ---------- */

export async function savePreferences(uid, prefs) {
  ensure();
  await setDoc(doc(db, 'users', uid), { preferences: prefs }, { merge: true });
}

/* ---------- Comments ---------- */

const commentsRef = (animeId) =>
  collection(db, 'animeComments', String(animeId), 'comments');

export async function postComment({ animeId, episode, user, text, parentId = null }) {
  ensure();
  const now = serverTimestamp();
  await addDoc(commentsRef(animeId), {
    authorId: user.uid,
    authorName: user.displayName || 'Anonymous',
    authorAvatar: user.photoURL || null,
    text,
    episode: episode ?? null,
    parentId,
    likeCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export async function editComment(animeId, commentId, text) {
  ensure();
  await updateDoc(doc(db, 'animeComments', String(animeId), 'comments', commentId), {
    text,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(animeId, commentId) {
  ensure();
  await deleteDoc(doc(db, 'animeComments', String(animeId), 'comments', commentId));
}

export async function postReply({ animeId, commentId, user, text }) {
  ensure();
  const now = serverTimestamp();
  await addDoc(
    collection(db, 'animeComments', String(animeId), 'comments', commentId, 'replies'),
    {
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorAvatar: user.photoURL || null,
      text,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
    }
  );
}

export function subscribeComments(animeId, cb) {
  if (!firebaseConfigured) { cb([]); return () => {}; }
  const q = query(commentsRef(animeId), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.error('comments subscription error', err);
    cb([]);
  });
}

export function subscribeReplies(animeId, commentId, cb) {
  if (!firebaseConfigured) { cb([]); return () => {}; }
  const q = query(
    collection(db, 'animeComments', String(animeId), 'comments', commentId, 'replies'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function toggleLike({ animeId, commentId, uid }) {
  ensure();
  const likeRef = doc(db, 'animeComments', String(animeId), 'comments', commentId, 'likes', uid);
  const commentRef = doc(db, 'animeComments', String(animeId), 'comments', commentId);
  const existing = await getDoc(likeRef);
  const batch = writeBatch(db);
  if (existing.exists()) {
    batch.delete(likeRef);
    batch.update(commentRef, { likeCount: increment(-1) });
  } else {
    batch.set(likeRef, { uid, createdAt: serverTimestamp() });
    batch.update(commentRef, { likeCount: increment(1) });
  }
  await batch.commit();
}

export async function hasLiked({ animeId, commentId, uid }) {
  ensure();
  const snap = await getDoc(
    doc(db, 'animeComments', String(animeId), 'comments', commentId, 'likes', uid)
  );
  return snap.exists();
}