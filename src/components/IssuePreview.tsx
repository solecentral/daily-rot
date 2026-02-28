import React from 'react'
import { Issue } from '../types'

interface IssuePreviewProps {
  issue: Issue
  compact?: boolean
}

export function IssuePreview({ issue, compact = false }: IssuePreviewProps) {
  const { content, issueNumber, subject } = issue

  return (
    <div style={container}>
      <div style={header}>
        <div style={headerLeft}>
          <span style={issueNum}>ISSUE #{issueNumber}</span>
          <h2 style={issueSubject}>{subject}</h2>
        </div>
        <span style={statusBadge(issue.status)}>{issue.status.toUpperCase()}</span>
      </div>

      {/* Rot Report */}
      <div style={section}>
        <div style={sectionHeader}>🔥 THE ROT REPORT</div>
        {content.rotReport.slice(0, compact ? 1 : 3).map((item, i) => (
          <div key={i} style={rotItem}>
            <span style={rotNum}>{i + 1}</span>
            <div>
              <div style={rotTitle}>{item.title}</div>
              {!compact && <div style={rotDesc}>{item.description}</div>}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <>
          {/* Meme */}
          <div style={section}>
            <div style={sectionHeader}>🐸 MEME OF THE DAY</div>
            <p style={bodyText}>{content.memeOfTheDay.description}</p>
          </div>

          {/* News */}
          <div style={section}>
            <div style={sectionHeader}>📰 SERIOUS NEWS BUT MAKE IT STUPID</div>
            <div style={headline}>📌 {content.seriousNewsStupid.headline}</div>
            <p style={takePara}>{content.seriousNewsStupid.take}</p>
          </div>

          {/* Cooked */}
          <div style={section}>
            <div style={sectionHeader}>💀 WHO GOT COOKED TODAY</div>
            <div style={cookedWho}>🎯 {content.whoGotCooked.who}</div>
            <p style={bodyText}>{content.whoGotCooked.what}</p>
          </div>

          {/* Fact */}
          <div style={{ ...section, borderLeft: '3px solid #39ff14', paddingLeft: '16px' }}>
            <div style={sectionHeader}>🎲 RANDOM UNHINGED FACT</div>
            <p style={{ ...bodyText, fontStyle: 'italic' }}>{content.unhingedFact}</p>
          </div>
        </>
      )}
    </div>
  )
}

const statusBadge = (status: string): React.CSSProperties => ({
  backgroundColor: status === 'sent' ? '#39ff1422' : status === 'scheduled' ? '#ff9f0022' : '#ffffff11',
  border: `1px solid ${status === 'sent' ? '#39ff14' : status === 'scheduled' ? '#ff9f00' : '#444'}`,
  borderRadius: '4px',
  color: status === 'sent' ? '#39ff14' : status === 'scheduled' ? '#ff9f00' : '#888',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '4px 8px',
  alignSelf: 'flex-start',
  whiteSpace: 'nowrap',
})

const container: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '12px',
  padding: '24px',
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #222',
}

const headerLeft: React.CSSProperties = { flex: 1 }

const issueNum: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
}

const issueSubject: React.CSSProperties = {
  color: '#fff',
  fontSize: '18px',
  fontWeight: '700',
  margin: '4px 0 0',
}

const section: React.CSSProperties = {
  marginBottom: '20px',
}

const sectionHeader: React.CSSProperties = {
  color: '#39ff14',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '2px',
  marginBottom: '12px',
  textTransform: 'uppercase',
}

const rotItem: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '10px',
  alignItems: 'flex-start',
}

const rotNum: React.CSSProperties = {
  color: '#39ff14',
  fontWeight: '900',
  fontSize: '18px',
  lineHeight: '1',
  minWidth: '20px',
}

const rotTitle: React.CSSProperties = {
  color: '#fff',
  fontWeight: '600',
  fontSize: '14px',
}

const rotDesc: React.CSSProperties = {
  color: '#888',
  fontSize: '13px',
  lineHeight: '1.5',
  marginTop: '4px',
}

const bodyText: React.CSSProperties = {
  color: '#aaa',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const headline: React.CSSProperties = {
  color: '#fff',
  fontWeight: '700',
  fontSize: '15px',
  marginBottom: '8px',
}

const takePara: React.CSSProperties = {
  color: '#aaa',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  borderLeft: '3px solid #39ff14',
  paddingLeft: '12px',
}

const cookedWho: React.CSSProperties = {
  color: '#39ff14',
  fontWeight: '800',
  fontSize: '16px',
  marginBottom: '8px',
}
