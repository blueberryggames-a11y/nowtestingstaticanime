import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { GENRES, FORMATS, STATUSES, SEASONS, SORTS } from '../api/anilist.js';

export default function FilterPanel({ filters, onChange, onApply, onReset }) {
  const [expanded, setExpanded] = useState(false);

  const set = (key, value) => onChange({ ...filters, [key]: value });
  const year = filters.year || '';
  const yearOptions = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() + 5 - i);

  return (
    <div className="filter-panel">
      <div className="filters-row">
        <Select
          label="Genre"
          value={filters.genre || ''}
          onChange={(v) => set('genre', v)}
          options={[{ value: '', label: 'Any Genre' }, ...GENRES.map(g => ({ value: g, label: g }))]}
        />
        <Select
          label="Year"
          value={year}
          onChange={(v) => set('year', v ? Number(v) : '')}
          options={[{ value: '', label: 'Any Year' }, ...yearOptions.map(y => ({ value: y, label: String(y) }))]}
        />
        <Select
          label="Status"
          value={filters.status || ''}
          onChange={(v) => set('status', v)}
          options={[
            { value: '', label: 'Any Status' },
            { value: 'RELEASING', label: 'Airing' },
            { value: 'FINISHED', label: 'Finished' },
            { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
            { value: 'CANCELLED', label: 'Cancelled' },
            { value: 'HIATUS', label: 'Hiatus' },
          ]}
        />
        <Select
          label="Format"
          value={filters.format || ''}
          onChange={(v) => set('format', v)}
          options={[{ value: '', label: 'Any Format' }, ...FORMATS.map(f => ({ value: f, label: f.replace('_', ' ') }))]}
        />
        <Select
          label="Sort"
          value={filters.sort || 'POPULARITY_DESC'}
          onChange={(v) => set('sort', v)}
          options={SORTS}
        />
      </div>

      {expanded && (
        <div className="filters-row">
          <Select
            label="Season"
            value={filters.season || ''}
            onChange={(v) => set('season', v)}
            options={[{ value: '', label: 'Any Season' }, ...SEASONS.map(s => ({ value: s, label: s }))]}
          />
          <Select
            label="Min Score"
            value={filters.minimumScore || ''}
            onChange={(v) => set('minimumScore', v ? Number(v) : '')}
            options={[
              { value: '', label: 'Any Score' },
              ...[90, 80, 70, 60, 50].map(s => ({ value: s, label: `${s}+` })),
            ]}
          />
          <Select
            label="Country"
            value={filters.country || ''}
            onChange={(v) => set('country', v)}
            options={[
              { value: '', label: 'Any Country' },
              { value: 'JP', label: 'Japan' },
              { value: 'KR', label: 'South Korea' },
              { value: 'CN', label: 'China' },
              { value: 'TW', label: 'Taiwan' },
            ]}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={!!filters.isAdult}
              onChange={(e) => set('isAdult', e.target.checked)}
            />
            Include adult
          </label>
        </div>
      )}

      <div className="filters-actions">
        <button className="btn primary" onClick={onApply}>Apply Filters</button>
        <button className="btn ghost" onClick={onReset}><X size={14} /> Reset</button>
        <button className="btn ghost" onClick={() => setExpanded(e => !e)}>
          <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          {expanded ? 'Collapse' : 'Expand'} Filters
        </button>
      </div>

      <style>{`
        .filter-panel {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 12px;
        }
        .filters-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .filters-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .checkbox-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--text-dim);
          padding: 10px 12px; background: var(--panel-2); border: 1px solid var(--border);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="select-wrap">
      <span className="select-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="select-arrow" />
      <style>{`
        .select-wrap {
          position: relative; display: flex; flex-direction: column; gap: 4px;
          background: var(--panel-2); border: 1px solid var(--border);
          border-radius: 10px; padding: 6px 34px 6px 12px; cursor: pointer;
        }
        .select-label {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-muted); font-weight: 600;
        }
        .select-wrap select {
          background: transparent; border: none; color: var(--text);
          font-size: 13px; font-weight: 500; outline: none; appearance: none;
          padding: 2px 0; cursor: pointer;
        }
        .select-arrow {
          position: absolute; right: 12px; bottom: 12px; color: var(--text-muted); pointer-events: none;
        }
      `}</style>
    </label>
  );
}