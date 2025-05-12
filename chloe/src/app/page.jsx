'use client'
import { useState, useEffect, useRef, use } from 'react'
import styles from './page.module.css'
import Input from '@/app/component/input'
import Chats from '@/app/component/chats'
import { sendPayload } from '@/app/utils/request'

const LOADING_MESSAGE_ID = 'assistant-loading=placeholder'

export default function Main() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState([])
  const chatWindowRef = useRef(null)
  const [conversationId, setConversationId] = useState(null)
  const [isReady, setIsReady] = useState([])


  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      { role: 'assistant', type:'loading', id: LOADING_MESSAGE_ID, content: ''}])
    setIsLoading(true)

    try {
      const payloadToNextApi = {
        currentPrompt: promptText,
        messageHistory: currentMessageHistoryForApi,
        conversationId: conversationId
      }
      const apiResponse = await sendPayload(payloadToNextApi)

      if (apiResponse.thinking) {
        console.log(apiResponse.thinking)
      }

      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID), 
        
        { role: 'assistant', content: apiResponse.answer, id : `assistant-${Date.now()}` }])

      if (apiResponse.conversationId) {
        setConversationId(apiResponse.newConversationId)
        console.log('UPDATED CONVERSATION ID', apiResponse.newConversationId)
      }

    } catch (err) {
      setError(err.message || "THIS IS UNEXPECTED")
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== LOADING_MESSAGE_ID && msg.id !== newUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.mainContainer}>
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