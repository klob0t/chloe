export async function sendPrompt(prompt) {
   if (!prompt || !prompt.trim()) {
      throw new Error('SAY SOMETHING')
   }

   try {
      const res = await fetch('/api/chat', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({ prompt: prompt })
      })

      if (!res.ok) {
         let errorData
         const contentType = res.headers.get('content-type')
         if (contentType && contentType.indexOf('application/json') !== -1) {
            errorData = await res.json()
         } else {
            errorData = { error: await res.text() }
         }
         throw new Error(errorData.error || `API REQUEST FAILED: ${res.status} - ${res.statusText}`)
      }

      const data = await res.json()
      if (!data.response) {
         throw new Error('NO REPLY FROM CHLOE')
      }
      return data.response
   } catch (error) {
      console.error('ERROR SENDING PROMPT', error)
      throw error
   }
}

export function parseAssistantMessage(content) {
   if (typeof content !== 'string') {
      console.warn("NON-STRING")
      return { thinking:null, answer:String(content || "").trim() }
   }

   const thinkBlockRegex =  /<think>([\s\S]*?)<\/think>\s*([\s\S]*)/
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
