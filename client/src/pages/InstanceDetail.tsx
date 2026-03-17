import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../api'

interface Deploy {
  id: number
  name: string
  startPath: string
  startCommands: string
  buildCommands: string | null
  started: boolean
}

interface ConfigFile {
  id: number
  name: string
  relativePath: string
  content: string
}

interface Instance {
  id: number
  name: string
  branch: string
  path: string
  cloned: boolean
  autoUpdate: boolean
  afterDeployCommands: string | null
  slaveServer: { id: number; nombre: string } | null
  project: { id: number; name: string }
  deploys: Deploy[]
  configFiles: ConfigFile[]
}

const emptyDeployForm = { name: '', startPath: '/', startCommands: '', buildCommands: '' }
const emptyConfigForm = { name: '', relativePath: '.', content: '' }
const emptyEditForm   = { branch: '', path: '', afterDeployCommands: '', autoUpdate: false }

export default function InstanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [instance, setInstance] = useState<Instance | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [showEditInstance, setShowEditInstance] = useState(false)
  const [editForm, setEditForm]                 = useState(emptyEditForm)
  const [editError, setEditError]               = useState('')
  const [editSaving, setEditSaving]             = useState(false)

  const [showDeployForm, setShowDeployForm]   = useState(false)
  const [deployForm, setDeployForm]           = useState(emptyDeployForm)
  const [deployError, setDeployError]         = useState('')
  const [deploySaving, setDeploySaving]       = useState(false)

  const [showConfigForm, setShowConfigForm]   = useState(false)
  const [configForm, setConfigForm]           = useState(emptyConfigForm)
  const [configError, setConfigError]         = useState('')
  const [configSaving, setConfigSaving]       = useState(false)

  const [viewingConfigFile, setViewingConfigFile] = useState<ConfigFile | null>(null)
  const [editingConfigFile, setEditingConfigFile] = useState<ConfigFile | null>(null)
  const [editConfigForm, setEditConfigForm]       = useState({ name: '', relativePath: '', content: '' })
  const [editConfigError, setEditConfigError]     = useState('')
  const [editConfigSaving, setEditConfigSaving]   = useState(false)

  const [editingDeploy, setEditingDeploy]   = useState<Deploy | null>(null)
  const [editDeployForm, setEditDeployForm] = useState({ name: '', startPath: '', startCommands: '', buildCommands: '' })
  const [editDeployError, setEditDeployError] = useState('')
  const [editDeploySaving, setEditDeploySaving] = useState(false)

  const [actionLoading, setActionLoading]     = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg]             = useState('')

  useEffect(() => { loadInstance() }, [id])

  function openEditInstance(inst: Instance) {
    setEditForm({
      branch: inst.branch,
      path: inst.path,
      afterDeployCommands: inst.afterDeployCommands ?? '',
      autoUpdate: inst.autoUpdate,
    })
    setEditError('')
    setShowEditInstance(true)
  }

  async function updateInstance(e: React.FormEvent) {
    e.preventDefault()
    setEditError('')
    setEditSaving(true)
    try {
      const res = await api.instances.update(Number(id), {
        branch: editForm.branch,
        path: editForm.path,
        afterDeployCommands: editForm.afterDeployCommands || null,
        autoUpdate: editForm.autoUpdate,
      }) as { ok: boolean; error?: string }
      if (res.ok) {
        setShowEditInstance(false)
        loadInstance()
      } else {
        setEditError(res.error ?? 'Failed to update instance')
      }
    } catch {
      setEditError('Request failed')
    } finally {
      setEditSaving(false)
    }
  }

  function openEditDeploy(d: Deploy) {
    setEditingDeploy(d)
    setEditDeployForm({
      name: d.name,
      startPath: d.startPath,
      startCommands: d.startCommands,
      buildCommands: d.buildCommands ?? '',
    })
    setEditDeployError('')
  }

  async function saveDeploy(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDeploy) return
    setEditDeployError('')
    setEditDeploySaving(true)
    try {
      const body: Record<string, unknown> = {
        name: editDeployForm.name,
        startPath: editDeployForm.startPath,
        startCommands: editDeployForm.startCommands,
      }
      if (editDeployForm.buildCommands) body.buildCommands = editDeployForm.buildCommands
      const res = await api.deploys.update(editingDeploy.id, body) as { ok: boolean; error?: string }
      if (res.ok) {
        setEditingDeploy(null)
        loadInstance()
      } else {
        setEditDeployError(res.error ?? 'Failed to update deploy')
      }
    } catch {
      setEditDeployError('Request failed')
    } finally {
      setEditDeploySaving(false)
    }
  }

  function openEditConfigFile(cf: ConfigFile) {
    setEditingConfigFile(cf)
    setEditConfigForm({ name: cf.name, relativePath: cf.relativePath, content: cf.content })
    setEditConfigError('')
    setViewingConfigFile(null)
  }

  async function saveConfigFile(e: React.FormEvent) {
    e.preventDefault()
    if (!editingConfigFile) return
    setEditConfigError('')
    setEditConfigSaving(true)
    try {
      const res = await api.configFiles.update(editingConfigFile.id, editConfigForm) as { ok: boolean; error?: string }
      if (res.ok) {
        setEditingConfigFile(null)
        loadInstance()
      } else {
        setEditConfigError(res.error ?? 'Failed to update config file')
      }
    } catch {
      setEditConfigError('Request failed')
    } finally {
      setEditConfigSaving(false)
    }
  }

  async function loadInstance() {
    setLoading(true)
    try {
      const res = await api.instances.getById(Number(id)) as { ok: boolean; data: Instance; error?: string }
      if (res.ok) setInstance(res.data)
      else setError(res.error ?? 'Not found')
    } catch {
      setError('Failed to load instance')
    } finally {
      setLoading(false)
    }
  }

  function setAction(key: string, val: boolean) {
    setActionLoading(prev => ({ ...prev, [key]: val }))
  }

  async function startAll() {
    setAction('startAll', true)
    setActionMsg('')
    try {
      const res = await api.instances.start(Number(id)) as { ok: boolean; error?: string }
      setActionMsg(res.ok ? 'All deploys started successfully.' : (res.error ?? 'Some deploys failed.'))
      loadInstance()
    } finally {
      setAction('startAll', false)
    }
  }

  async function startDeploy(deployId: number) {
    setAction(`start-${deployId}`, true)
    try {
      await api.deploys.start(deployId)
      loadInstance()
    } finally {
      setAction(`start-${deployId}`, false)
    }
  }

  async function stopDeploy(deployId: number) {
    setAction(`stop-${deployId}`, true)
    try {
      await api.deploys.stop(deployId)
      loadInstance()
    } finally {
      setAction(`stop-${deployId}`, false)
    }
  }

  async function deleteDeploy(deployId: number) {
    if (!confirm('Delete this deploy?')) return
    await api.deploys.delete(deployId)
    loadInstance()
  }

  async function deleteConfigFile(cfId: number) {
    if (!confirm('Delete this config file?')) return
    await api.configFiles.delete(cfId)
    loadInstance()
  }

  async function createDeploy(e: React.FormEvent) {
    e.preventDefault()
    setDeployError('')
    setDeploySaving(true)
    try {
      const body: Record<string, unknown> = {
        name: deployForm.name,
        startPath: deployForm.startPath,
        startCommands: deployForm.startCommands,
        projectInstanceId: Number(id),
      }
      if (deployForm.buildCommands) body.buildCommands = deployForm.buildCommands

      const res = await api.deploys.create(body) as { ok: boolean; error?: string }
      if (res.ok) {
        setShowDeployForm(false)
        setDeployForm(emptyDeployForm)
        loadInstance()
      } else {
        setDeployError(res.error ?? 'Failed to create deploy')
      }
    } catch {
      setDeployError('Request failed')
    } finally {
      setDeploySaving(false)
    }
  }

  async function createConfigFile(e: React.FormEvent) {
    e.preventDefault()
    setConfigError('')
    setConfigSaving(true)
    try {
      const res = await api.configFiles.create({
        ...configForm,
        projectInstanceId: Number(id),
      }) as { ok: boolean; error?: string }
      if (res.ok) {
        setShowConfigForm(false)
        setConfigForm(emptyConfigForm)
        loadInstance()
      } else {
        setConfigError(res.error ?? 'Failed to create config file')
      }
    } catch {
      setConfigError('Request failed')
    } finally {
      setConfigSaving(false)
    }
  }

  if (loading) return <div className="layout"><main className="main"><div className="empty">Loading…</div></main></div>
  if (error)   return <div className="layout"><main className="main"><div className="banner banner-error">{error}</div></main></div>
  if (!instance) return null

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">⚙ DevOps Manager</div>
        <span className="sidebar-section">Navigation</span>
        <button className="sidebar-btn" onClick={() => navigate('/projects')}>📁 Projects</button>
        <button className="sidebar-btn" onClick={() => navigate(`/projects/${instance.project.id}`)}>
          📦 Instances
        </button>
        <button className="sidebar-btn active">🚀 {instance.name}</button>
      </nav>

      <main className="main">
        <div className="breadcrumb">
          <Link to="/projects">Projects</Link>
          <span>›</span>
          <Link to={`/projects/${instance.project.id}`}>{instance.project.name}</Link>
          <span>›</span>
          <span>{instance.name}</span>
        </div>

        {/* Instance info */}
        <div className="page-header">
          <div className="page-title">{instance.name}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success" onClick={startAll} disabled={actionLoading['startAll']}>
              {actionLoading['startAll'] ? 'Starting…' : '▶ Start All'}
            </button>
          </div>
        </div>

        {actionMsg && <div className="banner banner-success" style={{ marginBottom: 16 }}>{actionMsg}</div>}

        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, flex: 1 }}>
                {[
                  ['Branch', instance.branch],
                  ['Path',   instance.path],
                  ['Slave',  instance.slaveServer?.nombre ?? 'None (local)'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13 }}>{value}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => openEditInstance(instance)}>✏ Edit</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className={`badge ${instance.cloned ? 'badge-green' : 'badge-red'}`}>
                {instance.cloned ? '✓ Cloned' : '✗ Not cloned'}
              </span>
              {instance.autoUpdate && <span className="badge badge-blue">Auto-update enabled</span>}
              {instance.afterDeployCommands && (
                <span className="badge badge-gray">After-deploy: {instance.afterDeployCommands}</span>
              )}
            </div>

            {showEditInstance && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {editError && <div className="banner banner-error" style={{ marginBottom: 12 }}>{editError}</div>}
                <form className="form" onSubmit={updateInstance}>
                  <div className="form-grid">
                    <div className="field">
                      <label>Branch</label>
                      <input className="input" value={editForm.branch}
                        onChange={e => setEditForm(f => ({ ...f, branch: e.target.value }))} required />
                    </div>
                    <div className="field">
                      <label>Path</label>
                      <input className="input" value={editForm.path}
                        onChange={e => setEditForm(f => ({ ...f, path: e.target.value }))} required />
                    </div>
                    <div className="field full">
                      <label>After Deploy Commands <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                      <input className="input" placeholder="npm run migrate" value={editForm.afterDeployCommands}
                        onChange={e => setEditForm(f => ({ ...f, afterDeployCommands: e.target.value }))} />
                    </div>
                    <div className="field full">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={editForm.autoUpdate}
                          onChange={e => setEditForm(f => ({ ...f, autoUpdate: e.target.checked }))} />
                        Auto-update on push
                      </label>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowEditInstance(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={editSaving}>
                      {editSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* ── DEPLOYS ── */}
        <div className="section">
          <div className="section-header">
            <div className="section-title">Deploys</div>
            <button className="btn btn-primary" onClick={() => setShowDeployForm(v => !v)}>
              {showDeployForm ? 'Cancel' : '+ Add Deploy'}
            </button>
          </div>

          {showDeployForm && (
            <div className="inline-form">
              {deployError && <div className="banner banner-error">{deployError}</div>}
              <form className="form" onSubmit={createDeploy}>
                <div className="form-grid">
                  <div className="field">
                    <label>Name</label>
                    <input className="input" placeholder="api" value={deployForm.name}
                      onChange={e => setDeployForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="field">
                    <label>Start Path</label>
                    <input className="input" placeholder="/" value={deployForm.startPath}
                      onChange={e => setDeployForm(f => ({ ...f, startPath: e.target.value }))} required />
                  </div>
                  <div className="field full">
                    <label>Start Commands</label>
                    <input className="input" placeholder="npm run start:prod" value={deployForm.startCommands}
                      onChange={e => setDeployForm(f => ({ ...f, startCommands: e.target.value }))} required />
                  </div>
                  <div className="field full">
                    <label>Build Commands <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — JSON array)</span></label>
                    <input className="input" placeholder='["npm install","npm run build"]' value={deployForm.buildCommands}
                      onChange={e => setDeployForm(f => ({ ...f, buildCommands: e.target.value }))} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowDeployForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={deploySaving}>
                    {deploySaving ? 'Adding…' : 'Add Deploy'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            {instance.deploys.length === 0 ? (
              <div className="empty">No deploys configured yet.</div>
            ) : (
              instance.deploys.map(d => (
                <div key={d.id}>
                  <div className="list-item">
                    <div className="item-info">
                      <div className="item-name">{d.name}</div>
                      <div className="item-meta">
                        path: {d.startPath} · <code style={{ fontSize: 11 }}>{d.startCommands}</code>
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className={`badge ${d.started ? 'badge-green' : 'badge-gray'}`}>
                        {d.started ? 'running' : 'stopped'}
                      </span>
                      <button className="btn btn-success btn-sm"
                        onClick={() => startDeploy(d.id)}
                        disabled={actionLoading[`start-${d.id}`]}>
                        {actionLoading[`start-${d.id}`] ? '…' : '▶ Start'}
                      </button>
                      <button className="btn btn-warning btn-sm"
                        onClick={() => stopDeploy(d.id)}
                        disabled={actionLoading[`stop-${d.id}`]}>
                        {actionLoading[`stop-${d.id}`] ? '…' : '■ Stop'}
                      </button>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => editingDeploy?.id === d.id ? setEditingDeploy(null) : openEditDeploy(d)}>
                        {editingDeploy?.id === d.id ? 'Cancel' : '✏ Edit'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteDeploy(d.id)}>Delete</button>
                    </div>
                  </div>
                  {editingDeploy?.id === d.id && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                      {editDeployError && <div className="banner banner-error" style={{ margin: '12px 0 8px' }}>{editDeployError}</div>}
                      <form className="form" style={{ marginTop: 12 }} onSubmit={saveDeploy}>
                        <div className="form-grid">
                          <div className="field">
                            <label>Name</label>
                            <input className="input" value={editDeployForm.name}
                              onChange={e => setEditDeployForm(f => ({ ...f, name: e.target.value }))} required />
                          </div>
                          <div className="field">
                            <label>Start Path</label>
                            <input className="input" value={editDeployForm.startPath}
                              onChange={e => setEditDeployForm(f => ({ ...f, startPath: e.target.value }))} required />
                          </div>
                          <div className="field full">
                            <label>Start Commands</label>
                            <input className="input" value={editDeployForm.startCommands}
                              onChange={e => setEditDeployForm(f => ({ ...f, startCommands: e.target.value }))} required />
                          </div>
                          <div className="field full">
                            <label>Build Commands <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — JSON array)</span></label>
                            <input className="input" placeholder='["npm install","npm run build"]' value={editDeployForm.buildCommands}
                              onChange={e => setEditDeployForm(f => ({ ...f, buildCommands: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-actions">
                          <button type="button" className="btn btn-ghost" onClick={() => setEditingDeploy(null)}>Cancel</button>
                          <button type="submit" className="btn btn-primary" disabled={editDeploySaving}>
                            {editDeploySaving ? 'Saving…' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── CONFIG FILES ── */}
        <div className="section">
          <div className="section-header">
            <div className="section-title">Config Files</div>
            <button className="btn btn-primary" onClick={() => setShowConfigForm(v => !v)}>
              {showConfigForm ? 'Cancel' : '+ Add Config File'}
            </button>
          </div>

          {showConfigForm && (
            <div className="inline-form">
              {configError && <div className="banner banner-error">{configError}</div>}
              <form className="form" onSubmit={createConfigFile}>
                <div className="form-grid">
                  <div className="field">
                    <label>File Name</label>
                    <input className="input" placeholder=".env" value={configForm.name}
                      onChange={e => setConfigForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="field">
                    <label>Relative Path</label>
                    <input className="input" placeholder="." value={configForm.relativePath}
                      onChange={e => setConfigForm(f => ({ ...f, relativePath: e.target.value }))} required />
                  </div>
                  <div className="field full">
                    <label>Content</label>
                    <textarea className="textarea" placeholder="PORT=3000&#10;NODE_ENV=production"
                      value={configForm.content}
                      onChange={e => setConfigForm(f => ({ ...f, content: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowConfigForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={configSaving}>
                    {configSaving ? 'Adding…' : 'Add Config File'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            {instance.configFiles.length === 0 ? (
              <div className="empty">No config files yet.</div>
            ) : (
              instance.configFiles.map(cf => (
                <div key={cf.id}>
                  <div className="list-item">
                    <div className="item-info">
                      <div className="item-name">{cf.name}</div>
                      <div className="item-meta">in: {cf.relativePath}</div>
                    </div>
                    <div className="item-actions">
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (editingConfigFile?.id === cf.id) return
                          setViewingConfigFile(viewingConfigFile?.id === cf.id ? null : cf)
                        }}>
                        {viewingConfigFile?.id === cf.id ? 'Hide' : '👁 View'}
                      </button>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => editingConfigFile?.id === cf.id ? setEditingConfigFile(null) : openEditConfigFile(cf)}>
                        {editingConfigFile?.id === cf.id ? 'Cancel' : '✏ Edit'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteConfigFile(cf.id)}>Delete</button>
                    </div>
                  </div>
                  {viewingConfigFile?.id === cf.id && editingConfigFile?.id !== cf.id && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <pre style={{
                        margin: 0,
                        padding: 12,
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 12,
                        lineHeight: 1.6,
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: 'var(--text)',
                      }}>{cf.content}</pre>
                    </div>
                  )}
                  {editingConfigFile?.id === cf.id && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                      {editConfigError && <div className="banner banner-error" style={{ margin: '12px 0 8px' }}>{editConfigError}</div>}
                      <form className="form" style={{ marginTop: 12 }} onSubmit={saveConfigFile}>
                        <div className="form-grid">
                          <div className="field">
                            <label>File Name</label>
                            <input className="input" value={editConfigForm.name}
                              onChange={e => setEditConfigForm(f => ({ ...f, name: e.target.value }))} required />
                          </div>
                          <div className="field">
                            <label>Relative Path</label>
                            <input className="input" value={editConfigForm.relativePath}
                              onChange={e => setEditConfigForm(f => ({ ...f, relativePath: e.target.value }))} required />
                          </div>
                          <div className="field full">
                            <label>Content</label>
                            <textarea className="textarea" value={editConfigForm.content}
                              onChange={e => setEditConfigForm(f => ({ ...f, content: e.target.value }))} required />
                          </div>
                        </div>
                        <div className="form-actions">
                          <button type="button" className="btn btn-ghost" onClick={() => setEditingConfigFile(null)}>Cancel</button>
                          <button type="submit" className="btn btn-primary" disabled={editConfigSaving}>
                            {editConfigSaving ? 'Saving…' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
