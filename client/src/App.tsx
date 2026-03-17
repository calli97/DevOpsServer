import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import InstanceDetail from './pages/InstanceDetail'

function isAuthenticated() {
  return !!localStorage.getItem('devops_url') && !!localStorage.getItem('devops_apikey')
}

function Guard({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/projects" element={<Guard><Projects /></Guard>} />
        <Route path="/projects/:id" element={<Guard><ProjectDetail /></Guard>} />
        <Route path="/instances/:id" element={<Guard><InstanceDetail /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
