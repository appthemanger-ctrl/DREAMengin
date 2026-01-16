import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function getStoredAccount() {
  try { return JSON.parse(localStorage.getItem('dreamengin_account') || 'null') } catch { return null }
}

export default function Landing() {
  const nav = useNavigate()
  const [tab, setTab] = useState('login')

  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')

  const [loginError, setLoginError] = useState('')
  const [createError, setCreateError] = useState('')

  function onLogin(e) {
    e.preventDefault()
    setLoginError('')
    const acct = getStoredAccount()
    if (!acct) return setLoginError('No account found. Create one first.')
    if (loginUser.trim() !== acct.user || loginPass !== acct.pass) return setLoginError('Invalid username/password.')
    localStorage.setItem('dreamengin_user', acct.user)
    nav('/user?name=' + encodeURIComponent(acct.user))
  }

  function onCreate(e) {
    e.preventDefault()
    setCreateError('')
    const u = newUser.trim()
    if (u.length < 2) return setCreateError('Username too short.')
    if (newPass.length < 6) return setCreateError('Password must be 6+ chars.')
    localStorage.setItem('dreamengin_account', JSON.stringify({ user: u, pass: newPass }))
    localStorage.setItem('dreamengin_user', u)
    nav('/user?name=' + encodeURIComponent(u))
  }

  return (
    <div className="page">
      <div className="glass">
        <div className="logo">DREAMENGIN</div>
        <p style={{ textAlign:'center', opacity:.85, marginBottom:'1.5rem' }}>
          AI-assisted legal drafting, compliance checks, and auto-PR updates.
        </p>

        <div className="toggle">
          <button type="button" className={tab==='login' ? 'active' : ''} onClick={() => setTab('login')}>Login</button>
          <button type="button" className={tab==='create' ? 'active' : ''} onClick={() => setTab('create')}>Create Account</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={onLogin}>
            <label>Username
              <input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="your name" required />
            </label>
            <label>Password
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="password" required />
            </label>
            <button className="btn" type="submit">Login</button>
            {loginError ? <div className="error">{loginError}</div> : null}
          </form>
        ) : (
          <form onSubmit={onCreate}>
            <label>Choose username
              <input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="new name" required />
            </label>
            <label>Create password
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="new password" required />
            </label>
            <button className="btn" type="submit">Create & Go</button>
            {createError ? <div className="error">{createError}</div> : null}
          </form>
        )}

        <button className="btn secondary" type="button" onClick={() => nav('/admin')}>
          Open Admin Panel
        </button>
      </div>

      <footer>© 2025 DREAMENGIN – AI legal workflow automation</footer>
    </div>
  )
}
