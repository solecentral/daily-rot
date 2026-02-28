import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Article } from '../types'

const SECTION_LABELS: Record<Article['section'], string> = {
  rotReport: '🔥 Rot Report',
  seriousNews: '📰 Serious News',
  whoGotCooked: '💀 Who Got Cooked',
  unhingedFact: '🎲 Unhinged Fact',
}

const SECTION_COLORS: Record<Article['section'], string> = {
  rotReport: '#ff6b35',
  seriousNews: '#4fc3f7',
  whoGotCooked: '#ef5350',
  unhingedFact: '#39ff14',
}

type FilterSection = 'all' | Article['section']

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filter, setFilter] = useState<FilterSection>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/articles').then(r => {
      setArticles(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? articles : articles.filter(a => a.section === filter)

  const filters: Array<{ key: FilterSection; label: string }> = [
    { key: 'all', label: 'All Rot' },
    { key: 'rotReport', label: '🔥 Rot Report' },
    { key: 'seriousNews', label: '📰 Serious News' },
    { key: 'whoGotCooked', label: '💀 Who Got Cooked' },
    { key: 'unhingedFact', label: '🎲 Unhinged Facts' },
  ]

  return (
    <div style={page}>
      <nav style={nav}>
        <Link to="/" style={navLogo}>THE DAILY ROT</Link>
        <Link to="/admin" style={adminLink}>Admin →</Link>
      </nav>

      <div style={heroSection}>
        <div style={eyebrow}>📚 THE ARCHIVE</div>
        <h1 style={pageTitle}>All Articles</h1>
        <p style={pageSubtitle}>Every piece of unhinged content we've ever published. You asked for this.</p>
      </div>

      {/* Filter tabs */}
      <div style={filterBar}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={filter === f.key ? activeTab : tab}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={contentArea}>
        {loading ? (
          <div style={emptyState}>Loading the rot...</div>
        ) : filtered.length === 0 ? (
          <div style={emptyState}>No articles in this section yet. Check back soon.</div>
        ) : (
          <div style={grid}>
            {filtered.map(article => (
              <Link key={article.id} to={`/article/${article.slug}`} style={cardLink}>
                <div style={card}>
                  {article.memeImageUrl && (
                    <img src={article.memeImageUrl} alt="" style={cardImg} />
                  )}
                  <div style={cardBody}>
                    <div style={{ ...sectionBadge, color: SECTION_COLORS[article.section], borderColor: SECTION_COLORS[article.section] }}>
                      {SECTION_LABELS[article.section]}
                    </div>
                    <h2 style={cardTitle}>{article.title}</h2>
                    <p style={cardExcerpt}>{article.excerpt}</p>
                    <div style={cardMeta}>
                      <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>{article.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  color: '#fff',
  fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
  minHeight: '100vh',
}

const nav: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 32px',
  borderBottom: '1px solid #1a1a1a',
}

const navLogo: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '18px',
  fontWeight: '900',
  letterSpacing: '-0.5px',
  textDecoration: 'none',
}

const adminLink: React.CSSProperties = {
  color: '#555',
  fontSize: '13px',
  textDecoration: 'none',
}

const heroSection: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 32px 40px',
  borderBottom: '1px solid #1a1a1a',
}

const eyebrow: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '3px',
  marginBottom: '12px',
}

const pageTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '48px',
  fontWeight: '900',
  margin: '0 0 12px',
  letterSpacing: '-2px',
}

const pageSubtitle: React.CSSProperties = {
  color: '#555',
  fontSize: '16px',
  margin: '0',
}

const filterBar: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  padding: '24px 32px',
  flexWrap: 'wrap',
  borderBottom: '1px solid #1a1a1a',
}

const tab: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a2a',
  borderRadius: '20px',
  color: '#666',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: '600',
  padding: '8px 16px',
}

const activeTab: React.CSSProperties = {
  ...tab,
  backgroundColor: '#39ff1422',
  border: '1px solid #39ff14',
  color: '#39ff14',
}

const contentArea: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '40px 32px',
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: '20px',
}

const cardLink: React.CSSProperties = { textDecoration: 'none' }

const card: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'border-color 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}

const cardImg: React.CSSProperties = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
}

const cardBody: React.CSSProperties = {
  padding: '20px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

const sectionBadge: React.CSSProperties = {
  border: '1px solid',
  borderRadius: '4px',
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '1px',
  padding: '3px 8px',
  textTransform: 'uppercase',
  width: 'fit-content',
}

const cardTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '17px',
  fontWeight: '700',
  lineHeight: '1.4',
  margin: '0',
}

const cardExcerpt: React.CSSProperties = {
  color: '#666',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
  flex: 1,
}

const cardMeta: React.CSSProperties = {
  color: '#444',
  display: 'flex',
  fontSize: '12px',
  gap: '12px',
  marginTop: 'auto',
}

const emptyState: React.CSSProperties = {
  color: '#444',
  textAlign: 'center',
  padding: '80px 20px',
  fontSize: '16px',
}

export default ArticlesPage
