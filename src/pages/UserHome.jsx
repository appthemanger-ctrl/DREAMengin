import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function UserHome() {
  const nav = useNavigate()
  const q = useQuery()
  const [name, setName] = useState('Guest')

  useEffect(() => {
    setName(q.get('name') || localStorage.getItem('dreamengin_user') || 'Guest')
  }, [])

  function logout() {
    localStorage.clear()
    nav('/')
  }

  return (
    <div className="page">
      <main className="glass">
        <div className="logo">Welcome, {name}!</div>
        <p style={{ opacity:.85 }}>Your private homepage – only you can see this.</p>
        <div className="row" style={{ marginTop:'1rem' }}>
          <button className="btn secondary" type="button" onClick={() => nav('/')}>Back to Main</button>
          <button className="btn" type="button" onClick={logout}>Logout</button>
        </div>
      </main>
      <footer>© 2025 DREAMENGIN – AI legal workflow automation</footer>
    </div>
  )
}
