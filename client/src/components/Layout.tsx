import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, GraduationCap, BarChart3, Activity, ChevronRight } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/competitors', label: 'Competitors', icon: Users },
  { to: '/trainings', label: 'Trainings', icon: GraduationCap },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Layout() {
  const location = useLocation()
  const pageTitle = navItems.find((n) => location.pathname.startsWith(n.to))?.label || 'Dashboard'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 260, background: 'var(--color-surface-1)', borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>CompetitorIQ</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Training Analytics</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--color-text-muted)',
            padding: '0 0.75rem', marginBottom: '0.5rem',
          }}>Navigation</div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <NavLink key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: 10, textDecoration: 'none',
                fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                marginBottom: '0.25rem', transition: 'all 0.15s ease',
              }}>
                <item.icon size={18} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </NavLink>
            )
          })}
        </nav>

        <div style={{ padding: '0 1.5rem' }}>
          <div style={{
            padding: '0.75rem', borderRadius: 10,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <div className="pulse-dot" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)' }}>System Online</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>All services running</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, minHeight: '100vh' }}>
        <header style={{
          height: 64, borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{pageTitle}</h1>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: 'white', cursor: 'pointer',
          }}>CA</div>
        </header>
        <div style={{ padding: '1.5rem 2rem' }}><Outlet /></div>
      </main>
    </div>
  )
}
