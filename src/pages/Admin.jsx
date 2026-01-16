import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [cmd, setCmd] = useState('edit: make background darker')
  const [out, setOut] = useState('Ready.')

  function log(x) {
    setOut(typeof x === 'string' ? x : JSON.stringify(x, null, 2))
  }

  async function runCmd() {
    const c = cmd.trim()
    const pw = password.trim()
    if (!pw || !c) return alert('Missing password or command.')
    log('Working…')
    try {
      const [action, ...rest] = c.split(':')
      const instruction = rest.join(':').trim()
      const res = await fetch('/api/innerdreams', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw, action: action.trim(), instruction })
      })
      const data = await res.json()
      log(data)
    } catch (e) {
      log('Error: ' + e.message)
    }
  }

  async function sendCmd(action) {
    const pw = password.trim()
    if (!pw) return alert('Missing admin password.')
    try {
      const res = await fetch('/api/innerdreams', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw, action })
      })
      const data = await res.json()
      log(data)
    } catch (e) {
      log('Error: ' + e.message)
    }
  }

  function autoAI() {
    const pw = password.trim()
    if (!pw) return alert('Missing admin password.')
    if (!confirm('Start auto-worker? It will call autopilot every 60s.')) return
    setInterval(() => {
      fetch('/api/innerdreams', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw, action: 'autopilot' })
      })
        .then(r => r.json())
        .then(() => setOut((prev) => prev + '\n[Auto] autopilot called'))
        .catch(e => setOut((prev) => prev + '\n[Auto] ' + e.message))
    }, 60000)
    setOut('Auto worker ACTIVE → autopilot every 60s')
  }

  return (
    <div className="page">
      <div className="glass">
        <div className="logo">Admin Panel</div>

        <label>Admin Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="INNERDREAMS_PASSWORD" />
        </label>

        <label>Command
          <textarea value={cmd} onChange={(e) => setCmd(e.target.value)} />
        </label>

        <div className="row" style={{ marginTop:'1rem' }}>
          <button className="btn" type="button" onClick={runCmd}>Run Now</button>
          <button className="btn secondary" type="button" onClick={() => sendCmd('pause')}>Pause</button>
          <button className="btn secondary" type="button" onClick={() => sendCmd('resume')}>Resume</button>
        </div>

        <button className="btn secondary" type="button" onClick={autoAI} style={{ marginTop:'.5rem' }}>
          Start Auto Worker
        </button>

        <button className="btn secondary" type="button" onClick={() => nav('/')} style={{ marginTop:'.5rem' }}>
          Back
        </button>

        <pre id="out">{out}</pre>
      </div>

      <footer>© 2025 DREAMENGIN – AI legal workflow automation</footer>
    </div>
  )
}
