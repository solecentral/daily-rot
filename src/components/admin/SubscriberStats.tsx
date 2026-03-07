import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Stats, Subscriber } from '../../types'

type SortKey = 'subscribedAt' | 'email' | 'active'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

export function SubscriberStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('subscribedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data)).catch(() => {})
    axios.get('/api/subscribers').then(r => setSubscribers(r.data)).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    let list = subscribers
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(s => s.email.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'email') cmp = a.email.localeCompare(b.email)
      else if (sortKey === 'active') cmp = Number(a.active) - Number(b.active)
      else cmp = a.subscribedAt.localeCompare(b.subscribedAt)
      return sortDir === 'desc' ? -cmp : cmp
    })
    return list
  }, [subscribers, search, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  const handleUnsubscribe = async (id: string) => {
    try {
      await axios.delete(`/api/subscribers/${id}`)
      setSubscribers(prev => prev.map(s => s.id === id ? { ...s, active: false } : s))
      toast.success('Subscriber deactivated')
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  const handleExport = () => {
    window.open('/api/subscribers/export', '_blank')
  }

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const sortArrow = (key: SortKey) => sortKey === key ? (sortDir === 'desc' ? ' \u25BC' : ' \u25B2') : ''

  if (!stats) return <div style={loading}>Loading stats...</div>

  const statCards = [
    { label: 'Active Subscribers', value: stats.activeSubscribers.toLocaleString(), emoji: '🧟' },
    { label: 'Issues Sent', value: stats.issuesSent.toString(), emoji: '📬' },
    { label: 'Open Rate', value: `${stats.openRate}%`, emoji: '👀' },
    { label: 'Click Rate', value: `${stats.clickRate}%`, emoji: '🖱️' },
  ]

  return (
    <div>
      <div style={statsGrid}>
        {statCards.map((s, i) => (
          <div key={i} style={statCard}>
            <div style={statEmoji}>{s.emoji}</div>
            <div style={statValue}>{s.value}</div>
            <div style={statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={chartContainer}>
        <h3 style={chartTitle}>SUBSCRIBER GROWTH (30 DAYS)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis
              dataKey="date"
              tickFormatter={d => d.slice(5)}
              tick={{ fill: '#555', fontSize: 11 }}
              axisLine={{ stroke: '#222' }}
            />
            <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={{ stroke: '#222' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '6px' }}
              labelStyle={{ color: '#888' }}
              itemStyle={{ color: '#39ff14' }}
            />
            <Line
              type="monotone"
              dataKey="subscribers"
              stroke="#39ff14"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#39ff14' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subscriber Table */}
      <div style={tableSection}>
        <div style={tableHeader}>
          <h3 style={chartTitle}>ALL SUBSCRIBERS</h3>
          <span style={countText}>Showing {paged.length} of {filtered.length} subscribers</span>
        </div>

        <div style={toolBar}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            style={searchInput}
            placeholder="Filter by email..."
          />
          <button onClick={handleExport} style={exportBtn}>Export CSV</button>
        </div>

        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th} onClick={() => handleSort('email')}>Email{sortArrow('email')}</th>
                <th style={th} onClick={() => handleSort('active')}>Status{sortArrow('active')}</th>
                <th style={th} onClick={() => handleSort('subscribedAt')}>Date{sortArrow('subscribedAt')}</th>
                <th style={th}>ID</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(sub => (
                <tr key={sub.id} style={row}>
                  <td style={td}>{sub.email}</td>
                  <td style={td}>
                    <span style={{ ...statusDot, backgroundColor: sub.active ? '#39ff14' : '#ff4444' }} />
                    <span style={{ color: sub.active ? '#39ff14' : '#ff4444' }}>
                      {sub.active ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td style={td}>{fmtDate(sub.subscribedAt)}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>{sub.id}</td>
                  <td style={td}>
                    {sub.active && (
                      <button onClick={() => handleUnsubscribe(sub.id)} style={unsubBtn}>Unsubscribe</button>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#555' }}>No subscribers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={pagination}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={pageBtn}>Prev</button>
            <span style={pageInfo}>Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={pageBtn}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

const loading: React.CSSProperties = { color: '#555', padding: '20px', textAlign: 'center' }

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '12px',
  marginBottom: '24px',
}

const statCard: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center',
}

const statEmoji: React.CSSProperties = { fontSize: '28px', marginBottom: '8px' }
const statValue: React.CSSProperties = { color: '#39ff14', fontSize: '28px', fontWeight: '900', margin: '0' }
const statLabel: React.CSSProperties = { color: '#555', fontSize: '12px', marginTop: '4px' }

const chartContainer: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '10px',
  padding: '20px',
  marginBottom: '24px',
}

const chartTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '2px',
  margin: '0',
}

const tableSection: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '10px',
  padding: '20px',
}

const tableHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
}

const countText: React.CSSProperties = {
  color: '#555',
  fontSize: '12px',
}

const toolBar: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '16px',
}

const searchInput: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: '13px',
  padding: '8px 12px',
  outline: 'none',
}

const exportBtn: React.CSSProperties = {
  backgroundColor: '#1a2a1a',
  border: '1px solid #39ff14',
  borderRadius: '6px',
  color: '#39ff14',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '700',
  padding: '8px 16px',
  fontFamily: 'inherit',
}

const tableWrap: React.CSSProperties = { overflowX: 'auto' }

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
}

const th: React.CSSProperties = {
  color: '#555',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '1px solid #1e1e1e',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  userSelect: 'none',
}

const td: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #141414',
  color: '#ccc',
  whiteSpace: 'nowrap',
}

const row: React.CSSProperties = {}

const statusDot: React.CSSProperties = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  marginRight: '6px',
  verticalAlign: 'middle',
}

const unsubBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #ff4444',
  borderRadius: '4px',
  color: '#ff4444',
  cursor: 'pointer',
  fontSize: '11px',
  padding: '4px 10px',
  fontFamily: 'inherit',
}

const pagination: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  marginTop: '16px',
}

const pageBtn: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#888',
  cursor: 'pointer',
  fontSize: '12px',
  padding: '6px 14px',
  fontFamily: 'inherit',
}

const pageInfo: React.CSSProperties = {
  color: '#555',
  fontSize: '12px',
}
