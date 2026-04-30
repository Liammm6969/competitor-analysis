import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Competitors from './pages/Competitors'
import Trainings from './pages/Trainings'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="competitors" element={<Competitors />} />
        <Route path="trainings" element={<Trainings />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}
