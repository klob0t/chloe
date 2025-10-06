interface Payload {
   messages: Array<{ role: string; content: string }>
   model?: string
}

export interface CompletionResponse {
    response?: string
    usage?: unknown
    [key: string]: unknown
}

export interface ImageRequestPayload {
    imagePrompt: string
    seed?: number
    guidanceScale?: number
    inferenceSteps?: number
    desiredModel?: string
    width?: number
    height?: number
}

export interface ImageResponse {
    response: string
    metadata?: Record<string, unknown>
}

export async function request(prompt: Payload): Promise<CompletionResponse> {
   if (!prompt) throw new Error('Prompt is empty!')

   try {
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
         } catch {
            // If JSON parsing fails, try getting text from the cloned response
            const errText = await clonedRes.text()
            throw new Error(errText || `HTTP error! status: ${res.status}`)
         }
      }

      const data = await res.json()
      return data as CompletionResponse
   } catch (error: unknown) {
      console.error('Error sending prompt', error instanceof Error ? error.message : error)
      throw error
   }
}

export async function requestImage(payload: ImageRequestPayload): Promise<ImageResponse> {
   if (!payload || !payload.imagePrompt) throw new Error('Image prompt is empty!')

   try {
      const res = await fetch('/api/image', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(payload)
      })

      if (!res.ok) {
         const clonedRes = res.clone()
         try {
            const errData = await res.json()
            throw new Error(errData.error || `HTTP error! status: ${res.status}`)
         } catch {
            const errText = await clonedRes.text()
            throw new Error(errText || `HTTP error! status: ${res.status}`)
         }
      }

      const data = (await res.json()) as ImageResponse
      return data
   } catch (error: unknown) {
      console.error('Error requesting image', error instanceof Error ? error.message : error)
      throw error
   }
}
