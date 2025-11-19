import { NextRequest, NextResponse } from 'next/server'

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

interface TavilyItem {
  title: string
  url: string
  content?: string
  score?: number
}

interface TavilyResponse {
  query: string
  results: TavilyItem[]
  answer?: string
}

const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const TAVILY_API_URL = process.env.TAVILY_API_URL || 'https://api.tavily.com/search'

async function performTavilySearch(query: string): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) {
    console.error('Missing TAVILY_API_KEY environment variable')
    return []
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    const resp = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 8,
        include_answer: false,
        include_raw_content: false
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error('Tavily request failed:', resp.status, resp.statusText, text)
      return []
    }

    const data = (await resp.json()) as TavilyResponse
    const items = Array.isArray(data.results) ? data.results.slice(0, 8) : []

    return items.map((r, i) => ({
      title: r.title,
      url: r.url,
      content: r.content || `Search result ${i + 1}`,
      engine: 'tavily',
      score: typeof r.score === 'number' ? r.score : 0.9 - i * 0.05,
      category: 'general'
    }))
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Tavily search timed out')
    } else {
      console.error('Tavily search error:', error)
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

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'Missing TAVILY_API_KEY' }, { status: 500 })
  }

  try {
    console.log(`Starting Tavily search for query: "${query}"`)
    const tavilyResults = await performTavilySearch(query)

    // Deduplicate and sort
    const uniqueResults = tavilyResults.filter((result, index, self) =>
      index === self.findIndex(r => r.url === result.url && r.url !== '')
    )

    uniqueResults.sort((a, b) => b.score - a.score)

    const response: SearchResponse = {
      query,
      number_of_results: uniqueResults.length,
      results: uniqueResults,
      answers: [],
      corrections: [],
      infoboxes: [],
      suggestions: [],
      unresponsive_engines: []
    }

    console.log(`Tavily search completed: ${response.number_of_results} results`)

    // format currently ignored; JSON only
    return NextResponse.json(response)
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
    const { query } = body as { query?: string }

    if (!query) {
      return NextResponse.json({ error: 'Missing query in request body' }, { status: 400 })
    }

    if (!TAVILY_API_KEY) {
      return NextResponse.json({ error: 'Missing TAVILY_API_KEY' }, { status: 500 })
    }

    const tavilyResults = await performTavilySearch(query)

    const uniqueResults = tavilyResults.filter((result, index, self) =>
      index === self.findIndex(r => r.url === result.url && r.url !== '')
    )

    uniqueResults.sort((a, b) => b.score - a.score)

    const response: SearchResponse = {
      query,
      number_of_results: uniqueResults.length,
      results: uniqueResults,
      answers: [],
      corrections: [],
      infoboxes: [],
      suggestions: [],
      unresponsive_engines: []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Search POST error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

