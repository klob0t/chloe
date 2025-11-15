import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface SearchResult {
  title: string
  url: string
  content: string
  engine: string
  score: number
  category: string
}

interface SearchResponse {
  query: string
  number_of_results: number
  results: SearchResult[]
  answers: string[]
  corrections: string[]
  infoboxes: unknown[]
  suggestions: string[]
  unresponsive_engines: string[]
}

// URL Rotator class - combines TheSearXNG approach with sequential rotation
class UrlRotator {
  private urls: string[]
  private currentIndex: number

  constructor(urls: string[]) {
    this.urls = urls;
    this.currentIndex = Math.floor(Math.random() * urls.length); // Start at random position
  }

  getNextUrl() {
    const url = this.urls[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.urls.length;
    return url;
  }

  reset() {
    this.currentIndex = Math.floor(Math.random() * this.urls.length);
  }
}

// Working SearXNG instances - multiple instances for reliability
const searxngUrls = [
  "https://searx.tiekoetter.com",
  "https://searx.be",
  "https://priv.au",
  "https://seek.fyi",
  "https://searx.rhscz.eu"
];

const SEARXNG_BASE_URL = new UrlRotator(searxngUrls);

// Your robust MCP-style search with Cheerio parsing
async function performSearXNGSearch(query: string): Promise<SearchResult[]> {
  const searxngInstanceBaseUrl = SEARXNG_BASE_URL.getNextUrl()
  console.log(`Searching on ${searxngInstanceBaseUrl} (simple theme) for: "${query}"`)

  const params = new URLSearchParams({
    q: query,
    category_general: '1',
    language: 'auto',
    time_range: '',
    safesearch: '0',
    theme: 'simple'
  })

  const searchUrl = `${searxngInstanceBaseUrl}/search?${params.toString()}`
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`SearXNG request failed: ${response.status} ${response.statusText}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const results: SearchResult[] = []

    // Try multiple selectors (your previous logic)
    const selectors = [
      'article.result',
      '.result',
      '.result-v2',
      '[data-v2]'
    ]

    let foundItems = null

    for (const selector of selectors) {
      foundItems = $(selector)
      if (foundItems.length > 0) {
        console.log(`Found ${foundItems.length} items with selector '${selector}'`)
        break
      }
    }

    if (foundItems && foundItems.length > 0) {
      foundItems.each((i, elem) => {
        const titleElem = $(elem).find('h3 > a').first()
        const title = titleElem.text().trim()
        let link = titleElem.attr('href')

        const snippetElem = $(elem).find('p.content, .content, .snippet, .description').first()
        const snippet = snippetElem.text().trim()

        if (title && link) {
          // Fix relative URLs
          if (link.startsWith('/')) {
            const instanceOrigin = new URL(searxngInstanceBaseUrl).origin
            link = `${instanceOrigin}${link}`
          }

          // Decode redirect URLs
          if (link.includes('/redirect/?') || link.includes('/l/?')) {
            const urlParams = new URL(link, searxngInstanceBaseUrl).searchParams
            const encodedUrl = urlParams.get('url') || urlParams.get('uddg')
            if (encodedUrl) {
              try {
                link = decodeURIComponent(encodedUrl)
              } catch (error) {
                console.warn('Failed to decode redirect URL:', link, error)
              }
            }
          }

          results.push({
            title,
            url: link,
            content: snippet || `Search result ${i + 1}`,
            engine: 'searxng',
            score: 0.9 - (i * 0.05),
            category: 'general'
          })
        }
      })
    }

    if (results.length === 0) {
      console.log("No structured results found, trying fallback parsing")
      // Fallback: look for any links with titles
      $('a[href]').each((i, elem) => {
        const $elem = $(elem)
        const title = $elem.text().trim()
        const link = $elem.attr('href')

        if (title && link && title.length > 10 && link.startsWith('http') && results.length < 5) {
          results.push({
            title,
            url: link,
            content: `Search result ${results.length + 1}`,
            engine: 'searxng-fallback',
            score: 0.7,
            category: 'general'
          })
        }
      })
    }

    console.log(`Successfully extracted ${results.length} results from ${searxngInstanceBaseUrl}`)
    return results.slice(0, 8)

  } catch (error) {
    if (error instanceof Error) {

      if (error.name === 'AbortError') {
        console.log(`SearXNG search timed out for ${searxngInstanceBaseUrl}`)
      } else {
        console.error('SearXNG search error:', error)
      }
    }
    return []
  }
}


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const format = searchParams.get('format') || 'json'

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
  }

  try {
    console.log(`Starting search for query: "${query}"`)

    // Try the hybrid approach: sequential rotation with robust HTML parsing
    let searxngResults = await performSearXNGSearch(query)

    // If first instance fails, try a couple more
    if (searxngResults.length === 0) {
      console.log('First SearXNG instance failed, trying second...')
      searxngResults = await performSearXNGSearch(query)
    }

    if (searxngResults.length === 0) {
      console.log('Second SearXNG instance failed, trying third...')
      searxngResults = await performSearXNGSearch(query)
    }

    const allResults: SearchResult[] = [...searxngResults]
    const unresponsiveEngines: string[] = []

    // If SearXNG has no results, create a fallback
    if (allResults.length === 0) {
      console.log('No search results found, creating fallback result')
      allResults.push({
        title: `Search results for "${query}"`,
        url: `https://www.searx.me/?q=${encodeURIComponent(query)}`,
        content: `No results found for "${query}". You can try searching directly or rephrase your question.`,
        engine: 'fallback',
        score: 0.5,
        category: 'general'
      })
    }

    // Deduplicate and sort
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.url === result.url && r.url !== '')
    )

    uniqueResults.sort((a, b) => b.score - a.score)

    const response: SearchResponse = {
      query,
      number_of_results: uniqueResults.length,
      results: uniqueResults.slice(0, 8),
      answers: [],
      corrections: [],
      infoboxes: [],
      suggestions: [],
      unresponsive_engines: unresponsiveEngines
    }

    console.log(`Search completed for "${query}": ${response.number_of_results} results`)

    if (format === 'json') {
      return NextResponse.json(response)
    } else {
      return NextResponse.json(response)
    }

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, category = 'general' } = body

    if (!query) {
      return NextResponse.json({ error: 'Missing query in request body' }, { status: 400 })
    }

    // Reuse the GET logic
    const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('category', category)
    url.searchParams.set('format', 'json')

    const response = await fetch(url.toString())
    const data = await response.json()

    return NextResponse.json(data)

  } catch (error) {
    console.error('Search POST error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

