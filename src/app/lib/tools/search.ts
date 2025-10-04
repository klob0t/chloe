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
  infoboxes: any[]
  suggestions: string[]
  unresponsive_engines: string[]
}

export async function performSearch(query: string, category: string = 'general'): Promise<SearchResponse> {
  try {
    // Use our local search API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      q: query,
      category,
      format: 'json'
    })

    const response = await fetch(`${baseUrl}/api/search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Local search API error: ${response.status}`)
    }

    const data = await response.json()
    return data as SearchResponse
  } catch (error) {
    console.error('Search failed:', error)
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "search_web",
    description: "Search the web for current information using multiple search engines. Use this when the user asks for recent news, current events, weather, stock prices, or any information that might have changed recently.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query - what you want to find information about"
        },
        category: {
          type: "string",
          enum: ["general", "news", "images", "videos", "science", "it"],
          description: "The category of search - defaults to 'general'",
          default: "general"
        }
      },
      required: ["query"]
    }
  }
}

export async function handleToolCall(toolCall: any): Promise<string> {
  if (toolCall.function.name === "search_web") {
    const args = JSON.parse(toolCall.function.arguments)
    const { query, category = "general" } = args

    console.log(`🔍 Tool call received - Query: "${query}", Category: "${category}"`)

    try {
      const results = await performSearch(query, category)

      console.log(`📊 Search results received:`, {
        query: results.query,
        totalResults: results.number_of_results,
        actualResultsCount: results.results?.length || 0,
        results: results.results?.map(r => ({ title: r.title, url: r.url, content: r.content?.substring(0, 100) + '...' }))
      })

      if (!results.results || results.results.length === 0) {
        console.log(`❌ No results found for query: "${query}"`)
        return `No search results found for "${query}".`
      }

      const formatted = results.results
        .slice(0, 5)
        .map((result, index) =>
          `${index + 1}. **${result.title}**\n   ${result.content.substring(0, 200)}...\n   🔗 ${result.url}`
        ).join('\n\n')

      const finalResponse = `Search Results for "${query}":\n\n${formatted}`
      console.log(`✅ Formatted response length: ${finalResponse.length} characters`)

      return finalResponse
    } catch (error) {
      console.error(`❌ Search failed for query "${query}":`, error)
      return `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  console.log(`❓ Unknown tool called: ${toolCall.function.name}`)
  return "Unknown tool"
}