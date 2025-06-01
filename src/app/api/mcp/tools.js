export const webSearchTool = {
   name: 'web_search',
   description: 'Search the web using a SearXNG instance. Returns a JSON array of search results, each containing a url, title, and summary.',
   parameters: {
      type: 'object',
      properties: {
         query: {
            type: 'string',
            description: 'The search query or terms to search'
         }
      }
   }
}