// import { parseAssistantMessage } from '@/app/utils/request'

// function apiURL() {
//   if (process.env.VERCEL_URL) {
//     return `https://` + process.env.VERCEL_URL
//   }
//   return `http://localhost:${process.env.PORT || 3000}`
// }

// export async function POST(request) {
//   try {
//     const clientPayload = await request.json()
//     const {
//       requestType, 
//       currentPrompt,
//       imagePrompt,  
//       originalUserCommand,
//       messageHistory,
//       conversationId,
//       desiredProvider, 
//       desiredModel
//     } = clientPayload

//     let g4fPayload
//     let isImageRequest = requestType === "image"

//     if (isImageRequest) {
//       if (!imagePrompt || !imagePrompt.trim()) {
//          console.log('error1')
//         return Response.json({ error: 'IMAGINE SOMETHING' }, { status: 400 })
//       }

//       const g4fMessages = [
//         {
//           role: 'system',
//           content: ''
//         },
//         ...(messageHistory || []),
//         { role: 'user', content: imagePrompt },
//       ]

//       g4fPayload = {
//         messages: g4fMessages, 
//         provider: "PollinationsAI", 
//         model: "flux-pro",    
//         stream: false,
//         history_disabled: false, 
//         return_conversation: true,
//         enhance: true,
//         cache: true,
//         safe: false,
//         num_inference_steps: 50,
//         guidance_scale: 2.0,
//         negative_prompt: "worst quality, blurry, compression artifact",
//         n: 1
//       }
//     } else { 
//       if (!currentPrompt || !currentPrompt.trim()) {
//          console.log('error2') 
//          return Response.json({ error: 'EMPTY!' }, { status: 400 })

//       }
//       // const systemPrompt = `You are Chloe, an AI assistant developed by klob0t, with your core based on DeepSeek-R1. Your persona is that of a user's digital best friend: mature yet fun, with a warm and approachable vibe. She's a bit informal, like a trusted confidante you've known for ages. Chloe is intelligent and insightful, and she's not afraid to crack a mature joke when the moment feels right – think witty and clever, not slapstick. Your responses should generally be concise and to the point, but always informative and clear, delivered with that characteristic warmth. The primary goal is to be that reliable, intelligent, and genuinely engaging friend the user can turn to for anything, making them feel understood, supported, and maybe even share a laugh. `

//       const systemPrompt = ''

//       const g4fMessages = [
//         {
//           role: 'system',
//           content: systemPrompt
//         },
//         ...(messageHistory || []),
//         { role: 'user', content: currentPrompt },
//       ]
//       g4fPayload = {
//         messages: g4fMessages,
//         provider: desiredProvider || "PerplexityLabs", 
//         model: desiredModel || "r1-1776",
//         stream: false,
//         history_disabled: false,
//         return_conversation: true,
//         ...(conversationId && { conversation_id: conversationId }),
//       }
//     }

//     const baseUrl = apiURL()
//     const G4F_SERVER = `${baseUrl}/api/v1/chat/completions`

//     console.log(G4F_SERVER)

//     const g4fResponse = await fetch(G4F_SERVER, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(g4fPayload),
//     })

//     if (!g4fResponse.ok) {
//       const errorText = await g4fResponse.text()
//       console.error(`PYTHON SERVER ERROR (Type: ${requestType}):`, errorText)
//       let detail = errorText
//       try { detail = JSON.parse(errorText).error?.message || JSON.parse(errorText).error || errorText } catch (e) {/* ignore */}
//       return Response.json({ error: `Python server request failed: ${g4fResponse.status}. Detail: ${detail}` }, { status: g4fResponse.status })
//     }

//     const g4fData = await g4fResponse.json()
//     let answer, thinking = null, newConvId = null

//     if (isImageRequest) {

//       const imageUrl = g4fData.choices?.[0]?.message?.content || g4fData.imageUrl
//       if (imageUrl) {
//         answer = `${imageUrl}`
//       } else {
//         answer = "CANT ACCESS THE URL"
//         console.error("NO URL:", g4fData)
//       }
//     } else { 
//       const rawAssistantContent = g4fData.choices?.[0]?.message?.content
//       if (rawAssistantContent === undefined) {
//         return Response.json({ error: 'NO RESPONSE' }, { status: 500 })
//       }
//       const parsed = parseAssistantMessage(rawAssistantContent)
//       answer = parsed.answer
//       thinking = parsed.thinking
//       newConvId = g4fData.conversation_id || g4fData.conversation?.id || g4fData.conversation?.userId || conversationId
//     }

//     return Response.json({
//       answer: answer,
//       thinking: thinking,
//       newConversationId: newConvId
//     })

//   } catch (error) {
//     console.error('ERROR IN /api/chat Next.js ROUTE:', error.message)
//     return Response.json({ error: error.message || 'UNEXPECTED ERROR IN API ROUTE' }, { status: 500 })
//   }
// }

import { parseAssistantMessage } from "@/app/utils/request";

function apiURL() {
  if (process.env.VERCEL_URL) {
    return `https://` + process.env.VERCEL_URL
  }
  return `http://localhost:${process.env.PORT || 3000}`
}

const DEFAULT_IMAGE_PROVIDER = 'PollinationsAI'
const DEFAULT_IMAGE_MODEL = 'flux-pro'
const DEFAULT_TEXT_PROVIDER = 'PollinationsAI'
const DEFAULT_TEXT_MODEL = 'deepseek-reasoning'

export async function POST(request) {
  try {
    const clientPayload = await request.json()
    const {
      requestType,
      currentPrompt,
      imagePrompt,
      originalUserCommand,
      messageHistory,
      conversationId,
      desiredProvider,
      desiredModel
    } = clientPayload

    let g4fPayload
    let g4fServerEndpoint
    let isImageRequest = requestType === 'image'

    if (isImageRequest) {
      if (!imagePrompt || !imagePrompt.trim()) {
        return Response.json({ error: 'IMAGINE SOMETHING' }, { status: 400})
      }

      const g4fMessages = [
        {
          role: 'system',
          content: 'you are an artist that will realize everything the user prompted'
        },
        { 
          role: 'user',
          content: imagePrompt
        },
      ]

      g4fPayload = {
        prompt: imagePrompt,
        provider: DEFAULT_IMAGE_PROVIDER,
        model: DEFAULT_IMAGE_MODEL,
        stream: false,
        enhance: true,
        response_format : 'url',
        // history_disabled: false, 
        // return_conversation: true,
        enhance: true,
        width: 1080,
        height: 1350,
        cache: true,
        safe: false,
        // num_inference_steps: 2,
        // guidance_scale: 2,
        n: 1
      }
      g4fServerEndpoint = `${apiURL()}/api/v1/images/generations`
    } else {
      if (!currentPrompt || !currentPrompt.trim()) {
        return Response.json({ error: 'EMPTY!' }, { status: 400 });
      }
      const systemPrompt = 'xxx'

      const g4fMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...(messageHistory || []),
        {
          role: 'user', 
          content: currentPrompt
        },
      ]

      g4fPayload = {
         messages: g4fMessages,
         provider: desiredProvider || DEFAULT_TEXT_PROVIDER,
         model: desiredModel || DEFAULT_TEXT_MODEL,
         stream: false,
         history_disabled: false,
         return_converstaion: true,
         ...(conversationId && { conversation_id: conversationId }),
      }
      g4fServerEndpoint = `${apiURL()}/api/v1/chat/completions`
    }

    const g4fResponse = await fetch(g4fServerEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g4fPayload)
    })

    if (!g4fResponse.ok) {
      const errorText = await g4fResponse.text()
      console.error(`PYTHON SERVER ERROR (Type: ${requestType}):`, errorText)
      let detail = errorText
      try { 
        detail = JSON.parse(errorText).error?.message || JSON.parse(errorText).error || detail; } catch (e) {}
      return Response.json({ error: `Python server request failed: ${g4fResponse.status}. Detail: ${detail}` }, { status: g4fResponse.status })
    }

    const g4fData = await g4fResponse.json()
    let answer, thinking = null, newConvId = null

    if (isImageRequest) {
      // console.log(g4fData)
      // const imageUrl = g4fData.choices?.[0]?.message?.content || g4fData?.data?.[0]?.url
      const imageUrl = g4fData?.data?.[0]?.url
      // const imgUrl = rawUrl.indexOf('ps:')
      // const extracted = rawUrl.substring(imgUrl + "https:".length)
      // console.log(extracted)
      // const imageUrl = decodeURIComponent(extracted)
      // console.log(imageUrl)
      console.log(imageUrl)

      if (imageUrl) {
        answer = imageUrl
      } else {
        answer = 'CANT ACCESS IMAGE URL'
        console.error('NO IMAGE URL:', g4fData)
      }
    } else {
      const rawAssistantContent = g4fData.choices?.[0]?.message?.content
      if (rawAssistantContent === undefined) {
        return Response.json({ error: 'NO RESPONSE' }, { status: 500 })
      }
      const parsed = parseAssistantMessage(rawAssistantContent)
      answer = parsed.answer
      thinking = parsed.thinking
      newConvId = g4fData.conversation_id || g4fData.conversation?.id || g4fData.conversation?.userId || conversationId
    }

    return Response.json({
      answer: answer,
      thinking: thinking,
      newConversationId: newConvId
    })
  } catch (error) {
    console.error('ERROR IN /api/chat Next.js ROUTE:', error.message)
    return Response.json({ error: error.message || 'UNEXPECTED ERROR IN API ROUTE' }, { status: 500 });
  }
}