'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'
import Input from '@/app/component/input'
import Chats from '@/app/component/chats'
import { sendPayload } from '@/app/utils/request'
import gsap from 'gsap'

const LOADING_MESSAGE_ID = 'assistant-loading-placeholder'

export default function Main() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState([])
  const chatWindowRef = useRef(null)
  const containerRef = useRef(null)
  const [conversationId, setConversationId] = useState(null)


  const aniMain = () => {
    // if (containerRef.current) {
    //   const tl = gsap.timeline();
    //   tl.to(containerRef.current, {
    //   border: '5px solid #2e9dff',
    //   duration: 0.1,
    //   ease: 'none', 
    //   repeat: 1,
    //   onComplete: () => {
    //     gsap.set(containerRef.current, { clearProps: 'border' })

      
    //   }
    // })
    // }
      return
  }

  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const chatNode = chatWindowRef.current
    if (!chatNode) return

    const observer = new MutationObserver(scrollToBottom)
    const config = { childList: true, subtree: true, characterData: true }

    observer.observe(chatNode, config)

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleSendPrompt = async (promptText) => {
    if (!promptText || !promptText.trim()) {
      return
    }

    setError('')
    const newUserMessage = { role: 'user', content: promptText }
    const currentMessageHistoryForApi = [...messages]

    setMessages(prevMessages => [
      ...prevMessages,
      newUserMessage,
      { role: 'assistant', type: 'loading', id: LOADING_MESSAGE_ID, content: '' }])
    setIsLoading(true)

    let payloadToNextApi

    try {
      let apiResponse
      let messageType = 'text'

      if (promptText.toLowerCase().startsWith('/imagine ')) {
        const imagePrompt = promptText.substring(8).trim()
        if (!imagePrompt) {
          setMessages(prevMessages => [
            ...prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID),
            { role: 'assistant', content: 'PROVIDE DESC AFTER /IMAGINE', id: `error-${Date.now()}` }
          ])
          setIsLoading(false)
          return
        }
        const payloadToNextApi = {
          requestType: 'image',
          imagePrompt: imagePrompt,
          originalUserCommand: promptText,
          messageHistory: currentMessageHistoryForApi,
          conversationId: conversationId,
        }
        apiResponse = await sendPayload(payloadToNextApi)
        messageType = 'image'
      } else {
        const payloadToNextApi = {
          requestType: 'text',
          currentPrompt: promptText,
          messageHistory: currentMessageHistoryForApi,
          conversationId: conversationId,
        }
        apiResponse = await sendPayload(payloadToNextApi)
        messageType = 'text'
      }

    let assistantContent = apiResponse.answer

    if (messageType === 'image' && apiResponse.error) {
      assistantContent = apiResponse.error
      messageType = 'text'
    }

    setMessages(prevMessages => [
      ...prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID),
      {
        role: 'assistant',
        type: messageType,
        content: apiResponse.answer,
        id: `assistant-${Date.now()}`
      }
    ])

    if (apiResponse.conversationId && messageType === 'text') {
      setConversationId(apiResponse.newConversationId)
    }

  } catch (err) {
    setError(err.message || "THIS IS UNEXPECTED")
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID && msg.id !== newUserMessage.id))
  } finally {
    setIsLoading(false)
  }
}

return (
  <div ref={containerRef} className={styles.mainContainer}>
    <div className={styles.chatWindow} ref={chatWindowRef}>
      <Chats messages={messages} />
    </div>
    {error && !isLoading && <p className={styles.errorMessage}>{error}</p>}
    <div className={styles.inputContainer}>
      <Input onSubmit={handleSendPrompt} isLoading={isLoading} mainAnim={aniMain} />
    </div>
  </div>
)
}