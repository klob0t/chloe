interface Payload {
   prompt: string
   system?: string
   id: string
   history: any[]
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
         let errData
         try {
            errData = await res.json()
         } catch (e) {
            const errText = await res.text()
         }
      }

      const data = await res.json()
      return data
   } catch (e: any) {
      console.error('Error sending prompt', e.message)
      throw e
   }
}