import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { saveHistory, getHistory, deleteHistoryEntry } from '../firebase/firestore.js';

const LS_KEY = 'hoshii:history';

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function useWatchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState(() => readLocal());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (user) {
      setLoading(true);
      getHistory(user.uid)
        .then(list => { if (alive) setHistory(list); })
        .catch(() => {})
        .finally(() => { if (alive) setLoading(false); });
    } else {
      setHistory(readLocal());
    }
    return () => { alive = false; };
  }, [user]);

  const addEntry = useCallback(async (entry) => {
    const normalized = {
      ...entry,
      updatedAt: Date.now(),
    };
    if (user) {
      try {
        await saveHistory(user.uid, normalized);
      } catch (e) {
        console.warn('history save failed', e);
      }
    } else {
      const list = readLocal();
      const filtered = list.filter(x => !(x.animeId === entry.animeId && x.episode === entry.episode));
      filtered.unshift(normalized);
      writeLocal(filtered.slice(0, 60));
    }
    setHistory(prev => {
      const filtered = prev.filter(
        x => !(x.animeId === entry.animeId && x.episode === entry.episode)
      );
      return [normalized, ...filtered].slice(0, 60);
    });
  }, [user]);

  const removeEntry = useCallback(async (animeId, episode) => {
    if (user) {
      const id = `${animeId}_${episode}`;
      try { await deleteHistoryEntry(user.uid, id); } catch {}
    } else {
      const list = readLocal().filter(
        x => !(x.animeId === animeId && x.episode === episode)
      );
      writeLocal(list);
    }
    setHistory(prev =>
      prev.filter(x => !(x.animeId === animeId && x.episode === episode))
    );
  }, [user]);

  return { history, loading, addEntry, removeEntry };
}