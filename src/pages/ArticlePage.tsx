import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
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

interface ArticleWithRelated extends Article {
  related?: Article[]
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleWithRelated | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    axios.get(`/api/articles/${slug}`).then(r => {
      setArticle(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  // SEO meta tags
  useEffect(() => {
    if (!article) return
    const siteUrl = 'https://getdailyrot.com'
    const pageUrl = `${siteUrl}/articles/${article.slug}`
    const title = `${article.title} | The Daily Rot`
    const desc = article.excerpt || 'Daily brain rot, memes, and internet culture delivered to your inbox.'
    const img = `${siteUrl}/og-image.png`

    document.title = title

    function setMeta(nameOrProp: string, content: string, isProp = false) {
      const attr = isProp ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, nameOrProp)
        document.head.appendChild(el)
      }
      el.content = content
    }

    setMeta('description', desc)
    setMeta('og:title', title, true)
    setMeta('og:description', desc, true)
    setMeta('og:url', pageUrl, true)
    setMeta('og:image', img, true)
    setMeta('og:type', 'article', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', img)

    // JSON-LD structured data
    const ldId = 'article-jsonld'
    let ldScript = document.getElementById(ldId)
    if (!ldScript) {
      ldScript = document.createElement('script')
      ldScript.id = ldId
      ldScript.setAttribute('type', 'application/ld+json')
      document.head.appendChild(ldScript)
    }
    ldScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: desc,
      url: pageUrl,
      image: img,
      publisher: {
        '@type': 'Organization',
        name: 'The Daily Rot',
        url: siteUrl,
        logo: { '@type': 'ImageObject', url: `${siteUrl}/og-image.png` },
      },
      datePublished: article.createdAt,
    })

    return () => {
      document.title = 'The Daily Rot'
      const ld = document.getElementById(ldId)
      if (ld) ld.remove()
    }
  }, [article])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${article?.title} — via @DailyRot`)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  if (loading) {
    return (
      <div style={page}>
        <nav style={nav}>
          <Link to="/" style={navLogo}>THE DAILY ROT</Link>
        </nav>
        <div style={loadingState}>Loading the rot...</div>
      </div>
    )
  }

  if (!article) {
    return (
      <div style={page}>
        <nav style={nav}>
          <Link to="/" style={navLogo}>THE DAILY ROT</Link>
        </nav>
        <div style={loadingState}>Article not found. It's been cooked. 💀</div>
      </div>
    )
  }

  const sectionColor = SECTION_COLORS[article.section]

  return (
    <div style={page}>
      <nav style={nav}>
        <Link to="/" style={navLogo}>THE DAILY ROT</Link>
        <div style={navLinks}>
          <Link to="/articles" style={navLink}>← All Articles</Link>
        </div>
      </nav>

      <article style={articleWrapper}>
        {/* Header */}
        <header style={articleHeader}>
          <div style={{ ...sectionBadge, color: sectionColor, borderColor: sectionColor }}>
            {SECTION_LABELS[article.section]}
          </div>
          <h1 style={articleTitle}>{article.title}</h1>
          <div style={articleMeta}>
            <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>·</span>
            <span>{article.views.toLocaleString()} views</span>
          </div>
        </header>

        {/* Meme image */}
        {article.memeImageUrl && (
          <div style={memeContainer}>
            <img src={article.memeImageUrl} alt="Meme" style={memeImage} />
          </div>
        )}

        {/* Article body */}
        <div
          style={articleBody}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* AdSense placeholder */}
        {article.adSlot && (
          <div style={adPlaceholder}>
            {/* AdSense: ins class="adsbygoogle" data-ad-client="ca-pub-XXXXXXX" data-ad-slot="XXXXXXX" */}
            <div style={adInner}>📢 Advertisement</div>
          </div>
        )}

        {/* Subscribe CTA */}
        <div style={subscribeCta}>
          <div style={ctaEmoji}>🔥</div>
          <h3 style={ctaTitle}>Get This In Your Inbox Daily</h3>
          <p style={ctaText}>Brain rot, memes, and unhinged takes delivered every day. Free forever. Your last remaining brain cell will love it.</p>
          <Link to="/" style={ctaButton}>Subscribe Free →</Link>
        </div>

        {/* Share buttons */}
        <div style={shareSection}>
          <span style={shareLabel}>Share this rot:</span>
          <button onClick={handleCopyLink} style={shareBtn}>
            {copied ? '✅ Copied!' : '🔗 Copy Link'}
          </button>
          <button onClick={handleTwitterShare} style={shareBtn}>
            🐦 Tweet This
          </button>
        </div>

        {/* Related articles */}
        {article.related && article.related.length > 0 && (
          <section style={relatedSection}>
            <h2 style={relatedTitle}>More Rot 🔥</h2>
            <div style={relatedGrid}>
              {article.related.map(rel => (
                <Link key={rel.id} to={`/article/${rel.slug}`} style={relatedCardLink}>
                  <div style={relatedCard}>
                    {rel.memeImageUrl && (
                      <img src={rel.memeImageUrl} alt="" style={relatedImg} />
                    )}
                    <div style={relatedBody}>
                      <div style={{ ...sectionBadge, color: SECTION_COLORS[rel.section], borderColor: SECTION_COLORS[rel.section], fontSize: '9px' }}>
                        {SECTION_LABELS[rel.section]}
                      </div>
                      <p style={relatedCardTitle}>{rel.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
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

const navLinks: React.CSSProperties = { display: 'flex', gap: '16px' }

const navLink: React.CSSProperties = {
  color: '#555',
  fontSize: '13px',
  textDecoration: 'none',
}

const articleWrapper: React.CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: '48px 32px 80px',
}

const articleHeader: React.CSSProperties = {
  marginBottom: '32px',
}

const sectionBadge: React.CSSProperties = {
  border: '1px solid',
  borderRadius: '4px',
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '1px',
  marginBottom: '16px',
  padding: '3px 8px',
  textTransform: 'uppercase',
}

const articleTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '36px',
  fontWeight: '900',
  letterSpacing: '-1px',
  lineHeight: '1.2',
  margin: '0 0 16px',
}

const articleMeta: React.CSSProperties = {
  color: '#444',
  display: 'flex',
  fontSize: '13px',
  gap: '8px',
}

const memeContainer: React.CSSProperties = {
  borderRadius: '12px',
  marginBottom: '32px',
  overflow: 'hidden',
}

const memeImage: React.CSSProperties = {
  width: '100%',
  display: 'block',
}

const articleBody: React.CSSProperties = {
  color: '#bbb',
  fontSize: '17px',
  lineHeight: '1.8',
  marginBottom: '40px',
}

const adPlaceholder: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px dashed #2a2a2a',
  borderRadius: '8px',
  marginBottom: '40px',
  padding: '24px',
  textAlign: 'center',
}

const adInner: React.CSSProperties = {
  color: '#333',
  fontSize: '12px',
  letterSpacing: '2px',
}

const subscribeCta: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #39ff1433',
  borderRadius: '12px',
  marginBottom: '40px',
  padding: '32px',
  textAlign: 'center',
}

const ctaEmoji: React.CSSProperties = {
  fontSize: '40px',
  marginBottom: '12px',
}

const ctaTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '22px',
  fontWeight: '900',
  margin: '0 0 10px',
}

const ctaText: React.CSSProperties = {
  color: '#666',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#39ff14',
  borderRadius: '8px',
  color: '#0a0a0a',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '800',
  padding: '12px 24px',
  textDecoration: 'none',
}

const shareSection: React.CSSProperties = {
  borderTop: '1px solid #1a1a1a',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '48px',
  paddingTop: '24px',
  flexWrap: 'wrap',
}

const shareLabel: React.CSSProperties = {
  color: '#444',
  fontSize: '13px',
}

const shareBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  color: '#888',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: '600',
  padding: '8px 16px',
}

const relatedSection: React.CSSProperties = {
  borderTop: '1px solid #1a1a1a',
  paddingTop: '40px',
}

const relatedTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '13px',
  fontWeight: '800',
  letterSpacing: '2px',
  margin: '0 0 20px',
  textTransform: 'uppercase',
}

const relatedGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '16px',
}

const relatedCardLink: React.CSSProperties = { textDecoration: 'none' }

const relatedCard: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '8px',
  overflow: 'hidden',
}

const relatedImg: React.CSSProperties = {
  width: '100%',
  height: '120px',
  objectFit: 'cover',
  display: 'block',
}

const relatedBody: React.CSSProperties = {
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const relatedCardTitle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '13px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0',
}

const loadingState: React.CSSProperties = {
  color: '#444',
  textAlign: 'center',
  padding: '80px 20px',
  fontSize: '16px',
}

export default ArticlePage
