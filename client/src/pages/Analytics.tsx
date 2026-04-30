import { useEffect, useState } from 'react'
import { analyticsApi } from '../lib/api'
import type { AnalyticsData } from '../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9']
const MODE_COLORS: Record<string, string> = { Online: '#10b981', 'In-Person': '#3b82f6', Hybrid: '#f59e0b' }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
      padding: '0.6rem 0.85rem', fontSize: '0.8rem',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.get().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty-state"><p>Loading analytics...</p></div>
  if (!data) return <div className="empty-state"><p>No data available.</p></div>

  const summaryCards = [
    { label: 'Avg Price', value: `$${data.avgPrice}`, sub: `$${data.minPrice} – $${data.maxPrice}`, icon: DollarSign, color: '#10b981' },
    { label: 'Total Trainings', value: data.totalTrainings, sub: `${data.trainingsPerMonth.length} months tracked`, icon: TrendingUp, color: '#6366f1' },
    { label: 'Competitors', value: data.totalCompetitors, sub: `${data.competitorRanking.length} active`, icon: Users, color: '#8b5cf6' },
    { label: 'Top Topic', value: data.topTopics[0]?.topic || '—', sub: `${data.topTopics[0]?.count || 0} occurrences`, icon: Target, color: '#f59e0b' },
  ]

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Analytics</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
          Insights from your competitive landscape data
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map((s, i) => (
          <div key={s.label} className={`stat-card animate-fade-in animate-fade-in-delay-${i + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'capitalize' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{s.sub}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: `${s.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Monthly trend */}
        <div className="chart-container">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Trainings Per Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trainingsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} name="Trainings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top topics */}
        <div className="chart-container">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Top Topics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.topTopics.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis dataKey="topic" type="category" width={80}
                tick={{ fill: '#94a3b8', fontSize: 11, textTransform: 'capitalize' } as any} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Mentions" radius={[0, 6, 6, 0]}>
                {data.topTopics.slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Delivery modes */}
        <div className="chart-container">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Delivery Modes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.deliveryDistribution} dataKey="count" nameKey="mode"
                cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}
                strokeWidth={0}>
                {data.deliveryDistribution.map((entry) => (
                  <Cell key={entry.mode} fill={MODE_COLORS[entry.mode] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }}
                formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Competitor ranking */}
        <div className="chart-container">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Competitor Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.competitorRanking}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Trainings" radius={[6, 6, 0, 0]}>
                {data.competitorRanking.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
