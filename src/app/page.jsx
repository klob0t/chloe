'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'
import Input from '@/app/component/input'
import Chats from '@/app/component/chats'
import { handleSubmit } from '@/app/utils/request'

const LOADING_MESSAGE_ID = 'assistant-loading-placeholder'

export default function Main() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('') 
  const chatWindowRef = useRef(null)
  const containerRef = useRef(null)
  const [conversationId, setConversationId] = useState(null)

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
  const handleSendPrompt = async (promptText) => {
    if (!promptText || !promptText.trim()) {
      return
    }
    setError('') 
    const currentMessageHistoryForApi = [...messages]
    const newUserMessage = { role: 'user', content: promptText, id: `user-${Date.now()}` } 
    setMessages(prevMessages => [
      ...prevMessages,
      newUserMessage,
      { role: 'assistant', type: 'loading', id: LOADING_MESSAGE_ID, content: '' }
    ])
    setIsLoading(true)

    try {

      const result = await handleSubmit(promptText, currentMessageHistoryForApi, conversationId)

      console.log("API Result (inside handleSendPrompt):", result) 
      if (result.type === 'validation') {
        setMessages(prevMessages => [
          ...prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID), 
          { role: 'assistant', content: result.error, id: `error-validation-${Date.now()}`, type: 'text' }
        ])
        return 
      }

      if (result.type === 'api') {
        setMessages(prevMessages => [
          ...prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID), 
          { role: 'assistant', type: 'text', content: result.error || 'An API error occurred.', id: `error-api-${Date.now()}` }
        ])
        setError(result.error || 'An API error occurred.')
        return
      }
      let assistantContent = result.answer
      let finalMessageType = result.messageType

      if (result.messageType === 'image' && result.error) {
        assistantContent = result.error
        finalMessageType = 'text'
      } else if (!assistantContent && finalMessageType === 'text' && !result.error) {
         assistantContent = "Received an empty response."
      } else if (!assistantContent && !result.error) {
         assistantContent = "No content received."
         finalMessageType = 'text'
      }


      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID),
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
      const unexpectedErrorMessage = err.message || 'An unexpected error occurred in the application.'
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