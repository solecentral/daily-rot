import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Stats } from '../../types'

export function SubscriberStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

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
}

const chartTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '2px',
  margin: '0 0 16px',
}
