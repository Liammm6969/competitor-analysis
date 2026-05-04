import { useEffect, useState } from 'react'
import { analyticsApi, type AnalyticsData, trainingApi, type Training } from '../lib/api'
import { TrendingUp, Users, DollarSign, BookOpen, ArrowUpRight, Calendar } from 'lucide-react'

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [recentTrainings, setRecentTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.get(), trainingApi.getAll()])
      .then(([a, t]) => { setAnalytics(a); setRecentTrainings(t.slice(0, 5)) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty-state"><p>Loading dashboard...</p></div>
  if (!analytics) return <div className="empty-state"><p>No data available. Seed the database first.</p></div>

  const stats = [
    { label: 'Total Trainings', value: analytics.totalTrainings, icon: BookOpen, color: '#6366f1' },
    { label: 'Competitors', value: analytics.totalCompetitors, icon: Users, color: '#8b5cf6' },
    { label: 'Avg Price', value: `$${analytics.avgPrice.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
    { label: 'Top Topic', value: analytics.topTopics[0]?.topic || 'N/A', icon: TrendingUp, color: '#f59e0b' },
  ]

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          Welcome back <span className="gradient-text">Analyst</span>
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          Here's your competitive landscape overview
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={s.label} className={`stat-card animate-fade-in animate-fade-in-delay-${i + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{s.value}</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${s.color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Recent trainings */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Trainings</h3>
            <Calendar size={16} color="var(--color-text-muted)" />
          </div>
          {recentTrainings.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No trainings yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentTrainings.map((t) => (
                <div key={t._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.625rem 0.75rem', borderRadius: 10,
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {t.competitor_id?.name} · {new Date(t.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge badge-${t.delivery_mode.toLowerCase().replace('-', '-')}`}>
                      {t.delivery_mode}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-success)' }}>
                      ${t.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top competitors */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Competitor Activity</h3>
            <ArrowUpRight size={16} color="var(--color-text-muted)" />
          </div>
          {analytics.competitorRanking.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {analytics.competitorRanking.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                    background: i === 0 ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-2)',
                    color: i === 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.name}</div>
                    <div style={{
                      height: 4, borderRadius: 2, marginTop: 4,
                      background: 'var(--color-surface-3)',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${(c.count / analytics.competitorRanking[0].count) * 100}%`,
                        background: i === 0 ? '#6366f1' : '#475569',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
