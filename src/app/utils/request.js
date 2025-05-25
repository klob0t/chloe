export async function sendPayload(payload) {
   if (!payload || typeof payload !== 'object') {
      throw new Error('SAY SOMETHING')
   }

   try {
      const BASE_URL =
         process.env.NEXT_PUBLIC_VERCEL_ENV == null ||
            process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
            ? "http://localhost:3000"
            : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
               ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
               : `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`

      const res = await fetch('/api/chat', {
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

export async function handleSubmit(textPrompt, imagePrompt, currentMessageHistory, currentConversationId) {
   if (!textPrompt || !textPrompt.trim()) {
      return { error: 'EMPTY', type: 'validation' }
   }
   let payloadToSend
   let messageType = 'text'
   if (imagePrompt) {
      const fullPrompt = imagePrompt
      if (!fullPrompt) {
         return { error: 'INSERT PROMPT AFTER /IMAGINE', type: 'validation'}
      }
      const output = {}
    const promptMatch = fullPrompt.match(/^(.*?)(?=\s--|$)/)
    if (promptMatch && promptMatch[1]) { 
      output.imagePrompt = promptMatch[1].trim()
    } else if (!fullPrompt.includes("--")) { 
      output.imagePrompt = fullPrompt.trim()
    } else {
      return { error: 'IMAGE PROMPT CANT BE EMPTY', type: 'validation' }
    }
    if (!output.imagePrompt) {
        return { error: 'IMAGE PROMPT CANT BE EMPTY', type: 'validation' }
    }
    const regex = /--(\w+)\s+([\w\d.-]+)/g
    let match
    while ((match = regex.exec(fullPrompt)) !== null) {
      output[match[1]] = match[2].trim()

    }
      payloadToSend = {
         requestType: 'image',
         imagePrompt: output.imagePrompt,
         inferenceSteps: output.nis,
         seed: output.seed,
         guidanceScale: output.gs,
         messageHistory: currentMessageHistory,
         conversationId: currentConversationId
      }
      messageType = 'image'
   } else {
      payloadToSend = {
         requestType: 'text',
         currentPrompt: textPrompt,
         messageHistory: currentMessageHistory,
         conversationId: currentConversationId
      }
      messageType = 'text'
   }
   try {
      const apiResponse = await sendPayload(payloadToSend)
      return { ...apiResponse, messageType, originalUserCommand: textPrompt }
   } catch (error) {
      return { error: error.message || 'API SUBMISSION FAILED', messageType, originalUserCommand: textPrompt, type: 'api'}
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