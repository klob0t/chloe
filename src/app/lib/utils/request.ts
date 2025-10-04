interface Payload {
   messages: Array<{ role: string; content: string }>
   model?: string
}

export async function request(prompt: Payload): Promise<any> {
   if (!prompt) throw new Error('Prompt is empty!')

   try {
      const url = process.env.NEXT_PUBLIC_VERCEL_ENV === null || process.env.NEXT_PUBLIC_VERCEL_ENV === 'development'
         ? 'https://localhost:3000'
         : process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`

      const res = await fetch('/api/completion', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(prompt)
      })

      if (!res.ok) {
         // Clone the response to avoid consuming the body twice
         const clonedRes = res.clone()
         try {
            const errData = await res.json()
            throw new Error(errData.error || `HTTP error! status: ${res.status}`)
         } catch (e) {
            // If JSON parsing fails, try getting text from the cloned response
            const errText = await clonedRes.text()
            throw new Error(errText || `HTTP error! status: ${res.status}`)
         }
      }

      const data = await res.json()
      return data
   } catch (e: any) {
      console.error('Error sending prompt', e.message)
      throw e
   }
}