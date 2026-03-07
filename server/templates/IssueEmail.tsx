import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { Issue } from '../src/types'

interface IssueEmailProps {
  issue: Issue
  unsubscribeUrl?: string
}

export function IssueEmail({ issue, unsubscribeUrl = '#' }: IssueEmailProps) {
  const { content, issueNumber, subject } = issue
  const siteUrl = process.env.SITE_URL || 'http://localhost:5176'

  return (
    <Html>
      <Head />
      <Preview>{subject} — Your daily dose of brain rot 🔥</Preview>
      <Body style={main}>
        {/* Header */}
        <Section style={header}>
          <Heading style={logo}>THE DAILY ROT</Heading>
          <Text style={issueTag}>ISSUE #{issueNumber}</Text>
          <Text style={tagline}>Your daily dose of brain rot, delivered.</Text>
        </Section>

        <Container style={container}>

          {/* Rot Report */}
          <Section style={card}>
            <Text style={cardHeader}>🔥 THE ROT REPORT</Text>
            <Text style={cardSubtitle}>Top 3 brain rot moments from the internet</Text>
            <Hr style={divider} />
            {content.rotReport.map((item, i) => (
              <Section key={i} style={rotItem}>
                <Text style={rotTitle}>{i + 1}. {item.title}</Text>
                <Text style={rotDesc}>{item.description}</Text>
                {item.articleSlug && (
                  <Link href={`${siteUrl}/article/${item.articleSlug}`} style={readMoreLink}>
                    Read more →
                  </Link>
                )}
              </Section>
            ))}
          </Section>

          {/* Meme of the Day */}
          <Section style={card}>
            <Text style={cardHeader}>🐸 MEME OF THE DAY</Text>
            <Text style={cardSubtitle}>One certified banger</Text>
            <Hr style={divider} />
            {content.memeOfTheDay.imageUrl && (
              <Img
                src={content.memeOfTheDay.imageUrl}
                alt="Meme of the Day"
                style={memeImg}
              />
            )}
            {!content.memeOfTheDay.imageUrl && (
              <Text style={memeDesc}>{content.memeOfTheDay.description}</Text>
            )}
          </Section>

          {/* Serious News But Make It Stupid */}
          <Section style={card}>
            <Text style={cardHeader}>📰 SERIOUS NEWS BUT MAKE IT STUPID</Text>
            <Hr style={divider} />
            <Text style={newsHeadline}>📌 {content.seriousNewsStupid.headline}</Text>
            <Text style={newsTake}>Our take: {content.seriousNewsStupid.take}</Text>
            {content.seriousNewsStupid.articleSlug && (
              <Link href={`${siteUrl}/article/${content.seriousNewsStupid.articleSlug}`} style={readMoreLink}>
                Read more →
              </Link>
            )}
          </Section>

          {/* Who Got Cooked */}
          <Section style={card}>
            <Text style={cardHeader}>💀 WHO GOT COOKED TODAY</Text>
            <Hr style={divider} />
            <Text style={cookedWho}>🎯 {content.whoGotCooked.who}</Text>
            <Text style={cookedWhat}>{content.whoGotCooked.what}</Text>
            {content.whoGotCooked.articleSlug && (
              <Link href={`${siteUrl}/article/${content.whoGotCooked.articleSlug}`} style={readMoreLink}>
                Read more →
              </Link>
            )}
          </Section>

          {/* Unhinged Fact */}
          <Section style={{ ...card, borderColor: '#39ff14', borderWidth: '2px' }}>
            <Text style={cardHeader}>🎲 RANDOM UNHINGED FACT</Text>
            <Hr style={divider} />
            <Text style={factText}>{content.unhingedFact}</Text>
            {content.unhingedFactSlug && (
              <Link href={`${siteUrl}/article/${content.unhingedFactSlug}`} style={readMoreLink}>
                Read more →
              </Link>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={{ ...divider, marginBottom: '20px' }} />
            <Text style={footerText}>
              Made with 🧠 and absolutely zero brain cells
            </Text>
            <Text style={footerText}>
              You signed up for this. We're not sorry.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://instagram.com/getdailyrot" style={unsubLink}>
                Follow on Instagram
              </Link>
              {' · '}
              <Link href="https://getdailyrot.com" style={unsubLink}>
                Website
              </Link>
              {' · '}
              <Link href={unsubscribeUrl} style={unsubLink}>
                Unsubscribe (coward)
              </Link>
            </Text>
            <Text style={footerSmall}>
              © The Daily Rot. All rights reserved, none of them meaningful.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
  margin: '0',
  padding: '0',
}

const header: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  textAlign: 'center',
  padding: '40px 20px 20px',
  borderBottom: '2px solid #39ff14',
}

const logo: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '48px',
  fontWeight: '900',
  letterSpacing: '-2px',
  margin: '0',
  textTransform: 'uppercase',
  textShadow: '0 0 30px #39ff1480',
}

const issueTag: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '4px',
  margin: '8px 0',
  opacity: 0.8,
}

const tagline: React.CSSProperties = {
  color: '#888',
  fontSize: '14px',
  margin: '0 0 16px',
  fontStyle: 'italic',
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
}

const card: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '16px',
}

const cardHeader: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '14px',
  fontWeight: '800',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  margin: '0 0 4px',
}

const cardSubtitle: React.CSSProperties = {
  color: '#555',
  fontSize: '12px',
  margin: '0',
}

const divider: React.CSSProperties = {
  borderColor: '#222',
  margin: '16px 0',
}

const rotItem: React.CSSProperties = {
  marginBottom: '16px',
}

const rotTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 6px',
}

const rotDesc: React.CSSProperties = {
  color: '#aaa',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const memeImg: React.CSSProperties = {
  width: '100%',
  borderRadius: '6px',
  marginBottom: '12px',
}

const memeDesc: React.CSSProperties = {
  color: '#ccc',
  fontSize: '14px',
  lineHeight: '1.6',
  fontStyle: 'italic',
  margin: '0',
  textAlign: 'center',
}

const newsHeadline: React.CSSProperties = {
  color: '#fff',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 12px',
}

const newsTake: React.CSSProperties = {
  color: '#aaa',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  borderLeft: '3px solid #39ff14',
  paddingLeft: '12px',
}

const cookedWho: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '18px',
  fontWeight: '800',
  margin: '0 0 10px',
}

const cookedWhat: React.CSSProperties = {
  color: '#aaa',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const factText: React.CSSProperties = {
  color: '#fff',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0',
  fontStyle: 'italic',
}

const footer: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 0 40px',
}

const footerText: React.CSSProperties = {
  color: '#444',
  fontSize: '12px',
  margin: '4px 0',
}

const footerLinks: React.CSSProperties = {
  margin: '16px 0 8px',
}

const unsubLink: React.CSSProperties = {
  color: '#555',
  fontSize: '12px',
  textDecoration: 'underline',
}

const footerSmall: React.CSSProperties = {
  color: '#333',
  fontSize: '10px',
  margin: '0',
}

const readMoreLink: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '13px',
  fontWeight: '700',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: '8px',
}

export default IssueEmail
