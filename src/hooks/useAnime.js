import { useEffect, useState } from 'react';

export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!immediate) return;
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(fn)
      .then(res => { if (alive) setData(res); })
      .catch(err => { if (alive) setError(err); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}