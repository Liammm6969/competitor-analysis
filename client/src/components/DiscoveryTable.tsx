import { useState, useEffect } from 'react';
import type { DiscoveredRecord } from '../lib/api';

export default function DiscoveryTable({ results, onApprove, isApproving }: { results: DiscoveredRecord[], onApprove: (records: DiscoveredRecord[]) => void, isApproving: boolean }) {
  const [data, setData] = useState<DiscoveredRecord[]>(results);
  const [filter, setFilter] = useState('');

  // Sync state if props change
  useEffect(() => {
    setData(results);
  }, [results]);

  const filtered = filter ? data.filter(r => (r.type ?? 'null') === filter) : data;

  const updateField = (url: string, field: keyof DiscoveredRecord, value: string) =>
    setData(prev => prev.map(r => r.url === url ? { ...r, [field]: value } : r));

  const inputStyle = { padding: '0.25rem 0.4rem', fontSize: '0.85rem', width: '100%', minWidth: '80px' };

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            Found {data.length} potential providers
          </span>
          <select 
            className="input-field" 
            style={{ padding: '0.4rem 0.8rem', width: 'auto' }}
            value={filter} 
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Online">Online</option>
            <option value="In-Person">In-Person</option>
            <option value="null">Unknown Type</option>
          </select>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => onApprove(data)} 
          disabled={isApproving}
          style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
        >
          {isApproving ? 'Approving...' : 'Approve & Save All'}
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th style={{ width: '110px' }}>Type</th>
              <th>Trainings</th>
              <th style={{ width: '100px' }}>Online Price</th>
              <th style={{ width: '100px' }}>F2F Price</th>
              <th>Inclusion</th>
              <th>Weakness</th>
              <th style={{ width: '110px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.url || i}>
                <td>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-light)', textDecoration: 'none', fontWeight: 600 }}>
                    {r.provider || '—'}
                  </a>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.description}
                  </div>
                </td>
                <td>
                  <select
                    className="input-field"
                    style={{ ...inputStyle, padding: '0.25rem' }}
                    value={r.type || ''}
                    onChange={(e) => updateField(r.url, 'type', e.target.value)}
                  >
                    <option value="">Unknown</option>
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    style={inputStyle}
                    placeholder="e.g. COSH, BOSH"
                    value={r.trainings_offered || ''}
                    onChange={(e) => updateField(r.url, 'trainings_offered', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    style={inputStyle}
                    placeholder="₱..."
                    value={r.online_price || ''}
                    onChange={(e) => updateField(r.url, 'online_price', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    style={inputStyle}
                    placeholder="₱..."
                    value={r.f2f_price || ''}
                    onChange={(e) => updateField(r.url, 'f2f_price', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    style={inputStyle}
                    placeholder="e.g. kit, id"
                    value={r.inclusion || ''}
                    onChange={(e) => updateField(r.url, 'inclusion', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    style={inputStyle}
                    placeholder="Type weakness..."
                    value={r.weakness || ''}
                    onChange={(e) => updateField(r.url, 'weakness', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    style={inputStyle}
                    placeholder="e.g. May 8"
                    value={r.date || ''}
                    onChange={(e) => updateField(r.url, 'date', e.target.value)}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No results match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
