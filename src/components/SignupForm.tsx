import React from 'react'
import { useSubscribe } from '../hooks/useSubscribe'

interface SignupFormProps {
  subscriberCount?: number
  size?: 'large' | 'small'
}

export function SignupForm({ subscriberCount, size = 'large' }: SignupFormProps) {
  const { email, setEmail, loading, subscribed, subscribe } = useSubscribe()

  if (subscribed) {
    return (
      <div style={successContainer}>
        <div style={successEmoji}>🔥</div>
        <h3 style={successTitle}>YOU'RE IN, DEGEN.</h3>
        <p style={successText}>Check your inbox. Your brain will never be the same.</p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={subscribe} style={size === 'large' ? formLarge : formSmall}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={size === 'large' ? inputLarge : inputSmall}
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          style={size === 'large' ? btnLarge : btnSmall}
        >
          {loading ? 'ROTTING...' : 'SEND THE ROT 🧠'}
        </button>
      </form>
      {subscriberCount !== undefined && size === 'large' && (
        <p style={counterText}>
          <strong style={{ color: '#39ff14' }}>{subscriberCount.toLocaleString()}</strong> brains already rotting — yours next?
        </p>
      )}
    </div>
  )
}

const formLarge: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxWidth: '480px',
  margin: '0 auto',
}

const formSmall: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
}

const inputBase: React.CSSProperties = {
  backgroundColor: '#111',
  border: '2px solid #333',
  borderRadius: '6px',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: '16px',
  padding: '14px 18px',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
  boxSizing: 'border-box',
}

const inputLarge: React.CSSProperties = { ...inputBase, fontSize: '18px', padding: '18px 20px' }
const inputSmall: React.CSSProperties = { ...inputBase, fontSize: '14px', padding: '10px 14px' }

const btnBase: React.CSSProperties = {
  backgroundColor: '#39ff14',
  border: 'none',
  borderRadius: '6px',
  color: '#0a0a0a',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: '900',
  letterSpacing: '1px',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
}

const btnLarge: React.CSSProperties = {
  ...btnBase,
  fontSize: '18px',
  padding: '18px 32px',
  width: '100%',
}

const btnSmall: React.CSSProperties = {
  ...btnBase,
  fontSize: '13px',
  padding: '10px 16px',
}

const counterText: React.CSSProperties = {
  color: '#555',
  fontSize: '14px',
  textAlign: 'center',
  margin: '12px 0 0',
}

const successContainer: React.CSSProperties = {
  textAlign: 'center',
  padding: '32px',
  backgroundColor: '#111',
  border: '2px solid #39ff14',
  borderRadius: '12px',
}

const successEmoji: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '12px',
}

const successTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '28px',
  fontWeight: '900',
  margin: '0 0 8px',
  letterSpacing: '-1px',
}

const successText: React.CSSProperties = {
  color: '#aaa',
  fontSize: '16px',
  margin: '0',
}
