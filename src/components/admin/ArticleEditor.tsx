import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Article } from '../../types'

interface ArticleEditorProps {
  article?: Article | null
  onSaved: (article: Article) => void
  onCancel: () => void
}

const sectionOptions = [
  { value: 'rotReport', label: '🔥 Rot Report' },
  { value: 'seriousNews', label: '📰 Serious News But Make It Stupid' },
  { value: 'whoGotCooked', label: '💀 Who Got Cooked' },
  { value: 'unhingedFact', label: '🎲 Unhinged Fact' },
]

export function ArticleEditor({ article, onSaved, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || '')
  const [section, setSection] = useState<Article['section']>(article?.section || 'rotReport')
  const [content, setContent] = useState(article?.content || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [memeImageUrl, setMemeImageUrl] = useState(article?.memeImageUrl || '')
  const [issueId, setIssueId] = useState(article?.issueId || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (article) {
      setTitle(article.title)
      setSection(article.section)
      setContent(article.content)
      setExcerpt(article.excerpt)
      setMemeImageUrl(article.memeImageUrl || '')
      setIssueId(article.issueId || '')
    }
  }, [article])

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!content.trim()) { toast.error('Content is required'); return }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        section,
        content: content.trim(),
        excerpt: excerpt.trim(),
        memeImageUrl: memeImageUrl.trim() || null,
        issueId: issueId.trim() || '',
      }
      let res
      if (article?.id) {
        res = await axios.put(`/api/articles/${article.id}`, payload)
      } else {
        res = await axios.post('/api/articles', payload)
      }
      toast.success(article?.id ? 'Article updated! ✅' : 'Article created! 🔥')
      onSaved(res.data)
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={container}>
      <div style={topBar}>
        <h2 style={editorTitle}>{article ? 'Edit Article' : 'New Article'}</h2>
      </div>

      <div style={field}>
        <label style={label}>Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={input}
          placeholder="Article title..."
        />
      </div>

      <div style={field}>
        <label style={label}>Section</label>
        <select
          value={section}
          onChange={e => setSection(e.target.value as Article['section'])}
          style={{ ...input, cursor: 'pointer' }}
        >
          {sectionOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={field}>
        <label style={label}>Excerpt (shown in listings)</label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          style={textarea}
          placeholder="Short teaser, 1-2 sentences..."
          rows={3}
        />
      </div>

      <div style={field}>
        <label style={label}>Full Content (HTML supported)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ ...textarea, minHeight: '240px' }}
          placeholder="Full article content... HTML tags like <p>, <strong>, <a href='...'> are supported."
          rows={12}
        />
      </div>

      <div style={field}>
        <label style={label}>Meme Image URL (optional)</label>
        <input
          value={memeImageUrl}
          onChange={e => setMemeImageUrl(e.target.value)}
          style={input}
          placeholder="https://..."
        />
      </div>

      <div style={field}>
        <label style={label}>Issue ID (optional, links article to an issue)</label>
        <input
          value={issueId}
          onChange={e => setIssueId(e.target.value)}
          style={input}
          placeholder="issue_abc123..."
        />
      </div>

      {article?.slug && (
        <div style={slugLine}>
          <span style={{ color: '#555', fontSize: '12px' }}>Slug: </span>
          <a
            href={`/article/${article.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#39ff14', fontSize: '12px' }}
          >
            /article/{article.slug}
          </a>
        </div>
      )}

      <div style={actions}>
        <button onClick={onCancel} style={cancelBtn}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={saveBtn}>
          {saving ? 'Saving...' : article ? '💾 Update Article' : '🔥 Publish Article'}
        </button>
      </div>
    </div>
  )
}

const container: React.CSSProperties = {}

const topBar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
}

const editorTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '20px',
  fontWeight: '800',
  margin: '0',
}

const field: React.CSSProperties = { marginBottom: '16px' }

const label: React.CSSProperties = {
  color: '#555',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  display: 'block',
  marginBottom: '6px',
}

const input: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: '14px',
  padding: '10px 14px',
  width: '100%',
  boxSizing: 'border-box' as const,
  outline: 'none',
}

const textarea: React.CSSProperties = {
  ...input,
  resize: 'vertical' as const,
  lineHeight: '1.5',
}

const slugLine: React.CSSProperties = {
  marginBottom: '16px',
  padding: '8px 12px',
  backgroundColor: '#0d0d0d',
  border: '1px solid #1e1e1e',
  borderRadius: '6px',
}

const actions: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '24px',
}

const saveBtn: React.CSSProperties = {
  backgroundColor: '#39ff14',
  border: 'none',
  borderRadius: '6px',
  color: '#0a0a0a',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: '800',
  padding: '12px 24px',
}

const cancelBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #333',
  borderRadius: '6px',
  color: '#888',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: '700',
  padding: '12px 24px',
}
