export function Skeleton({ w = '100%', h = 16, r = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: r, ...style }}
      aria-hidden="true"
    />
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="skeleton-card">
      <Skeleton h={260} r={12} />
      <Skeleton h={14} w="80%" style={{ marginTop: 10 }} />
      <Skeleton h={12} w="50%" style={{ marginTop: 6 }} />
      <style>{`
        .skeleton-card { display: flex; flex-direction: column; }
        .skeleton {
          background: linear-gradient(90deg, #14141d 0%, #1e1e2a 50%, #14141d 100%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function GridSkeleton({ count = 12 }) {
  return (
    <div className="anime-grid">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}