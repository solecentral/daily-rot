import { Issue } from './types'

export async function renderIssueEmail(issue: Issue, unsubscribeUrl?: string): Promise<string> {
  const { render } = await import('@react-email/components')
  const React = await import('react')
  const { IssueEmail } = await import('../templates/IssueEmail')

  const element = React.default.createElement(IssueEmail, { issue, unsubscribeUrl })
  return render(element)
}
