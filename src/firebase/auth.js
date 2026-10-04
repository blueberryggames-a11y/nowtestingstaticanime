import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from './config.js';

function ensure() {
  if (!firebaseConfigured || !auth) {
    throw new Error(
      'Firebase is not configured. Add your credentials to a .env file (see README).'
    );
  }
}

export async function signUp(email, password, displayName) {
  ensure();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    displayName: displayName || email.split('@')[0],
    email,
    avatarUrl: null,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function signIn(email, password) {
  ensure();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser() {
  ensure();
  await fbSignOut(auth);
}

export async function resetPassword(email) {
  ensure();
  await sendPasswordResetEmail(auth, email);
}

export async function updateUserProfile(user, { displayName, photoURL }) {
  ensure();
  await updateProfile(user, { displayName, photoURL });
  await setDoc(
    doc(db, 'users', user.uid),
    { displayName: displayName ?? user.displayName, avatarUrl: photoURL ?? user.photoURL },
    { merge: true }
  );
}

export async function getUserDoc(uid) {
  ensure();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export function subscribeAuth(cb) {
  if (!firebaseConfigured || !auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}