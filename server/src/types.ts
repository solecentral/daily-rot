export interface Subscriber {
  id: string
  email: string
  subscribedAt: string
  unsubscribeToken: string
  active: boolean
}

export interface IssueContent {
  rotReport: { title: string; description: string; articleSlug?: string }[]
  memeOfTheDay: { description: string; imageUrl: string | null }
  seriousNewsStupid: { headline: string; take: string; articleSlug?: string }
  whoGotCooked: { who: string; what: string; articleSlug?: string }
  unhingedFact: string
  unhingedFactSlug?: string
}

export interface Issue {
  id: string
  issueNumber: number
  subject: string
  scheduledFor: string
  sentAt: string | null
  status: 'draft' | 'scheduled' | 'sent'
  content: IssueContent
  recipientCount: number | null
}

export interface Article {
  id: string
  issueId: string
  section: 'rotReport' | 'seriousNews' | 'whoGotCooked' | 'unhingedFact'
  slug: string
  title: string
  content: string // full article HTML, 300-500 words, unhinged tone
  excerpt: string
  publishedAt: string
  views: number
  adSlot: boolean
  memeImageUrl?: string | null
}
