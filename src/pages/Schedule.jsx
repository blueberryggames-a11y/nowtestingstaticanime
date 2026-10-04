import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Clock } from 'lucide-react';
import { getAiringSchedule } from '../api/anilist.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Schedule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState(new Date().getDay());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const start = Math.floor(Date.now() / 1000);
    const end = start + 60 * 60 * 24 * 7;
    getAiringSchedule({ perPage: 100, airingAtGreater: start, airingAtLesser: end })
      .then((res) => { if (alive) { setData(res); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    DAYS.forEach((d) => map.set(d, []));
    (data?.airingSchedules || []).forEach((item) => {
      const d = new Date(item.airingAt * 1000);
      const day = DAYS[d.getDay()];
      map.get(day).push(item);
    });
    return map;
  }, [data]);

  return (
    <div className="page">
      <div className="container">
        <div className="search-head">
          <div>
            <h1>Airing Schedule</h1>
            <p className="muted">Times shown in your local timezone.</p>
          </div>
        </div>

        <div className="day-tabs">
          {DAYS.map((d, i) => (
            <button
              key={d}
              className={i === dayFilter ? 'active' : ''}
              onClick={() => setDayFilter(i)}
            >
              {d}
              <span className="count">{(grouped.get(d) || []).length}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-row">
            <Loader2 size={24} className="spin" /> Loading schedule…
          </div>
        ) : (
          <div className="schedule-list">
            {(grouped.get(DAYS[dayFilter]) || []).map((item) => {
              const time = new Date(item.airingAt * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const title =
                item.media.title.english ||
                item.media.title.userPreferred ||
                item.media.title.romaji;
              return (
                <Link key={item.id} to={`/anime/${item.media.id}`} className="schedule-row">
                  <span className="time"><Clock size={12} /> {time}</span>
                  <img src={item.media.coverImage?.large} alt="" loading="lazy" />
                  <div className="info">
                    <span className="title">{title}</span>
                    <span className="muted">
                      Episode {item.episode} · {item.media.format}
                    </span>
                  </div>
                  <span className="ep-badge">EP {item.episode}</span>
                </Link>
              );
            })}
            {(grouped.get(DAYS[dayFilter]) || []).length === 0 && (
              <div className="empty-state">No airings this day.</div>
            )}
          </div>
        )}
      </div>
      <style>{`
        .search-head { margin-bottom: 20px; }
        .search-head h1 { margin: 0 0 4px; font-size: 28px; }
        .day-tabs {
          display: flex; gap: 6px; overflow-x: auto;
          padding-bottom: 8px; margin-bottom: 20px;
          scrollbar-width: none;
        }
        .day-tabs::-webkit-scrollbar { display: none; }
        .day-tabs button {
          flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--panel); color: var(--text-dim);
          font-weight: 600; font-size: 13px; transition: var(--transition);
        }
        .day-tabs button:hover { color: var(--text); }
        .day-tabs button.active {
          background: var(--accent-soft); color: var(--text);
          border-color: var(--accent);
        }
        .day-tabs .count { font-size: 11px; color: var(--text-muted); }
        .schedule-list { display: flex; flex-direction: column; gap: 6px; }
        .schedule-row {
          display: flex; align-items: center; gap: 14px;
          padding: 10px 14px; border-radius: 12px;
          background: var(--panel); border: 1px solid var(--border-soft);
          transition: var(--transition);
        }
        .schedule-row:hover {
          border-color: var(--accent); background: var(--panel-2);
        }
        .schedule-row img {
          width: 48px; height: 68px; border-radius: 8px; object-fit: cover;
        }
        .schedule-row .time {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 700; color: var(--cyan); width: 70px;
        }
        .schedule-row .info {
          flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0;
        }
        .schedule-row .title {
          font-weight: 600; font-size: 14px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ep-badge {
          background: var(--accent-soft); color: var(--accent);
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;
        }
        .loading-row {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; padding: 60px; color: var(--text-muted);
        }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}