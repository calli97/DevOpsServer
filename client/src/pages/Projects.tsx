import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

interface Project {
  id: number
  name: string
  repository: string
  cloneLine: string
  instances: unknown[]
}

interface SlaveServer {
  id: number
  nombre: string
  host: string
  puerto: number | null
}

export default function Projects() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'projects' | 'slave-servers'>('projects')

  // Projects state
  const [projects, setProjects]           = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', repository: '', cloneLine: '' })
  const [projectSaving, setProjectSaving] = useState(false)
  const [projectError, setProjectError]   = useState('')

  // Slave servers state
  const [slaves, setSlaves]           = useState<SlaveServer[]>([])
  const [slavesLoading, setSlavesLoading] = useState(true)
  const [showSlaveForm, setShowSlaveForm] = useState(false)
  const [slaveForm, setSlaveForm] = useState({ nombre: '', host: '', puerto: '', apiKey: '' })
  const [slaveSaving, setSlaveSaving] = useState(false)
  const [slaveError, setSlaveError]   = useState('')

  useEffect(() => { loadProjects() }, [])
  useEffect(() => { if (tab === 'slave-servers') loadSlaves() }, [tab])

  async function loadProjects() {
    setProjectsLoading(true)
    try {
      const res = await api.projects.list() as { ok: boolean; data: Project[] }
      if (res.ok) setProjects(res.data)
    } finally {
      setProjectsLoading(false)
    }
  }

  async function loadSlaves() {
    setSlavesLoading(true)
    try {
      const res = await api.slaveServers.list() as { ok: boolean; data: SlaveServer[] }
      if (res.ok) setSlaves(res.data)
    } finally {
      setSlavesLoading(false)
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    setProjectError('')
    setProjectSaving(true)
    try {
      const res = await api.projects.create(projectForm) as { ok: boolean; error?: string }
      if (res.ok) {
        setShowProjectForm(false)
        setProjectForm({ name: '', repository: '', cloneLine: '' })
        loadProjects()
      } else {
        setProjectError(res.error ?? 'Failed to create project')
      }
    } catch {
      setProjectError('Request failed')
    } finally {
      setProjectSaving(false)
    }
  }

  async function deleteProject(id: number) {
    if (!confirm('Delete this project?')) return
    await api.projects.delete(id)
    loadProjects()
  }

  async function createSlave(e: React.FormEvent) {
    e.preventDefault()
    setSlaveError('')
    setSlaveSaving(true)
    try {
      const res = await api.slaveServers.create({
        ...slaveForm,
        ...(slaveForm.puerto ? { puerto: Number(slaveForm.puerto) } : {}),
      }) as { ok: boolean; error?: string }
      if (res.ok) {
        setShowSlaveForm(false)
        setSlaveForm({ nombre: '', host: '', puerto: '', apiKey: '' })
        loadSlaves()
      } else {
        setSlaveError(res.error ?? 'Failed to create slave server')
      }
    } catch {
      setSlaveError('Request failed')
    } finally {
      setSlaveSaving(false)
    }
  }

  async function deleteSlave(id: number) {
    if (!confirm('Delete this slave server?')) return
    await api.slaveServers.delete(id)
    loadSlaves()
  }

  function logout() {
    localStorage.removeItem('devops_url')
    localStorage.removeItem('devops_apikey')
    navigate('/')
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">⚙ DevOps Manager</div>
        <span className="sidebar-section">Navigation</span>
        <button className={`sidebar-btn ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
          📁 Projects
        </button>
        <button className={`sidebar-btn ${tab === 'slave-servers' ? 'active' : ''}`} onClick={() => setTab('slave-servers')}>
          🖥 Slave Servers
        </button>
        <div className="sidebar-logout">
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main">

        {/* ── PROJECTS ── */}
        {tab === 'projects' && (
          <>
            <div className="page-header">
              <div className="page-title">Projects</div>
              <button className="btn btn-primary" onClick={() => setShowProjectForm(v => !v)}>
                {showProjectForm ? 'Cancel' : '+ New Project'}
              </button>
            </div>

            {showProjectForm && (
              <div className="inline-form">
                {projectError && <div className="banner banner-error">{projectError}</div>}
                <form className="form" onSubmit={createProject}>
                  <div className="form-grid">
                    <div className="field">
                      <label>Name</label>
                      <input className="input" placeholder="my-project" value={projectForm.name}
                        onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="field">
                      <label>Repository URL</label>
                      <input className="input" placeholder="https://github.com/user/repo" value={projectForm.repository}
                        onChange={e => setProjectForm(f => ({ ...f, repository: e.target.value }))} required />
                    </div>
                    <div className="field full">
                      <label>Clone Line</label>
                      <input className="input" placeholder="git@github.com:user/repo.git" value={projectForm.cloneLine}
                        onChange={e => setProjectForm(f => ({ ...f, cloneLine: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowProjectForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={projectSaving}>
                      {projectSaving ? 'Creating…' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="card">
              {projectsLoading ? (
                <div className="empty">Loading…</div>
              ) : projects.length === 0 ? (
                <div className="empty">No projects yet. Create one to get started.</div>
              ) : (
                projects.map(p => (
                  <div className="list-item" key={p.id}>
                    <div className="item-info">
                      <div className="item-name">{p.name}</div>
                      <div className="item-meta">{p.repository}</div>
                    </div>
                    <div className="item-actions">
                      <span className="badge badge-blue">{p.instances?.length ?? 0} instances</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${p.id}`)}>
                        View →
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteProject(p.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── SLAVE SERVERS ── */}
        {tab === 'slave-servers' && (
          <>
            <div className="page-header">
              <div className="page-title">Slave Servers</div>
              <button className="btn btn-primary" onClick={() => setShowSlaveForm(v => !v)}>
                {showSlaveForm ? 'Cancel' : '+ New Slave Server'}
              </button>
            </div>

            {showSlaveForm && (
              <div className="inline-form">
                {slaveError && <div className="banner banner-error">{slaveError}</div>}
                <form className="form" onSubmit={createSlave}>
                  <div className="form-grid">
                    <div className="field">
                      <label>Name (nombre)</label>
                      <input className="input" placeholder="slave-01" value={slaveForm.nombre}
                        onChange={e => setSlaveForm(f => ({ ...f, nombre: e.target.value }))} required />
                    </div>
                    <div className="field">
                      <label>Host</label>
                      <input className="input" placeholder="https://slave.example.com" value={slaveForm.host}
                        onChange={e => setSlaveForm(f => ({ ...f, host: e.target.value }))} required />
                    </div>
                    <div className="field">
                      <label>Port <span className="optional">(optional)</span></label>
                      <input className="input" type="number" placeholder="3041" value={slaveForm.puerto}
                        onChange={e => setSlaveForm(f => ({ ...f, puerto: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label>API Key</label>
                      <input className="input" type="password" placeholder="secret" value={slaveForm.apiKey}
                        onChange={e => setSlaveForm(f => ({ ...f, apiKey: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowSlaveForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={slaveSaving}>
                      {slaveSaving ? 'Creating…' : 'Create Slave Server'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="card">
              {slavesLoading ? (
                <div className="empty">Loading…</div>
              ) : slaves.length === 0 ? (
                <div className="empty">No slave servers yet.</div>
              ) : (
                slaves.map(s => (
                  <div className="list-item" key={s.id}>
                    <div className="item-info">
                      <div className="item-name">{s.nombre}</div>
                      <div className="item-meta">{s.host}{s.puerto ? `:${s.puerto}` : ''}</div>
                    </div>
                    <div className="item-actions">
                      <span className="badge badge-gray">ID: {s.id}</span>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSlave(s.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
