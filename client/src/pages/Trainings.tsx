import { useEffect, useState } from 'react'
import { trainingApi, competitorApi } from '../lib/api'
import type { Training, Competitor } from '../lib/api'
import { Plus, Trash2, X, GraduationCap } from 'lucide-react'

export default function Trainings() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    competitor_id: '', title: '', price: '', date: '', audience: '', delivery_mode: 'Online',
  })

  const load = () => {
    Promise.all([trainingApi.getAll(), competitorApi.getAll()])
      .then(([t, c]) => { setTrainings(t); setCompetitors(c) })
      .catch(console.error).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.competitor_id) return
    await trainingApi.create({ ...form, price: Number(form.price) || 0 })
    setForm({ competitor_id: '', title: '', price: '', date: '', audience: '', delivery_mode: 'Online' })
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await trainingApi.delete(id)
    load()
  }

  const badgeClass = (mode: string) => {
    if (mode === 'Online') return 'badge badge-online'
    if (mode === 'In-Person') return 'badge badge-in-person'
    return 'badge badge-hybrid'
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Trainings</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            {trainings.length} training{trainings.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Training
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : trainings.length === 0 ? (
        <div className="empty-state">
          <GraduationCap size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
          <p>No trainings yet.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Competitor</th>
                <th>Price</th>
                <th>Date</th>
                <th>Audience</th>
                <th>Mode</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </td>
                  <td>{t.competitor_id?.name || '—'}</td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>${t.price.toLocaleString()}</td>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.audience}</td>
                  <td><span className={badgeClass(t.delivery_mode)}>{t.delivery_mode}</span></td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(t._id)} style={{ padding: '0.35rem 0.5rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Add Training</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Competitor *</label>
                <select className="input-field" value={form.competitor_id}
                  onChange={(e) => setForm({ ...form, competitor_id: e.target.value })} required>
                  <option value="">Select competitor</option>
                  {competitors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Title *</label>
                <input className="input-field" placeholder="Training title" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Price ($)</label>
                  <input className="input-field" type="number" placeholder="0" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Date</label>
                  <input className="input-field" type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Audience</label>
                  <input className="input-field" placeholder="e.g. Engineers" value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Delivery Mode</label>
                  <select className="input-field" value={form.delivery_mode}
                    onChange={(e) => setForm({ ...form, delivery_mode: e.target.value })}>
                    <option>Online</option>
                    <option>In-Person</option>
                    <option>Hybrid</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}><Plus size={16} /> Add Training</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
