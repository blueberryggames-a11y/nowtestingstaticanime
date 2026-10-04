import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimeGrid from '../components/AnimeGrid.jsx';
import { getTrendingAnime, getPopularAnime, getTopRatedAnime, getNewestAnime } from '../api/anilist.js';

const SORTS = [
  { key: 'TRENDING', label: 'Trending', fn: getTrendingAnime },
  { key: 'POPULAR', label: 'Popular', fn: getPopularAnime },
  { key: 'TOP', label: 'Highest Rated', fn: getTopRatedAnime },
  { key: 'NEWEST', label: 'Newest', fn: getNewestAnime },
];

export default function Trending() {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState(params.get('sort') || 'TRENDING');
  const [page, setPage] = useState(Number(params.get('page') || 1));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams();
    if (sort !== 'TRENDING') p.set('sort', sort);
    if (page > 1) p.set('page', String(page));
    setParams(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, page]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const fn = SORTS.find(s => s.key === sort)?.fn || getTrendingAnime;
    fn(page, 30)
      .then(res => { if (alive) { setResults(res); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [sort, page]);

  const lastPage = results?.pageInfo?.lastPage || 1;

  return (
    <div className="page">
      <div className="container">
        <div className="search-head">
          <h1>Trending</h1>
          <div className="tabs">
            {SORTS.map(s => (
              <button key={s.key} className={s.key === sort ? 'active' : ''} onClick={() => { setSort(s.key); setPage(1); }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <AnimeGrid anime={results?.media || []} loading={loading} />

        {lastPage > 1 && (
          <div className="pagination">
            <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="muted">Page {page} / {lastPage}</span>
            <button className="btn ghost" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      <style>{`
        .search-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
        .search-head h1 { margin: 0; font-size: 28px; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 32px; }
      `}</style>
    </div>
  );
}