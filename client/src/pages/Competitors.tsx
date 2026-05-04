import { useEffect, useState } from 'react'
import { competitorApi, scraperApi } from '../lib/api'
import type { Competitor, DiscoveredRecord } from '../lib/api'
import { Plus, Trash2, Globe, X, Users, Search, Loader, CheckCircle } from 'lucide-react'

import DiscoveryTable from '../components/DiscoveryTable'

export default function Competitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', source_url: '', category: '' })

  // Discover state
  const [discoverKeyword, setDiscoverKeyword] = useState('')
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveredRecords, setDiscoveredRecords] = useState<DiscoveredRecord[]>([])
  const [isApproving, setIsApproving] = useState(false)

  const load = () => {
    competitorApi.getAll().then(setCompetitors).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await competitorApi.create(form)
    setForm({ name: '', source_url: '', category: '' })
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await competitorApi.delete(id)
    load()
  }

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!discoverKeyword.trim()) return
    setIsDiscovering(true)
    setDiscoveredRecords([])
    try {
      const res = await scraperApi.discover(discoverKeyword.trim())
      if (res.success) {
        setDiscoveredRecords(res.data)
      }
    } catch (err) {
      console.error('Discover failed', err)
      alert('Search failed. Please try again.')
    } finally {
      setIsDiscovering(false)
    }
  }

  const handleApproveDiscovered = async (recordsToApprove: DiscoveredRecord[]) => {
    if (recordsToApprove.length === 0) return
    setIsApproving(true)
    try {
      const res = await scraperApi.bulkApprove(recordsToApprove)
      if (res.success) {
        alert(`Successfully imported ${res.inserted} new records!`)
        setDiscoveredRecords([])
        setDiscoverKeyword('')
        load() // Refresh competitors list
      }
    } catch (err) {
      console.error('Approve failed', err)
      alert('Failed to save records.')
    } finally {
      setIsApproving(false)
    }
  }

  const categories = [...new Set(competitors.map((c) => c.category))].filter(Boolean)

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Competitors</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            {competitors.length} tracked competitor{competitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Competitor
        </button>
      </div>

      {/* Discover Section */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} style={{ color: 'var(--color-primary)' }} />
          Discover Training Providers (Facebook Search)
        </h3>
        
        <form onSubmit={handleDiscover} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: discoveredRecords.length > 0 ? '1.5rem' : 0 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
              Training Keyword (e.g. COSH, BOSH)
            </label>
            <input 
              className="input-field" 
              placeholder="Enter training name..." 
              value={discoverKeyword}
              onChange={(e) => setDiscoverKeyword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isDiscovering} style={{ minWidth: '120px' }}>
            {isDiscovering ? <Loader size={16} className="animate-spin" /> : <Search size={16} />} 
            {isDiscovering ? 'Searching...' : 'Search'}
          </button>
        </form>

        {discoveredRecords.length > 0 && (
          <DiscoveryTable 
            results={discoveredRecords} 
            onApprove={handleApproveDiscovered} 
            isApproving={isApproving} 
          />
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <span key={cat} style={{
              padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500,
              background: 'rgba(99,102,241,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(99,102,241,0.2)',
            }}>{cat}</span>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : competitors.length === 0 ? (
        <div className="empty-state">
          <Users size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
          <p>No competitors yet. Add your first one.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Source URL</th>
                <th>Added</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.name}</td>
                  <td><span className="badge" style={{
                    background: 'rgba(99,102,241,0.1)', color: 'var(--color-accent)'
                  }}>{c.category}</span></td>
                  <td>
                    {c.source_url ? (
                      <a href={c.source_url} target="_blank" rel="noreferrer" style={{
                        color: 'var(--color-accent)', textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem',
                      }}>
                        <Globe size={12} /> {new URL(c.source_url).hostname}
                      </a>
                    ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(c._id)} style={{ padding: '0.35rem 0.5rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Add Competitor</h3>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
              }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Name *</label>
                <input className="input-field" placeholder="e.g. TechCorp Training" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Category</label>
                <input className="input-field" placeholder="e.g. Technology" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Source URL</label>
                <input className="input-field" placeholder="https://..." value={form.source_url}
                  onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  <Plus size={16} /> Add Competitor
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
