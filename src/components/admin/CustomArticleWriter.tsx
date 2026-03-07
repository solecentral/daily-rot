import React, { useState } from 'react'
import axios from 'axios'
import { Article } from '../../types'

const SECTIONS = [
  { value: 'rotReport', label: '🔥 Rot Report — viral moment, meme chaos' },
  { value: 'seriousNews', label: '📰 Serious News But Stupid — real news, unhinged take' },
  { value: 'whoGotCooked', label: '💀 Who Got Cooked — someone got destroyed online' },
  { value: 'unhingedFact', label: '🎲 Unhinged Fact — bizarre fact deep dive' },
]

interface GeneratedArticle extends Article {
  slug: string
  title: string
  content: string
  excerpt: string
}

export function CustomArticleWriter({ adminSecret }: { adminSecret: string }) {
  const [topic, setTopic] = useState('')
  const [section, setSection] = useState('rotReport')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedArticle | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setSuccess('')

    try {
      const resp = await axios.post(
        '/api/research/custom',
        { topic: topic.trim(), section, notes },
        { headers: { 'X-Admin-Secret': adminSecret }, timeout: 60000 }
      )
      setResult(resp.data.article)
      setSuccess('Article generated and published!')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error || 'Generation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRunResearch = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const resp = await axios.post(
        '/api/research/articles',
        {},
        { headers: { 'X-Admin-Secret': adminSecret }, timeout: 120000 }
      )
      setSuccess(`Research run complete — ${resp.data.generated} articles written!`)
    } catch {
      setError('Research run failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={container}>
      {/* Section header */}
      <div style={sectionHeader}>
        <h2 style={sectionTitle}>🔬 AI Article Writer</h2>
        <p style={sectionDesc}>
          Drop a topic and let AI research + write a full 700-1000 word article.
          Articles are published instantly and available to link in the next newsletter.
        </p>
      </div>

      {/* Custom Article Writer */}
      <div style={card}>
        <div style={cardTitle}>✍️ Custom Article</div>

        <div style={fieldGroup}>
          <label style={label}>Topic / Title *</label>
          <input
            style={input}
            placeholder="e.g. 'The NPC TikTok trend', 'skibidi toilet lore explained', 'why everyone is brain rotting on Letterboxd'"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>Section</label>
          <select style={select} value={section} onChange={e => setSection(e.target.value)}>
            {SECTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={fieldGroup}>
          <label style={label}>Extra notes / angle (optional)</label>
          <textarea
            style={textarea}
            placeholder="Any specific angle, context, or notes you want included..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button
          style={loading ? { ...btn, opacity: 0.6, cursor: 'not-allowed' } : btn}
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
        >
          {loading ? '🤖 Researching + Writing...' : '🔬 Research & Write Article'}
        </button>
      </div>

      {/* Auto Research Run */}
      <div style={card}>
        <div style={cardTitle}>🕵️ Auto Research Run</div>
        <p style={cardDesc}>
          Trigger the research pipeline now — scans Reddit + web for trending brainrot,
          writes 3 full articles automatically. Also runs every 6 hours via cron.
        </p>
        <button
          style={loading ? { ...btnSecondary, opacity: 0.6, cursor: 'not-allowed' } : btnSecondary}
          onClick={handleRunResearch}
          disabled={loading}
        >
          {loading ? '🔄 Running...' : '🚀 Run Research Now'}
        </button>
      </div>

      {/* Status messages */}
      {error && <div style={errorBox}>{error}</div>}
      {success && <div style={successBox}>{success}</div>}

      {/* Generated Article Preview */}
      {result && (
        <div style={previewCard}>
          <div style={previewHeader}>
            <span style={previewTag}>Article Published</span>
            <a
              href={`/article/${result.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={previewLink}
            >
              View Live →
            </a>
          </div>
          <h3 style={previewTitle}>{result.title}</h3>
          <p style={previewExcerpt}>{result.excerpt}</p>
          <div style={previewMeta}>
            Slug: <code style={code}>/article/{result.slug}</code>
          </div>
          <div
            style={previewContent}
            dangerouslySetInnerHTML={{ __html: result.content.slice(0, 800) + (result.content.length > 800 ? '...' : '') }}
          />
        </div>
      )}
    </div>
  )
}

// Styles
const container: React.CSSProperties = { padding: '0 0 40px' }

const sectionHeader: React.CSSProperties = { marginBottom: '24px' }

const sectionTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '24px',
  fontWeight: '900',
  margin: '0 0 8px',
  letterSpacing: '-0.5px',
}

const sectionDesc: React.CSSProperties = {
  color: '#888',
  fontSize: '14px',
  margin: 0,
  lineHeight: 1.5,
}

const card: React.CSSProperties = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '16px',
}

const cardTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '14px',
  fontWeight: '800',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '16px',
}

const cardDesc: React.CSSProperties = {
  color: '#888',
  fontSize: '13px',
  lineHeight: 1.6,
  margin: '0 0 16px',
}

const fieldGroup: React.CSSProperties = { marginBottom: '16px' }

const label: React.CSSProperties = {
  display: 'block',
  color: '#aaa',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '8px',
}

const input: React.CSSProperties = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #333',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const select: React.CSSProperties = {
  ...input,
  cursor: 'pointer',
}

const textarea: React.CSSProperties = {
  ...input,
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.5,
}

const btn: React.CSSProperties = {
  background: '#39ff14',
  color: '#000',
  border: 'none',
  borderRadius: '6px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: '800',
  cursor: 'pointer',
  letterSpacing: '0.5px',
}

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  color: '#39ff14',
  border: '1px solid #39ff14',
  borderRadius: '6px',
  padding: '10px 20px',
  fontSize: '13px',
  fontWeight: '700',
  cursor: 'pointer',
}

const errorBox: React.CSSProperties = {
  background: '#1a0505',
  border: '1px solid #ef5350',
  borderRadius: '6px',
  color: '#ef5350',
  padding: '12px 16px',
  fontSize: '13px',
  marginBottom: '16px',
}

const successBox: React.CSSProperties = {
  background: '#051a08',
  border: '1px solid #39ff14',
  borderRadius: '6px',
  color: '#39ff14',
  padding: '12px 16px',
  fontSize: '13px',
  marginBottom: '16px',
}

const previewCard: React.CSSProperties = {
  background: '#0d1a0d',
  border: '1px solid #39ff14',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '8px',
}

const previewHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
}

const previewTag: React.CSSProperties = {
  background: '#39ff14',
  color: '#000',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '1px',
  padding: '3px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
}

const previewLink: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '13px',
  textDecoration: 'none',
  fontWeight: '700',
}

const previewTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '20px',
  fontWeight: '800',
  margin: '0 0 8px',
}

const previewExcerpt: React.CSSProperties = {
  color: '#aaa',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0 0 12px',
}

const previewMeta: React.CSSProperties = {
  color: '#555',
  fontSize: '11px',
  marginBottom: '16px',
}

const code: React.CSSProperties = {
  background: '#1a1a1a',
  padding: '2px 6px',
  borderRadius: '3px',
  fontFamily: 'monospace',
  color: '#39ff14',
}

const previewContent: React.CSSProperties = {
  color: '#aaa',
  fontSize: '13px',
  lineHeight: 1.7,
  borderTop: '1px solid #1a3a1a',
  paddingTop: '16px',
}
