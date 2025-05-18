export async function sendPayload(payload) {
   if (!payload || typeof payload !== 'object') {
      throw new Error('SAY SOMETHING')
   }

   try {

      const BASE_URL =
         process.env.NEXT_PUBLIC_VERCEL_ENV == null ||
            process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
            ? "http://localhost:8000"
            : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
               ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
               : `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`


      const res = await fetch(`${BASE_URL}/api/chat`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(payload)
      })

      if (!res.ok) {
         let errorData
         try {
            errorData = await res.json()
         } catch (e) {
            const errorText = await res.text()
            errorData = { error: errorText || `API REQUEST FAILED: &{res.status} - ${res.statusText}` }
         }
         throw new Error(errorData || `API REQUEST FAILED: ${res.status} - ${res.statusText}`)
      }

      const data = await res.json()
      return data

   } catch (error) {
      console.error('ERROR SENDING PROMPT TO API', error.message)
      throw error
   }

}

export function parseAssistantMessage(content) {
   if (typeof content !== 'string') {
      console.warn("NON-STRING")
      return { thinking: null, answer: String(content || "").trim() }
   }

   const thinkBlockRegex = /<think>([\s\S]*?)<\/think>\s*([\s\S]*)/
   const match = content.match(thinkBlockRegex)

   if (match && match.length === 3) {
      return {
         thinking: match[1].trim(),
         answer: match[2].trim()
      }
   } else {
      return {
         thinking: null,
         answer: content.trim()
      }
   }
}
