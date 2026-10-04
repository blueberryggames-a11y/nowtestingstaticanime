import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeAuth, signIn as doSignIn, signUp as doSignUp, signOutUser, resetPassword } from '../firebase/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth(u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const value = {
    user,
    loading,
    signIn: doSignIn,
    signUp: doSignUp,
    signOut: signOutUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}