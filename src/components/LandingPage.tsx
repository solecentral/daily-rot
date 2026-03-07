import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { SignupForm } from './SignupForm'
import { IssuePreview } from './IssuePreview'
import { Issue, Article } from '../types'

const SECTION_COLORS: Record<Article['section'], string> = {
  rotReport: '#ff6b35',
  seriousNews: '#4fc3f7',
  whoGotCooked: '#ef5350',
  unhingedFact: '#39ff14',
}

const SECTION_LABELS: Record<Article['section'], string> = {
  rotReport: '🔥 Rot Report',
  seriousNews: '📰 Serious News',
  whoGotCooked: '💀 Who Got Cooked',
  unhingedFact: '🎲 Unhinged Fact',
}

export function LandingPage() {
  const [latestIssue, setLatestIssue] = useState<Issue | null>(null)
  const [subscriberCount, setSubscriberCount] = useState<number>(1337)
  const [latestArticles, setLatestArticles] = useState<Article[]>([])

  useEffect(() => {
    axios.get('/api/articles').then(r => {
      setLatestArticles(r.data.slice(0, 3))
    }).catch(() => {})

    axios.get('/api/issues').then(res => {
      const issues: Issue[] = res.data
      const sent = issues.filter(i => i.status === 'sent')
      if (sent.length > 0) setLatestIssue(sent[0])
      else if (issues.length > 0) setLatestIssue(issues[0])
    }).catch(() => {})

    axios.get('/api/stats').then(res => {
      setSubscriberCount(res.data.activeSubscribers || 1337)
    }).catch(() => {})
  }, [])

  const sections = [
    { emoji: '🔥', title: 'The Rot Report', desc: 'Top 3 brain rot moments from the internet. Curated with zero journalistic integrity.' },
    { emoji: '🐸', title: 'Meme of the Day', desc: 'One certified banger. No context. Just vibes.' },
    { emoji: '📰', title: 'Serious News But Make It Stupid', desc: 'Real headlines. Absolutely unhinged takes. You\'re welcome.' },
    { emoji: '💀', title: 'Who Got Cooked Today', desc: 'Someone on the internet had a bad day. We document it for posterity.' },
    { emoji: '🎲', title: 'Random Unhinged Fact', desc: 'The kind of fact you immediately send to your group chat at 2am.' },
  ]

  return (
    <div style={page}>
      {/* NAV */}
      <nav style={nav}>
        <div style={navLogo}>THE DAILY ROT</div>
        <a href="/admin" style={adminLink}>Admin →</a>
      </nav>

      {/* HERO */}
      <section style={hero}>
        <div style={heroInner}>
          <div style={eyebrow}>🔥 FREE · DAILY · EXTREMELY ONLINE</div>
          <h1 style={heroTitle}>THE<br />DAILY ROT</h1>
          <p style={heroTagline}>daily brain rot, delivered to your inbox.</p>
          <p style={heroCopy}>
            for the terminally online. looksmaxxing discourse, who got cooked today,
            unhinged facts, and whatever the internet is absolutely losing its mind over —
            every day. free forever. no cap.
          </p>
          <div style={signupWrapper}>
            <SignupForm subscriberCount={subscriberCount} size="large" />
          </div>
          <p style={socialProofText}>
            🧠 {subscriberCount.toLocaleString()}+ rot enjoyers and counting
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={howItWorks}>
        <h2 style={sectionTitle}>HOW IT WORKS</h2>
        <div style={stepsRow}>
          <div style={step}>
            <div style={stepNum}>01</div>
            <div style={stepTitle}>subscribe free</div>
            <div style={stepDesc}>enter your email above. takes 4 seconds. your brain will never be the same.</div>
          </div>
          <div style={stepArrow}>→</div>
          <div style={step}>
            <div style={stepNum}>02</div>
            <div style={stepTitle}>get daily rot</div>
            <div style={stepDesc}>every morning, the freshest internet chaos lands in your inbox. lore included.</div>
          </div>
          <div style={stepArrow}>→</div>
          <div style={step}>
            <div style={stepNum}>03</div>
            <div style={stepTitle}>become ungovernable</div>
            <div style={stepDesc}>you now understand the discourse. you are cooked. you are one of us. fr fr.</div>
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section style={whatsInside}>
        <h2 style={sectionTitle}>WHAT'S INSIDE</h2>
        <p style={sectionSubtitle}>Five sections of pure, unadulterated internet chaos — delivered daily.</p>
        <div style={cardsGrid}>
          {sections.map((s, i) => (
            <div key={i} style={featureCard}>
              <div style={featureEmoji}>{s.emoji}</div>
              <h3 style={featureTitle}>{s.title}</h3>
              <p style={featureDesc}>{s.desc}</p>
              {latestIssue && renderPreviewSnippet(s.emoji, latestIssue)}
            </div>
          ))}
        </div>
      </section>

      {/* SAMPLE ISSUE */}
      {latestIssue && (
        <section style={sampleSection}>
          <h2 style={sectionTitle}>SAMPLE ISSUE</h2>
          <p style={sectionSubtitle}>Don't just take our word for it. Here's what you're signing up for.</p>
          <div style={previewWrapper}>
            <IssuePreview issue={latestIssue} />
          </div>
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <SignupForm subscriberCount={subscriberCount} size="large" />
          </div>
        </section>
      )}

      {/* LATEST ARTICLES */}
      {latestArticles.length > 0 && (
        <section style={articlesSection}>
          <h2 style={sectionTitle}>LATEST ARTICLES</h2>
          <p style={sectionSubtitle}>Fresh rot from the archive. Read more. Learn less.</p>
          <div style={articlesGrid}>
            {latestArticles.map(article => (
              <Link key={article.id} to={`/article/${article.slug}`} style={articleCardLink}>
                <div style={articleCard}>
                  {article.memeImageUrl && (
                    <img src={article.memeImageUrl} alt="" style={articleCardImg} />
                  )}
                  <div style={articleCardBody}>
                    <div style={{ ...articleBadge, color: SECTION_COLORS[article.section], borderColor: SECTION_COLORS[article.section] }}>
                      {SECTION_LABELS[article.section]}
                    </div>
                    <h3 style={articleCardTitle}>{article.title}</h3>
                    <p style={articleCardExcerpt}>{article.excerpt}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/articles" style={viewAllBtn}>View All Articles →</Link>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={footer}>
        <div style={footerLogo}>THE DAILY ROT</div>
        <p style={footerTagline}>Made with 🧠 and absolutely zero brain cells</p>
        <p style={footerLinks}>
          <a href="https://instagram.com/getdailyrot" target="_blank" rel="noopener noreferrer" style={footerLink}>Instagram</a>
          {' · '}
          <Link to="/articles" style={footerLink}>Articles</Link>
          {' · '}
          <a href="/unsubscribe" style={footerLink}>Unsubscribe</a>
          {' · '}
          <a href="/admin" style={footerLink}>Admin</a>
        </p>
        <p style={footerCopy}>© The Daily Rot. All rights reserved, none of them meaningful.</p>
      </footer>
    </div>
  )
}

function renderPreviewSnippet(emoji: string, issue: Issue) {
  const style: React.CSSProperties = {
    color: '#39ff14',
    fontSize: '12px',
    fontStyle: 'italic',
    marginTop: '8px',
    borderTop: '1px solid #222',
    paddingTop: '8px',
    lineHeight: '1.4',
  }

  if (emoji === '🔥' && issue.content.rotReport[0]) {
    return <p style={style}>"{issue.content.rotReport[0].title}"</p>
  }
  if (emoji === '🐸') {
    return <p style={style}>"{issue.content.memeOfTheDay.description.slice(0, 80)}..."</p>
  }
  if (emoji === '📰') {
    return <p style={style}>"{issue.content.seriousNewsStupid.headline}"</p>
  }
  if (emoji === '💀') {
    return <p style={style}>Today: {issue.content.whoGotCooked.who}</p>
  }
  if (emoji === '🎲') {
    return <p style={style}>"{issue.content.unhingedFact.slice(0, 80)}..."</p>
  }
  return null
}

// Styles
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
  padding: '16px 32px',
  borderBottom: '1px solid #1a1a1a',
  position: 'sticky',
  top: 0,
  backgroundColor: '#0a0a0acc',
  backdropFilter: 'blur(10px)',
  zIndex: 100,
}

const navLogo: React.CSSProperties = {
  color: '#39ff14',
  fontWeight: '900',
  fontSize: '18px',
  letterSpacing: '-0.5px',
}

const adminLink: React.CSSProperties = {
  color: '#555',
  fontSize: '13px',
  textDecoration: 'none',
}

const hero: React.CSSProperties = {
  padding: '80px 20px 100px',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
}

const heroInner: React.CSSProperties = {
  maxWidth: '700px',
  margin: '0 auto',
}

const eyebrow: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  marginBottom: '24px',
  opacity: 0.8,
}

const heroTitle: React.CSSProperties = {
  fontSize: 'clamp(72px, 15vw, 140px)',
  fontWeight: '900',
  lineHeight: '0.9',
  letterSpacing: '-4px',
  margin: '0 0 32px',
  color: '#fff',
  textShadow: '0 0 80px #39ff1430',
  fontFamily: '"Black Ops One", sans-serif',
}

const heroTagline: React.CSSProperties = {
  color: '#39ff14',
  fontSize: 'clamp(18px, 3vw, 26px)',
  fontWeight: '700',
  margin: '0 0 16px',
}

const heroCopy: React.CSSProperties = {
  color: '#888',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 40px',
}

const signupWrapper: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
}

const socialProofText: React.CSSProperties = {
  color: '#555',
  fontSize: '13px',
  marginTop: '16px',
  letterSpacing: '0.5px',
}

const howItWorks: React.CSSProperties = {
  padding: '60px 20px 80px',
  maxWidth: '900px',
  margin: '0 auto',
  textAlign: 'center',
}

const stepsRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  marginTop: '40px',
}

const step: React.CSSProperties = {
  flex: '1',
  minWidth: '200px',
  maxWidth: '240px',
  background: '#111',
  border: '1px solid #1f1f1f',
  borderRadius: '10px',
  padding: '24px 20px',
  textAlign: 'center',
}

const stepNum: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '32px',
  fontWeight: '900',
  fontFamily: 'monospace',
  marginBottom: '12px',
  opacity: 0.7,
}

const stepTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '16px',
  fontWeight: '700',
  marginBottom: '10px',
  textTransform: 'lowercase',
}

const stepDesc: React.CSSProperties = {
  color: '#666',
  fontSize: '13px',
  lineHeight: '1.6',
}

const stepArrow: React.CSSProperties = {
  color: '#333',
  fontSize: '28px',
  fontWeight: '300',
  flexShrink: 0,
}

const whatsInside: React.CSSProperties = {
  padding: '80px 20px',
  maxWidth: '1100px',
  margin: '0 auto',
  textAlign: 'center',
}

const sectionTitle: React.CSSProperties = {
  color: '#39ff14',
  fontSize: 'clamp(28px, 5vw, 48px)',
  fontWeight: '900',
  letterSpacing: '-2px',
  margin: '0 0 8px',
  fontFamily: '"Black Ops One", sans-serif',
}

const sectionSubtitle: React.CSSProperties = {
  color: '#555',
  fontSize: '16px',
  margin: '0 0 48px',
}

const cardsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
}

const featureCard: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'left',
  transition: 'border-color 0.2s',
}

const featureEmoji: React.CSSProperties = {
  fontSize: '32px',
  marginBottom: '12px',
}

const featureTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 8px',
}

const featureDesc: React.CSSProperties = {
  color: '#666',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}

const sampleSection: React.CSSProperties = {
  padding: '80px 20px',
  maxWidth: '800px',
  margin: '0 auto',
  textAlign: 'center',
}

const previewWrapper: React.CSSProperties = {
  textAlign: 'left',
  marginTop: '32px',
}

const footer: React.CSSProperties = {
  borderTop: '1px solid #1a1a1a',
  padding: '48px 20px',
  textAlign: 'center',
}

const footerLogo: React.CSSProperties = {
  color: '#39ff14',
  fontWeight: '900',
  fontSize: '24px',
  letterSpacing: '-1px',
  marginBottom: '8px',
  fontFamily: '"Black Ops One", sans-serif',
}

const footerTagline: React.CSSProperties = {
  color: '#444',
  fontSize: '14px',
  margin: '0 0 16px',
}

const footerLinks: React.CSSProperties = {
  margin: '0 0 12px',
}

const footerLink: React.CSSProperties = {
  color: '#555',
  fontSize: '13px',
  textDecoration: 'none',
}

const footerCopy: React.CSSProperties = {
  color: '#333',
  fontSize: '11px',
  margin: '0',
}

const articlesSection: React.CSSProperties = {
  padding: '80px 20px',
  maxWidth: '1100px',
  margin: '0 auto',
  textAlign: 'center',
}

const articlesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px',
  textAlign: 'left',
}

const articleCardLink: React.CSSProperties = { textDecoration: 'none' }

const articleCard: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '12px',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}

const articleCardImg: React.CSSProperties = {
  width: '100%',
  height: '180px',
  objectFit: 'cover',
  display: 'block',
}

const articleCardBody: React.CSSProperties = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  flex: 1,
}

const articleBadge: React.CSSProperties = {
  border: '1px solid',
  borderRadius: '4px',
  display: 'inline-block',
  fontSize: '9px',
  fontWeight: '800',
  letterSpacing: '1px',
  padding: '3px 8px',
  textTransform: 'uppercase',
  width: 'fit-content',
}

const articleCardTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '15px',
  fontWeight: '700',
  lineHeight: '1.4',
  margin: '0',
}

const articleCardExcerpt: React.CSSProperties = {
  color: '#555',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}

const viewAllBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #39ff14',
  borderRadius: '8px',
  color: '#39ff14',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '700',
  padding: '12px 24px',
  textDecoration: 'none',
}
