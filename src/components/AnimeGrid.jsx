import AnimeCard from './AnimeCard.jsx';
import { GridSkeleton } from './LoadingSkeleton.jsx';

export default function AnimeGrid({ anime = [], loading = false, error = null, empty = 'No anime found.' }) {
  if (loading) return <GridSkeleton count={12} />;
  if (error) return <div className="empty-state">Failed to load: {error.message || 'Unknown error'}</div>;
  if (!anime.length) return <div className="empty-state">{empty}</div>;
  return (
    <div className="anime-grid">
      {anime.map(a => <AnimeCard key={a.id} anime={a} />)}
      <style>{`
        .anime-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }
        @media (max-width: 720px) {
          .anime-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        @media (min-width: 1200px) {
          .anime-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
        }
        .empty-state {
          padding: 60px 20px; text-align: center; color: var(--text-muted);
          border: 1px dashed var(--border); border-radius: 12px;
        }
      `}</style>
    </div>
  );
}