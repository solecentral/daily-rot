import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Issue, IssueContent } from '../../types'

interface IssueEditorProps {
  issue?: Issue | null
  onSaved?: (issue: Issue) => void
  onCancel?: () => void
}

const defaultContent = (): IssueContent => ({
  rotReport: [
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
  ],
  memeOfTheDay: { description: '', imageUrl: null },
  seriousNewsStupid: { headline: '', take: '' },
  whoGotCooked: { who: '', what: '' },
  unhingedFact: '',
})

export function IssueEditor({ issue, onSaved, onCancel }: IssueEditorProps) {
  const [subject, setSubject] = useState(issue?.subject || '')
  const [scheduledFor, setScheduledFor] = useState(issue?.scheduledFor?.slice(0, 16) || '')
  const [content, setContent] = useState<IssueContent>(issue?.content || defaultContent())
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (issue) {
      setSubject(issue.subject)
      setScheduledFor(issue.scheduledFor?.slice(0, 16) || '')
      setContent(issue.content)
    }
  }, [issue])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await axios.post('/api/issues/generate')
      setContent(res.data)
      toast.success('Content generated! 🔥 Tweak as needed.')
    } catch {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { subject, scheduledFor: new Date(scheduledFor).toISOString(), content }
      let res
      if (issue?.id) {
        res = await axios.put(`/api/issues/${issue.id}`, payload)
      } else {
        res = await axios.post('/api/issues', payload)
      }
      toast.success('Issue saved! 💾')
      onSaved?.(res.data)
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const updateRotReport = (i: number, field: 'title' | 'description' | 'articleSlug', value: string) => {
    const updated = [...content.rotReport]
    updated[i] = { ...updated[i], [field]: value }
    setContent({ ...content, rotReport: updated })
  }

  return (
    <div style={container}>
      <div style={topBar}>
        <h2 style={editorTitle}>{issue ? `Edit Issue #${issue.issueNumber}` : 'New Issue'}</h2>
        <button onClick={handleGenerate} disabled={generating} style={genBtn}>
          {generating ? '⚡ Generating...' : '⚡ Generate Content'}
        </button>
      </div>

      <div style={field}>
        <label style={label}>Subject Line</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} style={input} placeholder="🔥 Issue #X: ..." />
      </div>

      <div style={field}>
        <label style={label}>Scheduled For</label>
        <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} style={input} />
      </div>

      {/* Rot Report */}
      <div style={sectionBlock}>
        <div style={sectionLabel}>🔥 THE ROT REPORT</div>
        {content.rotReport.map((item, i) => (
          <div key={i} style={rotBlock}>
            <div style={rotNum}>#{i + 1}</div>
            <div style={{ flex: 1 }}>
              <input
                value={item.title}
                onChange={e => updateRotReport(i, 'title', e.target.value)}
                style={input}
                placeholder={`Rot moment #${i + 1} title`}
              />
              <textarea
                value={item.description}
                onChange={e => updateRotReport(i, 'description', e.target.value)}
                style={textarea}
                placeholder="The juicy details..."
                rows={3}
              />
              <input
                value={item.articleSlug || ''}
                onChange={e => updateRotReport(i, 'articleSlug', e.target.value)}
                style={slugInput}
                placeholder="article-slug (optional)"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Meme */}
      <div style={sectionBlock}>
        <div style={sectionLabel}>🐸 MEME OF THE DAY</div>
        <textarea
          value={content.memeOfTheDay.description}
          onChange={e => setContent({ ...content, memeOfTheDay: { ...content.memeOfTheDay, description: e.target.value } })}
          style={textarea}
          placeholder="Describe the meme..."
          rows={3}
        />
        <input
          value={content.memeOfTheDay.imageUrl || ''}
          onChange={e => setContent({ ...content, memeOfTheDay: { ...content.memeOfTheDay, imageUrl: e.target.value || null } })}
          style={input}
          placeholder="Image URL (optional)"
        />
      </div>

      {/* News */}
      <div style={sectionBlock}>
        <div style={sectionLabel}>📰 SERIOUS NEWS BUT MAKE IT STUPID</div>
        <input
          value={content.seriousNewsStupid.headline}
          onChange={e => setContent({ ...content, seriousNewsStupid: { ...content.seriousNewsStupid, headline: e.target.value } })}
          style={input}
          placeholder="Real headline..."
        />
        <textarea
          value={content.seriousNewsStupid.take}
          onChange={e => setContent({ ...content, seriousNewsStupid: { ...content.seriousNewsStupid, take: e.target.value } })}
          style={textarea}
          placeholder="Your unhinged take..."
          rows={3}
        />
        <input
          value={content.seriousNewsStupid.articleSlug || ''}
          onChange={e => setContent({ ...content, seriousNewsStupid: { ...content.seriousNewsStupid, articleSlug: e.target.value } })}
          style={slugInput}
          placeholder="article-slug (optional)"
        />
      </div>

      {/* Cooked */}
      <div style={sectionBlock}>
        <div style={sectionLabel}>💀 WHO GOT COOKED TODAY</div>
        <input
          value={content.whoGotCooked.who}
          onChange={e => setContent({ ...content, whoGotCooked: { ...content.whoGotCooked, who: e.target.value } })}
          style={input}
          placeholder="Who got cooked?"
        />
        <textarea
          value={content.whoGotCooked.what}
          onChange={e => setContent({ ...content, whoGotCooked: { ...content.whoGotCooked, what: e.target.value } })}
          style={textarea}
          placeholder="What did they do?"
          rows={3}
        />
        <input
          value={content.whoGotCooked.articleSlug || ''}
          onChange={e => setContent({ ...content, whoGotCooked: { ...content.whoGotCooked, articleSlug: e.target.value } })}
          style={slugInput}
          placeholder="article-slug (optional)"
        />
      </div>

      {/* Fact */}
      <div style={sectionBlock}>
        <div style={sectionLabel}>🎲 RANDOM UNHINGED FACT</div>
        <textarea
          value={content.unhingedFact}
          onChange={e => setContent({ ...content, unhingedFact: e.target.value })}
          style={textarea}
          placeholder="The unhinged fact..."
          rows={3}
        />
        <input
          value={content.unhingedFactSlug || ''}
          onChange={e => setContent({ ...content, unhingedFactSlug: e.target.value })}
          style={slugInput}
          placeholder="article-slug (optional)"
        />
      </div>

      <div style={actions}>
        {onCancel && <button onClick={onCancel} style={cancelBtn}>Cancel</button>}
        <button onClick={handleSave} disabled={saving} style={saveBtn}>
          {saving ? 'Saving...' : '💾 Save Issue'}
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

const genBtn: React.CSSProperties = {
  backgroundColor: '#1a2a1a',
  border: '1px solid #39ff14',
  borderRadius: '6px',
  color: '#39ff14',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '700',
  padding: '8px 16px',
  fontFamily: 'inherit',
}

const field: React.CSSProperties = { marginBottom: '16px' }

const label: React.CSSProperties = {
  color: '#555',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase',
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
  boxSizing: 'border-box',
  outline: 'none',
  marginBottom: '8px',
}

const textarea: React.CSSProperties = {
  ...input,
  resize: 'vertical',
  lineHeight: '1.5',
}

const sectionBlock: React.CSSProperties = {
  backgroundColor: '#0d0d0d',
  border: '1px solid #1e1e1e',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
}

const sectionLabel: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: '12px',
}

const rotBlock: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  marginBottom: '16px',
}

const rotNum: React.CSSProperties = {
  color: '#39ff14',
  fontWeight: '900',
  fontSize: '18px',
  paddingTop: '8px',
  minWidth: '24px',
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

const slugInput: React.CSSProperties = {
  ...input,
  fontSize: '12px',
  padding: '6px 10px',
  color: '#666',
  fontFamily: 'monospace',
  borderColor: '#1a1a1a',
}

const cancelBtn: React.CSSProperties = {
  ...saveBtn,
  backgroundColor: 'transparent',
  border: '1px solid #333',
  color: '#888',
}
