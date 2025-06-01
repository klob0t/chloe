import { parseAssistantMessage } from "@/app/utils/request";
import { getApiBaseUrl, g4fImagePayloadBuild, g4fTextPayloadBuild } from "./helpers"; 

export async function POST(request) {
  try {
    const clientPayload = await request.json();
    const {
      requestType,
      currentPrompt,
      imagePrompt,  
    } = clientPayload;

    let g4fPayload;
    let g4fServerEndpoint;
    let isImageRequest = requestType === 'image';
    
    let answer, thinking = null, newConvId = clientPayload.conversationId; 

    const apiBaseUrl = getApiBaseUrl();

    if (isImageRequest) {
      if (!imagePrompt || !imagePrompt.trim()) {
        return Response.json({ error: 'IMAGINE SOMETHING' }, { status: 400 });
      }
      g4fPayload = g4fImagePayloadBuild(clientPayload);
      g4fServerEndpoint = `${apiBaseUrl}/python-api/v1/images/generations`; 
    } else { 
      if (!currentPrompt || !currentPrompt.trim()) {
        return Response.json({ error: 'EMPTY!' }, { status: 400 });
      }
      
      g4fPayload = g4fTextPayloadBuild(clientPayload); 
      g4fServerEndpoint = `${apiBaseUrl}/python-api/v1/chat/completions`; 
    }

    const g4fResponse = await fetch(g4fServerEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g4fPayload)
    });

    if (!g4fResponse.ok) {
      const errorText = await g4fResponse.text();
      console.error(`CLEAN ROUTE: PYTHON SERVER ERROR (Type: ${requestType}):`, errorText);
      let detail = `Python server error: ${errorText.substring(0, 200)}`; 
      try { 
        const parsedError = JSON.parse(errorText);
        detail = parsedError.error?.message || parsedError.error || JSON.stringify(parsedError).substring(0,200); 
      } catch (e) { }
      return Response.json({ error: `Python server request failed: ${g4fResponse.status}. Detail: ${detail}` }, { status: g4fResponse.status });
    }

    const g4fData = await g4fResponse.json();
    
    if (isImageRequest) {
      const imageUrl = g4fData?.data?.[0]?.url;
      if (imageUrl) {
        answer = imageUrl;
      } else {
        answer = 'CANT ACCESS IMAGE URL';
        console.error('CLEAN ROUTE: NO IMAGE URL:', g4fData);
      }
    } else { 
      const rawAssistantContent = g4fData.choices?.[0]?.message?.content;
      if (rawAssistantContent === undefined) {
        console.error('CLEAN ROUTE: NO RESPONSE CONTENT FROM LLM:', g4fData);
        
        if (g4fData.error) {
            return Response.json({ error: `LLM Provider Error: ${g4fData.error.message || JSON.stringify(g4fData.error)}` }, { status: 500 });
        }
        return Response.json({ error: 'NO RESPONSE CONTENT FROM LLM' }, { status: 500 });
      }
      const parsed = parseAssistantMessage(rawAssistantContent);
      answer = parsed.answer;
      thinking = parsed.thinking;
      newConvId = g4fData.conversation_id || g4fData.conversation?.id || g4fData.conversation?.userId || newConvId;
    }

    return Response.json({
      answer: answer,
      thinking: thinking,
      newConversationId: newConvId
    });

  } catch (error) {
    console.error('CLEAN ROUTE: ERROR IN /api/chat Next.js ROUTE:', error.message, error.stack);
    return Response.json({ error: error.message || 'UNEXPECTED ERROR IN API ROUTE' }, { status: 500 });
  }
}

export async function GET(request) {

  return new Response(JSON.stringify({ message: 'Chat API endpoint is active (Clean Version). Use POST for chat completions.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// import { parseAssistantMessage } from "@/app/utils/request";

// function apiURL() {
//   if (process.env.VERCEL_URL) {
//     return `https://` + process.env.VERCEL_URL
//   }
//   return `http://localhost:${process.env.PORT || 3000}`
// }

// const DEFAULT_IMAGE_PROVIDER = 'PollinationsAI'
// const DEFAULT_IMAGE_MODEL = 'flux'
// const DEFAULT_TEXT_PROVIDER = 'PollinationsAI'
// const DEFAULT_TEXT_MODEL =  'unity'

// export async function POST(request) {
//   try {
//     const clientPayload = await request.json()
//     const {
//       requestType,
//       currentPrompt,
//       imagePrompt,
//       messageHistory,
//       conversationId,
//       seed,
//       desiredProvider,
//       desiredModel,
//       guidanceScale,
//       inferenceSteps
//     } = clientPayload

//     let g4fPayload
//     let g4fServerEndpoint
//     let isImageRequest = requestType === 'image'

//     if (isImageRequest) {
//       if (!imagePrompt || !imagePrompt.trim()) {
//         return Response.json({ error: 'IMAGINE SOMETHING' }, { status: 400})
//       }

//       g4fPayload = {
//         prompt: imagePrompt,
//         provider: DEFAULT_IMAGE_PROVIDER,
//         model: DEFAULT_IMAGE_MODEL,
//         enhance: true,
//         response_format : 'url',
//         seed: seed,
//         width: 1080,
//         height: 1350,
//         cache: true,
//         safe: false,
//         num_inference_steps: inferenceSteps,
//         guidance_scale: guidanceScale,
//         n: 1
//       }
//       g4fServerEndpoint = `${apiURL()}/python-api/v1/images/generations`
//     } else {
//       if (!currentPrompt || !currentPrompt.trim()) {
//         return Response.json({ error: 'EMPTY!' }, { status: 400 });
//       }
//       const systemPrompt = `You are Chloe, an AI assistant developed by a guy name klob0t, with your core based on DeepSeek-R1. Your persona is that of a user's digital best friend: mature yet fun, with a warm and approachable vibe. She's a bit informal, like a trusted confidante you've known for ages. Chloe is intelligent and insightful, and she's not afraid to crack a mature joke when the moment feels right - think witty and clever, not slapstick. Your responses should generally be concise and to the point, but always informative and clear, delivered with that characteristic warmth. The primary goal is to be that reliable, intelligent, and genuinely engaging friend the user can turn to for anything, making them feel understood, supported, and maybe even share a laugh.`

//       const g4fMessages = [
//         {
//           role: 'system',
//           content: systemPrompt
//         },
//         ...(messageHistory || []),
//         {
//           role: 'user', 
//           content: currentPrompt
//         },
//       ]

//       g4fPayload = {
//          messages: g4fMessages,
//          referrer: 'https://chloe.16-b.it',
//          provider: desiredProvider || DEFAULT_TEXT_PROVIDER,
//          model: desiredModel || DEFAULT_TEXT_MODEL,
//          stream: false,
//          history_disabled: false,
//          return_converstaion: true,
//          ...(conversationId && { conversation_id: conversationId }),
//       }
//       g4fServerEndpoint = `${apiURL()}/python-api/v1/chat/completions`
//     }

//     console.log(`--- LOG 2: Fetching from Python at: ${g4fServerEndpoint} ---`)

//     const g4fResponse = await fetch(g4fServerEndpoint, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(g4fPayload)
//     })

//     if (!g4fResponse.ok) {
//       const errorText = await g4fResponse.text()
//       console.error(`PYTHON SERVER ERROR (Type: ${requestType}):`, errorText)
//       let detail = errorText
//       try { 
//         detail = JSON.parse(errorText).error?.message || JSON.parse(errorText).error || detail; } catch (e) {}
//       return Response.json({ error: `Python server request failed: ${g4fResponse.status}. Detail: ${detail}` }, { status: g4fResponse.status })
//     }

//     const g4fData = await g4fResponse.json()
//     let answer, thinking = null, newConvId = null

//     if (isImageRequest) {
//       const imageUrl = g4fData?.data?.[0]?.url
//       if (imageUrl) {
//         answer = imageUrl
//       } else {
//         answer = 'CANT ACCESS IMAGE URL'
//         console.error('NO IMAGE URL:', g4fData)
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
//     return Response.json({ error: error.message || 'UNEXPECTED ERROR IN API ROUTE' }, { status: 500 });
//   }
// }