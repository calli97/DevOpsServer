import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [url, setUrl]       = useState(localStorage.getItem('devops_url') ?? '')
  const [apiKey, setApiKey] = useState(localStorage.getItem('devops_apikey') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showKey, setShowKey] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      localStorage.setItem('devops_url', url.replace(/\/$/, ''))
      localStorage.setItem('devops_apikey', apiKey)

      const res = await api.status() as { ok: boolean }
      if (res?.ok) {
        navigate('/projects')
      } else {
        setError('Server responded but returned an unexpected result.')
        localStorage.removeItem('devops_url')
        localStorage.removeItem('devops_apikey')
      }
    } catch {
      setError('Could not connect to the server. Check the URL and try again.')
      localStorage.removeItem('devops_url')
      localStorage.removeItem('devops_apikey')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">⚙ DevOps Manager</div>
        <div className="login-sub">Enter your server URL and API key to continue.</div>

        {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Server URL</label>
            <input
              className="input"
              type="text"
              placeholder="http://localhost:3040"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>API Key</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                placeholder="your-api-key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flexShrink: 0 }}
                onClick={() => setShowKey(v => !v)}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  )
}
