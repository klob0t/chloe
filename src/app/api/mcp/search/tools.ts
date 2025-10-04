export const webSearchTool = {
  type: "function", 
  function: {      
    name: 'web_search',
    description: 'Search the web using a SearXNG instance. Returns a JSON array of search results, each containing a url, title, and summary.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query or terms to search for on the web (e.g., "latest advancements in AI" or "weather in Jakarta").',
        },
      },
      required: ['query']
    }
  }
}

export const imageGeneration = {
  type: 'function',
  function: {
    name: 'image_gen',
    description: 'Generate an image using Flux or GPTImage. Returns a JSON containing the generated image URL.'
  }
}