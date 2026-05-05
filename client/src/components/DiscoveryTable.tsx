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
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
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
              <th style={{ width: '80px' }}>Likes</th>
              <th style={{ width: '110px' }}>Type</th>
              <th>Trainings</th>
              <th style={{ width: '100px' }}>Online Price</th>
              <th style={{ width: '100px' }}>F2F Price</th>
              <th>Inclusion</th>
              <th>Weakness</th>
              <th style={{ width: '110px' }}>Date</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.url || i}>
                <td>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                    {r.provider || '—'}
                  </a>
                  {r.category && <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase' }}>{r.category}</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.description}
                  </div>
                  {(r.address || r.phone) && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      {r.address && <span>📍 {r.address} </span>}
                      {r.phone && <span>📞 {r.phone}</span>}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {r.likes ? r.likes.toLocaleString() : '—'}
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
                <td>
                  <span className="badge" style={{ fontSize: '0.6rem', whiteSpace: 'nowrap', background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                    {r.source.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
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
