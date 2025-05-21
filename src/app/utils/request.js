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

      const res = await fetch(`${BASE_URL}/api/chat`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(payload)
      })

      if (!res.ok) {
      let errorContent 
      let errorMessageForThrow 

      try {
        errorContent = await res.json() 
        if (typeof errorContent === 'object' && errorContent !== null) {
          errorMessageForThrow = errorContent.message || errorContent.error?.message || errorContent.error || JSON.stringify(errorContent)
        } else {
          errorMessageForThrow = JSON.stringify(errorContent)
        }
      } catch (e) {
        errorContent = await res.text()
        errorMessageForThrow = errorContent || `API REQUEST FAILED: ${res.status} - ${res.statusText}`
      }

      console.error('--- Server Error Response ---')
      console.error('Status:', res.status, res.statusText)
      console.error('Response Content:', errorContent) 
      console.error('--- End Server Error Response ---')
      throw new Error(errorMessageForThrow)
    }

    const data = await res.json()
    return data

   } catch (error) {

    console.error('--- ERROR IN sendPayload ---')

    console.error('Error Message:', error.message)
    console.error('Payload Sent:', JSON.stringify(payload, null, 2)) 
    if (error.stack) {
      console.error('Stack Trace:', error.stack)
    }
    console.error('--- END ERROR IN sendPayload ---')
    throw error
  }
}

export async function handleSubmit(promptText, currentMessageHistory, currentConversationId) {
   if (!promptText || !promptText.trim()) {
      return { error: 'EMPTY', type: 'validation' }
   }
   let payloadToSend
   let messageType = 'text'
   if (promptText.toLowerCase().startsWith('/imagine ')) {
      const fullPrompt = promptText.substring(0).trim()
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
      return { error: 'Image prompt description is missing before options.', type: 'validation' }
    }
    if (!output.imagePrompt) {
        return { error: 'Image prompt description cannot be empty.', type: 'validation' }
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
         currentPrompt: promptText,
         messageHistory: currentMessageHistory,
         conversationId: currentConversationId
      }
      messageType = 'text'
   }
   try {
      const apiResponse = await sendPayload(payloadToSend)
      return { ...apiResponse, messageType, originalUserCommand: promptText }
   } catch (error) {
      return { error: error.message || 'API SUBMISSION FAILED', messageType, originalUserCommand: promptText, type: 'api'}
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