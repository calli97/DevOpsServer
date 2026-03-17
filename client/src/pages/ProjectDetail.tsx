import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../api'

interface Instance {
  id: number
  name: string
  branch: string
  path: string
  cloned: boolean
  autoUpdate: boolean
  slaveServer: { id: number; nombre: string } | null
  deploys: unknown[]
}

interface Project {
  id: number
  name: string
  repository: string
  cloneLine: string
  instances: Instance[]
}

interface SlaveServer {
  id: number
  nombre: string
}

const emptyForm = {
  name: '', branch: 'main', path: '', autoUpdate: false,
  afterDeployCommands: '', slaveServerId: '',
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [slaves, setSlaves] = useState<SlaveServer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formWarning, setFormWarning] = useState('')

  useEffect(() => {
    loadProject()
    loadSlaves()
  }, [id])

  async function loadProject() {
    setLoading(true)
    try {
      const res = await api.projects.getById(Number(id)) as { ok: boolean; data: Project; error?: string }
      if (res.ok) setProject(res.data)
      else setError(res.error ?? 'Not found')
    } catch {
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  async function loadSlaves() {
    const res = await api.slaveServers.list() as { ok: boolean; data: SlaveServer[] }
    if (res.ok) setSlaves(res.data)
  }

  async function createInstance(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormWarning('')
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        branch: form.branch,
        path: form.path,
        autoUpdate: form.autoUpdate,
        projectId: Number(id),
      }
      if (form.afterDeployCommands) body.afterDeployCommands = form.afterDeployCommands
      if (form.slaveServerId)       body.slaveServerId = Number(form.slaveServerId)

      const res = await api.instances.create(body) as { ok: boolean; data: Instance; error?: string; warning?: string }
      if (res.ok) {
        if (res.warning) setFormWarning(res.warning)
        else setShowForm(false)
        setForm(emptyForm)
        loadProject()
      } else {
        setFormError(res.error ?? 'Failed to create instance')
      }
    } catch {
      setFormError('Request failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteInstance(instanceId: number) {
    if (!confirm('Delete this instance?')) return
    await api.instances.delete(instanceId)
    loadProject()
  }

  if (loading) return <div className="layout"><main className="main"><div className="empty">Loading…</div></main></div>
  if (error)   return <div className="layout"><main className="main"><div className="banner banner-error">{error}</div></main></div>
  if (!project) return null

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">⚙ DevOps Manager</div>
        <span className="sidebar-section">Navigation</span>
        <button className="sidebar-btn" onClick={() => navigate('/projects')}>📁 Projects</button>
        <button className="sidebar-btn active">📦 Instances</button>
      </nav>

      <main className="main">
        <div className="breadcrumb">
          <Link to="/projects">Projects</Link>
          <span>›</span>
          <span>{project.name}</span>
        </div>

        {/* Project info */}
        <div className="page-header">
          <div className="page-title">{project.name}</div>
        </div>

        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Repository</div>
                <div style={{ fontSize: 13 }}>{project.repository}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Clone Line</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace' }}>{project.cloneLine}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instances */}
        <div className="section-header">
          <div className="section-title">Project Instances</div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New Instance'}
          </button>
        </div>

        {showForm && (
          <div className="inline-form">
            {formError   && <div className="banner banner-error">{formError}</div>}
            {formWarning && <div className="banner banner-warning">{formWarning}</div>}
            <form className="form" onSubmit={createInstance}>
              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input className="input" placeholder="production" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="field">
                  <label>Branch</label>
                  <input className="input" placeholder="main" value={form.branch}
                    onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} required />
                </div>
                <div className="field full">
                  <label>Path</label>
                  <input className="input" placeholder="/home/deploy/projects" value={form.path}
                    onChange={e => setForm(f => ({ ...f, path: e.target.value }))} required />
                </div>
                <div className="field">
                  <label>Slave Server <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <select className="input" value={form.slaveServerId}
                    onChange={e => setForm(f => ({ ...f, slaveServerId: e.target.value }))}>
                    <option value="">None (local)</option>
                    {slaves.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>After Deploy Commands <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input className="input" placeholder="npm run migrate" value={form.afterDeployCommands}
                    onChange={e => setForm(f => ({ ...f, afterDeployCommands: e.target.value }))} />
                </div>
                <div className="field full">
                  <div className="checkbox-row">
                    <input type="checkbox" id="pi-auto" checked={form.autoUpdate}
                      onChange={e => setForm(f => ({ ...f, autoUpdate: e.target.checked }))} />
                    <label htmlFor="pi-auto">Auto update on push</label>
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Instance'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          {project.instances.length === 0 ? (
            <div className="empty">No instances yet. Create one to deploy this project.</div>
          ) : (
            project.instances.map((inst: Instance) => (
              <div className="list-item" key={inst.id}>
                <div className="item-info">
                  <div className="item-name">{inst.name}</div>
                  <div className="item-meta">
                    branch: {inst.branch} · {inst.path}
                    {inst.slaveServer && ` · slave: ${inst.slaveServer.nombre}`}
                  </div>
                </div>
                <div className="item-actions">
                  <span className={`badge ${inst.cloned ? 'badge-green' : 'badge-red'}`}>
                    {inst.cloned ? 'cloned' : 'not cloned'}
                  </span>
                  {inst.autoUpdate && <span className="badge badge-blue">auto-update</span>}
                  <span className="badge badge-gray">{(inst.deploys as unknown[])?.length ?? 0} deploys</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/instances/${inst.id}`)}>
                    View →
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteInstance(inst.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
