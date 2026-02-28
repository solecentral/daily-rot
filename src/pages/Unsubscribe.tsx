import React, { useEffect, useState } from 'react'
import axios from 'axios'

export function Unsubscribe() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')
    const token = params.get('token')

    if (!email || !token) {
      setStatus('error')
      setMessage('Invalid unsubscribe link. Missing email or token.')
      return
    }

    axios.post('/api/unsubscribe', { email, token })
      .then(res => {
        setStatus('success')
        setMessage(res.data.message || 'Successfully unsubscribed.')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Something went wrong.')
      })
  }, [])

  return (
    <div style={page}>
      <div style={card}>
        {status === 'loading' && (
          <>
            <div style={emoji}>⏳</div>
            <h1 style={title}>Processing...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={emoji}>💔</div>
            <h1 style={title}>You're out. For now.</h1>
            <p style={subtitle}>{message}</p>
            <p style={body}>
              You've been removed from The Daily Rot. Your brain will slowly start to heal.
              <br /><br />
              We're not mad. Just disappointed.
            </p>
            <a href="/" style={resubBtn}>Actually wait, re-subscribe →</a>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={emoji}>❌</div>
            <h1 style={title}>Uh oh</h1>
            <p style={subtitle}>{message}</p>
            <a href="/" style={homeBtn}>← Back to The Daily Rot</a>
          </>
        )}
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
  padding: '20px',
}

const card: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '16px',
  maxWidth: '480px',
  padding: '48px',
  textAlign: 'center',
  width: '100%',
}

const emoji: React.CSSProperties = { fontSize: '64px', marginBottom: '16px' }

const title: React.CSSProperties = {
  color: '#fff',
  fontSize: '32px',
  fontWeight: '900',
  margin: '0 0 8px',
  letterSpacing: '-1px',
}

const subtitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '16px',
  margin: '0 0 16px',
}

const body: React.CSSProperties = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 32px',
}

const resubBtn: React.CSSProperties = {
  backgroundColor: '#39ff14',
  borderRadius: '8px',
  color: '#0a0a0a',
  display: 'inline-block',
  fontWeight: '800',
  fontSize: '15px',
  padding: '14px 28px',
  textDecoration: 'none',
}

const homeBtn: React.CSSProperties = {
  color: '#555',
  display: 'inline-block',
  fontSize: '14px',
  textDecoration: 'none',
}
