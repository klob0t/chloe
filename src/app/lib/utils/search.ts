export interface SearchResult {
  title: string
  url: string
  content: string
  engine: string
  score: number
  category: string
}

export interface SearchResponse {
  query: string
  number_of_results: number
  results: SearchResult[]
  answers: string[]
  corrections: string[]
  infoboxes: unknown[]
  suggestions: string[]
  unresponsive_engines: string[]
}

export type ToolFunctionArguments = {
  query: string
  category?: string
}

export interface ToolCallPayload {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export async function performSearch(query: string, category: string = 'general'): Promise<SearchResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      q: query,
      category,
      format: 'json'
    })

    const response = await fetch(`${baseUrl}/api/search?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Local search API error: ${response.status}`)
    }

    const data: SearchResponse = await response.json()
    return data
  } catch (error) {
    console.error('Search failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Search failed: ${message}`)
  }
}

export const SEARCH_TOOL = {
  type: 'function' as const,
  function: {
    name: 'search_web',
    description: 'Search the web for current information via Tavily. Use this when the user asks for recent news, current events, weather, stock prices, or any information that might have changed recently.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query - what you want to find information about'
        },
        category: {
          type: 'string',
          enum: ['general', 'news', 'images', 'videos', 'science', 'it'],
          description: "The category of search - defaults to 'general'",
          default: 'general'
        }
      },
      required: ['query']
    }
  }
}

const parseToolArguments = (rawArguments: string): ToolFunctionArguments => {
  try {
    const parsed = JSON.parse(rawArguments) as ToolFunctionArguments
    return parsed
  } catch (error) {
    console.error('Failed to parse tool arguments:', error)
    throw new Error('Invalid tool arguments payload')
  }
}

export async function handleToolCall(toolCall: ToolCallPayload): Promise<string> {
  if (toolCall.function.name !== 'search_web') {
    console.warn('Unknown tool requested:', toolCall.function.name)
    return 'Unknown tool'
  }

  const { query, category = 'general' } = parseToolArguments(toolCall.function.arguments)

  try {
    const results = await performSearch(query, category)

    console.log('Search tool results:', {
      query: results.query,
      totalResults: results.number_of_results,
      preview: results.results.slice(0, 3).map(result => ({
        title: result.title,
        url: result.url
      }))
    })

    if (!results.results || results.results.length === 0) {
      return `No search results found for "${query}".`
    }

    const formattedResults = results.results
      .slice(0, 5)
      .map((result, index) => `${index + 1}. **${result.title}**\n   ${result.content.substring(0, 200)}...\n   ${result.url}`)
      .join('\n\n')

    return `Search Results for "${query}":\n\n${formattedResults}`
  } catch (error) {
    console.error('Search tool failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return `Search failed: ${message}`
  }
}
