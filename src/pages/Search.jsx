import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FilterPanel from '../components/FilterPanel.jsx';
import AnimeGrid from '../components/AnimeGrid.jsx';
import { searchAnime } from '../api/anilist.js';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(params));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(Number(params.get('page') || 1));
  const abortRef = useRef(null);

  useEffect(() => {
    // Sync state when URL changes externally
    setFilters(readFilters(params));
    setPage(Number(params.get('page') || 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);

    searchAnime({
      query: filters.query,
      genre: filters.genre,
      tag: filters.tag,
      year: filters.year,
      season: filters.season,
      status: filters.status,
      format: filters.format,
      sort: filters.sort ? [filters.sort] : ['POPULARITY_DESC'],
      minimumScore: filters.minimumScore,
      country: filters.country,
      isAdult: !!filters.isAdult,
      page,
      perPage: 30,
      signal: ctrl.signal,
    })
      .then((res) => { if (!ctrl.signal.aborted) setResults(res); })
      .catch((e) => { if (e.name !== 'AbortError') setError(e); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });

    return () => ctrl.abort();
  }, [filters, page]);

  const apply = () => {
    const p = new URLSearchParams();
    if (filters.query) p.set('query', filters.query);
    if (filters.genre) p.set('genre', filters.genre);
    if (filters.tag) p.set('tag', filters.tag);
    if (filters.year) p.set('year', String(filters.year));
    if (filters.season) p.set('season', filters.season);
    if (filters.status) p.set('status', filters.status);
    if (filters.format) p.set('format', filters.format);
    if (filters.sort) p.set('sort', filters.sort);
    if (filters.minimumScore) p.set('minimumScore', String(filters.minimumScore));
    if (filters.country) p.set('country', filters.country);
    if (filters.isAdult) p.set('isAdult', '1');
    if (page > 1) p.set('page', String(page));
    setParams(p);
  };

  const reset = () => {
    setFilters({ sort: 'POPULARITY_DESC' });
    setPage(1);
    setParams(new URLSearchParams());
  };

  const total = results?.pageInfo?.total || 0;
  const lastPage = results?.pageInfo?.lastPage || 1;
  const currentPage = results?.pageInfo?.currentPage || page;

  return (
    <div className="page">
      <div className="container">
        <div className="search-head">
          <div>
            <h1>Search Anime</h1>
            {results && <p className="muted">{total.toLocaleString()} results</p>}
          </div>
          <input
            className="search-input"
            value={filters.query || ''}
            onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="Search by title…"
          />
        </div>

        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onApply={() => { setPage(1); apply(); }}
          onReset={reset}
        />

        <div className="results-wrap">
          <AnimeGrid
            anime={results?.media || []}
            loading={loading}
            error={error}
            empty="No anime matched your filters."
          />
        </div>

        {results && lastPage > 1 && (
          <div className="pagination">
            <button
              className="btn ghost"
              disabled={currentPage <= 1}
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0 }); }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="muted">Page {currentPage} / {lastPage}</span>
            <button
              className="btn ghost"
              disabled={currentPage >= lastPage}
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0 }); }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .search-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .search-head h1 { margin: 0 0 4px; font-size: 28px; }
        .search-head p { margin: 0; font-size: 13px; }
        .search-input {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 16px; color: var(--text);
          font-size: 14px; outline: none; width: 100%; max-width: 380px;
          transition: var(--transition);
        }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .results-wrap { margin-top: 20px; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 32px; }
      `}</style>
    </div>
  );
}

function readFilters(params) {
  return {
    query: params.get('query') || '',
    genre: params.get('genre') || '',
    tag: params.get('tag') || '',
    year: params.get('year') ? Number(params.get('year')) : '',
    season: params.get('season') || '',
    status: params.get('status') || '',
    format: params.get('format') || '',
    sort: params.get('sort') || 'POPULARITY_DESC',
    minimumScore: params.get('minimumScore') ? Number(params.get('minimumScore')) : '',
    country: params.get('country') || '',
    isAdult: params.get('isAdult') === '1',
  };
}