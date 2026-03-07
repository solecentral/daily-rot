import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Issue, Article } from '../../types'
import { SubscriberStats } from './SubscriberStats'
import { IssueEditor } from './IssueEditor'
import { IssuePreview } from '../IssuePreview'
import { ArticleEditor } from './ArticleEditor'
import { CustomArticleWriter } from './CustomArticleWriter'

type View = 'dashboard' | 'new-issue' | 'edit-issue' | 'preview-issue' | 'new-article' | 'edit-article'
type AdminTab = 'issues' | 'articles' | 'research'

const ADMIN_KEY = 'dailyrot_admin_authed'

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    // Password stored in env is checked here client-side; for extra security this also hits /api/admin/verify
    axios.post('/api/admin/verify', { password: pw })
      .then(() => { sessionStorage.setItem(ADMIN_KEY, '1'); onAuth() })
      .catch(() => setErr(true))
  }
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handle} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 40, minWidth: 320 }}>
        <div style={{ color: '#39ff14', fontWeight: 900, fontSize: 22, marginBottom: 24, fontFamily: 'Black Ops One, sans-serif' }}>ADMIN ACCESS</div>
        <input
          type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false) }}
          placeholder="Enter admin password" autoFocus
          style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${err ? '#ef5350' : '#333'}`, borderRadius: 8, color: '#fff', fontSize: 15, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />
        {err && <div style={{ color: '#ef5350', fontSize: 13, marginBottom: 12 }}>Wrong password.</div>}
        <button type="submit" style={{ width: '100%', background: '#39ff14', border: 'none', borderRadius: 8, color: '#0a0a0a', cursor: 'pointer', fontWeight: 800, fontSize: 15, padding: '11px 0' }}>
          ENTER
        </button>
      </form>
    </div>
  )
}

export function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(ADMIN_KEY) === '1')
  const [issues, setIssues] = useState<Issue[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [view, setView] = useState<View>('dashboard')
  const [adminTab, setAdminTab] = useState<AdminTab>('issues')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendModal, setSendModal] = useState<Issue | null>(null)
  const [testEmailModal, setTestEmailModal] = useState<Issue | null>(null)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [activeSubCount, setActiveSubCount] = useState<number>(0)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [fetchingMemes, setFetchingMemes] = useState(false)

  const loadIssues = () => {
    axios.get('/api/issues').then(r => setIssues(r.data)).catch(() => {})
  }

  const loadArticles = () => {
    axios.get('/api/articles').then(r => setArticles(r.data)).catch(() => {})
  }

  useEffect(() => {
    loadIssues()
    loadArticles()
    axios.get('/api/stats').then(r => setActiveSubCount(r.data.activeSubscribers)).catch(() => {})
  }, [])

  const handleGenerateArticles = async (issue: Issue) => {
    setGeneratingId(issue.id)
    try {
      const res = await axios.post(`/api/articles/generate/${issue.id}`)
      toast.success(`Generated ${res.data.generated} articles!`)
      loadArticles()
    } catch {
      toast.error('Failed to generate articles')
    } finally {
      setGeneratingId(null)
    }
  }

  const handleFetchMemes = async () => {
    setFetchingMemes(true)
    try {
      const res = await axios.get('/api/memes/fetch')
      const memes: Array<{ url: string; title: string }> = res.data.memes
      if (memes.length === 0) {
        toast.error('No image memes found on Reddit right now')
        return
      }
      const meme = memes[0]
      toast.success(`Fetched ${res.data.count} memes! Top: "${meme.title.slice(0, 40)}..."`)
    } catch {
      toast.error('Failed to fetch memes from Reddit')
    } finally {
      setFetchingMemes(false)
    }
  }

  const handleSend = async (issue: Issue) => {
    setSendingId(issue.id)
    setSendModal(null)
    try {
      const res = await axios.post(`/api/issues/${issue.id}/send`)
      toast.success(res.data.message)
      loadIssues()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || 'Send failed')
      } else {
        toast.error('Send failed')
      }
    } finally {
      setSendingId(null)
    }
  }

  const handleIssueSaved = (issue: Issue) => {
    loadIssues()
    setView('dashboard')
    setSelectedIssue(null)
  }

  const handleArticleSaved = (article: Article) => {
    loadArticles()
    setView('dashboard')
    setSelectedArticle(null)
    setAdminTab('articles')
  }

  const handleSendTest = async () => {
    if (!testEmailModal) return
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      toast.error('Enter a valid email address')
      return
    }
    setSendingTest(true)
    try {
      await axios.post(`/api/issues/${testEmailModal.id}/send-test`, { email: testEmailAddress })
      toast.success(`Test email sent to ${testEmailAddress}! 📬`)
      setTestEmailModal(null)
      setTestEmailAddress('')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || 'Test send failed')
      } else {
        toast.error('Test send failed')
      }
    } finally {
      setSendingTest(false)
    }
  }

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />

  if (view === 'new-issue') {
    return (
      <div style={page}>
        <AdminNav onBack={() => setView('dashboard')} title="New Issue" />
        <div style={content}>
          <IssueEditor
            onSaved={handleIssueSaved}
            onCancel={() => setView('dashboard')}
          />
        </div>
      </div>
    )
  }

  if (view === 'edit-issue' && selectedIssue) {
    return (
      <div style={page}>
        <AdminNav onBack={() => setView('dashboard')} title={`Edit Issue #${selectedIssue.issueNumber}`} />
        <div style={content}>
          <IssueEditor
            issue={selectedIssue}
            onSaved={handleIssueSaved}
            onCancel={() => setView('dashboard')}
          />
        </div>
      </div>
    )
  }

  if (view === 'preview-issue' && selectedIssue) {
    return (
      <div style={page}>
        <AdminNav onBack={() => setView('dashboard')} title={`Preview Issue #${selectedIssue.issueNumber}`} />
        <div style={content}>
          <IssuePreview issue={selectedIssue} />
        </div>
      </div>
    )
  }

  if (view === 'new-article' || view === 'edit-article') {
    return (
      <div style={page}>
        <AdminNav onBack={() => { setView('dashboard'); setSelectedArticle(null) }} title={view === 'new-article' ? 'New Article' : 'Edit Article'} />
        <div style={content}>
          <ArticleEditor
            article={selectedArticle}
            onSaved={handleArticleSaved}
            onCancel={() => { setView('dashboard'); setSelectedArticle(null) }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      {/* Test Email Modal */}
      {testEmailModal && (
        <div style={modalOverlay}>
          <div style={modal}>
            <h2 style={modalTitle}>📬 Send Test Email</h2>
            <p style={modalText}>
              Send a test copy of <strong style={{ color: '#39ff14' }}>{testEmailModal.subject}</strong> to yourself before blasting everyone.
            </p>
            <input
              type="email"
              value={testEmailAddress}
              onChange={e => setTestEmailAddress(e.target.value)}
              placeholder="your@email.com"
              style={{ ...testEmailInput }}
              onKeyDown={e => e.key === 'Enter' && handleSendTest()}
              autoFocus
            />
            <div style={modalActions}>
              <button onClick={() => { setTestEmailModal(null); setTestEmailAddress('') }} style={modalCancelBtn}>Cancel</button>
              <button onClick={handleSendTest} disabled={sendingTest} style={modalSendBtn}>
                {sendingTest ? 'Sending...' : '📤 Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {sendModal && (
        <div style={modalOverlay}>
          <div style={modal}>
            <h2 style={modalTitle}>📬 Send This Issue?</h2>
            <p style={modalText}>
              You're about to send <strong style={{ color: '#39ff14' }}>{sendModal.subject}</strong> to{' '}
              <strong style={{ color: '#39ff14' }}>{activeSubCount} active subscribers</strong>.
            </p>
            <p style={modalWarning}>This cannot be undone. They will all receive this email.</p>
            <div style={modalActions}>
              <button onClick={() => setSendModal(null)} style={modalCancelBtn}>Cancel</button>
              <button onClick={() => handleSend(sendModal)} style={modalSendBtn}>🔥 Send It</button>
            </div>
          </div>
        </div>
      )}

      <div style={header}>
        <div>
          <div style={headerBrand}>🔥 THE DAILY ROT</div>
          <h1 style={headerTitle}>ADMIN DASHBOARD</h1>
        </div>
        <div style={headerActions}>
          <a href="/" style={viewSiteLink}>← View Site</a>
          <button onClick={() => setView('new-issue')} style={newIssueBtn}>+ New Issue</button>
        </div>
      </div>

      <div style={content}>
        {/* Stats */}
        <section style={section}>
          <h2 style={sectionTitle}>📊 STATS</h2>
          <SubscriberStats />
        </section>

        {/* Tab switcher */}
        <div style={tabBar}>
          <button onClick={() => setAdminTab('issues')} style={adminTab === 'issues' ? activeTabBtn : tabBtn}>
            📋 Issues
          </button>
          <button onClick={() => setAdminTab('articles')} style={adminTab === 'articles' ? activeTabBtn : tabBtn}>
            📝 Articles {articles.length > 0 && `(${articles.length})`}
          </button>
          <button onClick={() => setAdminTab('research')} style={adminTab === 'research' ? activeTabBtn : tabBtn}>
            🔬 AI Writer
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleFetchMemes}
            disabled={fetchingMemes}
            style={fetchMemesBtn}
          >
            {fetchingMemes ? 'Fetching...' : '🐸 Fetch Memes'}
          </button>
        </div>

        {/* Issues tab */}
        {adminTab === 'issues' && (
          <section style={section}>
            <div style={issuesList}>
              {issues.map(issue => (
                <div key={issue.id} style={issueRow}>
                  <div style={issueInfo}>
                    <div style={issueNum}>#{issue.issueNumber}</div>
                    <div>
                      <div style={issueSubject}>{issue.subject}</div>
                      <div style={issueMeta}>
                        {new Date(issue.scheduledFor).toLocaleDateString()}
                        {issue.sentAt && ` · Sent to ${issue.recipientCount} subscribers`}
                      </div>
                    </div>
                  </div>
                  <div style={issueActions}>
                    <span style={statusBadge(issue.status)}>{issue.status}</span>
                    <button
                      onClick={() => { setSelectedIssue(issue); setView('preview-issue') }}
                      style={actionBtn}
                    >Preview</button>
                    {issue.status !== 'sent' && (
                      <button
                        onClick={() => { setSelectedIssue(issue); setView('edit-issue') }}
                        style={actionBtn}
                      >Edit</button>
                    )}
                    <button
                      onClick={() => handleGenerateArticles(issue)}
                      disabled={generatingId === issue.id}
                      style={generateBtn}
                    >
                      {generatingId === issue.id ? 'Generating...' : '✍️ Gen Articles'}
                    </button>
                    {issue.status !== 'sent' && (
                      <button
                        onClick={() => { setTestEmailModal(issue); setTestEmailAddress('') }}
                        style={testBtn}
                      >
                        📤 Test
                      </button>
                    )}
                    {issue.status !== 'sent' && (
                      <button
                        onClick={() => setSendModal(issue)}
                        disabled={sendingId === issue.id}
                        style={sendBtn}
                      >
                        {sendingId === issue.id ? 'Sending...' : '🚀 Send'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {issues.length === 0 && (
                <div style={emptyState}>No issues yet. Create your first one! 🔥</div>
              )}
            </div>
          </section>
        )}

        {/* Articles tab */}
        {adminTab === 'articles' && (
          <section style={section}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                onClick={() => { setSelectedArticle(null); setView('new-article') }}
                style={newIssueBtn}
              >
                + New Article
              </button>
            </div>
            <div style={issuesList}>
              {articles.map(article => (
                <div key={article.id} style={issueRow}>
                  <div style={issueInfo}>
                    <div>
                      <div style={issueSubject}>{article.title}</div>
                      <div style={issueMeta}>
                        {article.section} · {new Date(article.publishedAt).toLocaleDateString()} · {article.views.toLocaleString()} views
                      </div>
                    </div>
                  </div>
                  <div style={issueActions}>
                    <button
                      onClick={() => { setSelectedArticle(article); setView('edit-article') }}
                      style={actionBtn}
                    >
                      Edit
                    </button>
                    <a href={`/article/${article.slug}`} target="_blank" rel="noreferrer" style={actionBtn}>
                      View →
                    </a>
                  </div>
                </div>
              ))}
              {articles.length === 0 && (
                <div style={emptyState}>No articles yet. Click "+ New Article" or "Gen Articles" on any issue.</div>
              )}
            </div>
          </section>
        )}

        {/* AI Writer / Research tab */}
        {adminTab === 'research' && (
          <section style={section}>
            <CustomArticleWriter adminSecret={sessionStorage.getItem(ADMIN_KEY) || ''} />
          </section>
        )}
      </div>
    </div>
  )
}

function AdminNav({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={navBar}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <span style={navTitle}>{title}</span>
    </div>
  )
}

const statusBadge = (status: string): React.CSSProperties => ({
  backgroundColor: status === 'sent' ? '#39ff1422' : status === 'scheduled' ? '#ff9f0022' : '#ffffff11',
  border: `1px solid ${status === 'sent' ? '#39ff14' : status === 'scheduled' ? '#ff9f00' : '#444'}`,
  borderRadius: '4px',
  color: status === 'sent' ? '#39ff14' : status === 'scheduled' ? '#ff9f00' : '#888',
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '3px 7px',
  textTransform: 'uppercase' as const,
})

const page: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  color: '#fff',
  fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
  minHeight: '100vh',
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  padding: '32px 32px 24px',
  borderBottom: '1px solid #1a1a1a',
}

const headerBrand: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '3px',
  marginBottom: '4px',
}

const headerTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '32px',
  fontWeight: '900',
  margin: '0',
  letterSpacing: '-1px',
}

const headerActions: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
}

const viewSiteLink: React.CSSProperties = {
  color: '#555',
  fontSize: '13px',
  textDecoration: 'none',
}

const newIssueBtn: React.CSSProperties = {
  backgroundColor: '#39ff14',
  border: 'none',
  borderRadius: '6px',
  color: '#0a0a0a',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: '800',
  padding: '10px 20px',
}

const content: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '32px',
}

const section: React.CSSProperties = { marginBottom: '48px' }

const sectionTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '13px',
  fontWeight: '800',
  letterSpacing: '2px',
  margin: '0 0 20px',
}

const issuesList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }

const issueRow: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  gap: '16px',
  flexWrap: 'wrap',
}

const issueInfo: React.CSSProperties = { display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }

const issueNum: React.CSSProperties = {
  color: '#39ff14',
  fontWeight: '900',
  fontSize: '20px',
  minWidth: '40px',
}

const issueSubject: React.CSSProperties = { color: '#fff', fontWeight: '600', fontSize: '14px' }

const issueMeta: React.CSSProperties = { color: '#555', fontSize: '12px', marginTop: '2px' }

const issueActions: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }

const actionBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a2a',
  borderRadius: '5px',
  color: '#aaa',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '12px',
  padding: '6px 12px',
}

const sendBtn: React.CSSProperties = {
  backgroundColor: '#39ff1422',
  border: '1px solid #39ff14',
  borderRadius: '5px',
  color: '#39ff14',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '12px',
  fontWeight: '700',
  padding: '6px 12px',
}

const emptyState: React.CSSProperties = {
  color: '#444',
  textAlign: 'center',
  padding: '40px',
}

const navBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px 32px',
  borderBottom: '1px solid #1a1a1a',
}

const backBtn: React.CSSProperties = {
  ...actionBtn,
  fontSize: '13px',
}

const navTitle: React.CSSProperties = {
  color: '#fff',
  fontWeight: '700',
  fontSize: '16px',
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#000000cc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modal: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #333',
  borderRadius: '12px',
  maxWidth: '440px',
  padding: '32px',
  width: '90%',
}

const modalTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '22px',
  fontWeight: '900',
  margin: '0 0 16px',
}

const modalText: React.CSSProperties = { color: '#aaa', fontSize: '15px', lineHeight: '1.6', margin: '0 0 12px' }

const modalWarning: React.CSSProperties = {
  color: '#ff4444',
  fontSize: '13px',
  margin: '0 0 24px',
}

const modalActions: React.CSSProperties = { display: 'flex', gap: '12px', justifyContent: 'flex-end' }

const modalCancelBtn: React.CSSProperties = { ...actionBtn, padding: '10px 20px', fontSize: '14px' }

const modalSendBtn: React.CSSProperties = {
  backgroundColor: '#39ff14',
  border: 'none',
  borderRadius: '6px',
  color: '#0a0a0a',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: '800',
  padding: '10px 24px',
}

const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  marginBottom: '20px',
  flexWrap: 'wrap',
}

const tabBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  color: '#666',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: '600',
  padding: '8px 16px',
}

const activeTabBtn: React.CSSProperties = {
  ...tabBtn,
  backgroundColor: '#39ff1422',
  border: '1px solid #39ff14',
  color: '#39ff14',
}

const generateBtn: React.CSSProperties = {
  backgroundColor: '#ffffff11',
  border: '1px solid #3a3a3a',
  borderRadius: '5px',
  color: '#ccc',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '12px',
  padding: '6px 12px',
}

const fetchMemesBtn: React.CSSProperties = {
  backgroundColor: '#39ff1411',
  border: '1px solid #39ff1444',
  borderRadius: '6px',
  color: '#39ff14',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: '700',
  padding: '8px 16px',
}

const testBtn: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  border: '1px solid #39ff1455',
  borderRadius: '5px',
  color: '#39ff14',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '12px',
  fontWeight: '600',
  padding: '6px 12px',
}

const testEmailInput: React.CSSProperties = {
  backgroundColor: '#0d0d0d',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: '14px',
  padding: '10px 14px',
  width: '100%',
  boxSizing: 'border-box' as const,
  outline: 'none',
  marginBottom: '20px',
}
