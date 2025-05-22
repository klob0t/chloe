'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'
import Input from '@/app/component/input'
import Chats from '@/app/component/chats'
import { handleSubmit } from '@/app/utils/request'

const TEXT_LOADING_ID = 'text-loading-placeholder'
const IMAGE_LOADING_ID = 'image-loading-placeholder'

export default function Main() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const chatWindowRef = useRef(null)
  const containerRef = useRef(null)
  const [conversationId, setConversationId] = useState(null)

  //-------------------SCROLL TO LAST MESSAGE LINE---------------------
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const chatNode = chatWindowRef.current
    if (!chatNode) return
    const observer = new MutationObserver(() => {
      if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
      }
    })
    const config = { childList: true, subtree: true, characterData: true }
    observer.observe(chatNode, config)
    return () => {
      observer.disconnect()
    }
  }, [])
  //-------------------SCROLL TO LAST MESSAGE LINE---------------------

  //-------------------------HANDLE SEND PROMPT------------------------
  const handleSendPrompt = async (textPrompt) => {
    if (!textPrompt || !textPrompt.trim()) {
      return
    }


    const currentMessageHistoryForApi = [...messages]

    setError('')


    const newUserMessage = { role: 'user', content: textPrompt, id: `user-${Date.now()}` }


    let imagePrompt
    //--------SET IMAGE OR TEXT------------

    if (textPrompt.toLowerCase().startsWith('/imagine ')) {
      const newUserMessage = { role: 'user', content: textPrompt, id: `user-${Date.now()}` }
      imagePrompt = textPrompt.substring(8).trim()
      console.log(imagePrompt)
      setMessages(prevMessages => [
        ...prevMessages,
        newUserMessage,
        { role: 'assistant', type: 'image-loading', id: IMAGE_LOADING_ID, content: '' }
      ])
      setIsLoading(true)
    } else {
      const newUserMessage = { role: 'user', content: textPrompt, id: `user-${Date.now()}` }
      setMessages(prevMessages => [
        ...prevMessages,
        newUserMessage,
        { role: 'assistant', type: 'text-loading', id: TEXT_LOADING_ID, content: '' }
      ])
      setIsLoading(true)
    }

    try {

      const result = await handleSubmit(textPrompt, imagePrompt, currentMessageHistoryForApi, conversationId)

      if (result.type === 'validation') {
        setMessages(prevMessages => [
          ...prevMessages.filter(msg => msg.id !== TEXT_LOADING_ID && msg.id !== IMAGE_LOADING_ID),
          { role: 'assistant', content: result.error, id: `error-validation-${Date.now()}`, type: 'text' }
        ])
        return
      }

      if (result.type === 'api') {
        setMessages(prevMessages => [
          ...prevMessages.filter(msg => msg.id !== TEXT_LOADING_ID && msg.id !== IMAGE_LOADING_ID),
          { role: 'assistant', type: 'text', content: result.error || 'An API error occurred.', id: `error-api-${Date.now()}` }
        ])
        setError(result.error || 'AN API ERROR OCCURRED.')
        return
      }
      let assistantContent = result.answer
      let finalMessageType = result.messageType

      if (result.messageType === 'image' && result.error) {
        assistantContent = `IMAGE GENERATION ERROR: ${result.error}`
        finalMessageType = 'text'
      } else if (!assistantContent && finalMessageType === 'text' && !result.error) {
        assistantContent = "CHLOE WASN'T RESPONDING"
      } else if (!assistantContent && !result.error) {
        assistantContent = "CHLOE WASN'T RESPONDING."
        finalMessageType = 'text'
      }


      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== TEXT_LOADING_ID && msg.id !== IMAGE_LOADING_ID),
        {
          role: 'assistant',
          type: finalMessageType,
          content: assistantContent,
          id: `assistant-${Date.now()}`
        }
      ])

      if (result.newConversationId && finalMessageType === 'text') {
        setConversationId(result.newConversationId)
      } else if (result.conversationId && finalMessageType === 'text' && !result.newConversationId) {
        setConversationId(result.conversationId)
      }

    } catch (err) {
      console.error("Unexpected error in handleSendPrompt:", err)
      const unexpectedErrorMessage = `AN UNEXPECTED ERROR OCCURRED: ${err.message}`
      setError(unexpectedErrorMessage)
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID && msg.id !== newUserMessage.id),
        { role: 'assistant', type: 'text', content: unexpectedErrorMessage, id: `error-critical-${Date.now()}` }
      ])
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
        <Input onSubmit={handleSendPrompt} isLoading={isLoading} />
      </div>
    </div>
  )
}