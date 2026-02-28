import { Router, Request, Response } from 'express'
import https from 'https'

const router = Router()

interface RedditPost {
  data: {
    url: string
    title: string
    id: string
    over_18: boolean
    is_video: boolean
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
  }
}

function fetchReddit(url: string): Promise<RedditResponse> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'DailyRot/1.0',
        'Accept': 'application/json',
      },
    }
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error('Failed to parse Reddit response'))
        }
      })
    }).on('error', reject)
  })
}

// GET /api/memes/fetch
router.get('/memes/fetch', async (_req: Request, res: Response) => {
  try {
    const data = await fetchReddit('https://www.reddit.com/r/dankmemes/hot.json?limit=25')
    const posts = data?.data?.children || []

    const imagePosts = posts
      .filter((p: RedditPost) => {
        const url = p.data.url
        return !p.data.over_18 && !p.data.is_video && /\.(jpg|jpeg|png|gif)$/i.test(url)
      })
      .slice(0, 10)
      .map((p: RedditPost) => ({
        id: p.data.id,
        title: p.data.title,
        url: p.data.url,
      }))

    res.json({ memes: imagePosts, count: imagePosts.length })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memes from Reddit', details: String(err) })
  }
})

export default router
