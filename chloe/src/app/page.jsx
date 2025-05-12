'use client'
import { useState, useEffect, useRef} from 'react'
import styles from './page.module.css'
import Input from '@/app/component/input'
import Chats from '@/app/component/chats'
import { parseAssistantMessage, sendPrompt } from '@/app/utils/request'
import { sendPayload } from '@/app/utils/request'

export default function Main() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState ([])
  const chatWindowRef = useRef(null)
  const [conversationId, setConversationId] = useState(null)

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

  setMessages(prevMessages => [...prevMessages, newUserMessage])
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

    setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: apiResponse.answer}])

    if(apiResponse.conversationId) {
      setConversationId(apiResponse.newConversationId)
      console.log('UPDATED CONVERSATION ID')
    }

  } catch (err) {
    setError(err.message || "THIS IS UNEXPECTED")
  } finally {
    setIsLoading(false)
  }
}

  return(
    <div className={styles.mainContainer}>
      <div className={styles.chatWindow} ref={chatWindowRef}>
        <div className={styles.loadingSpinner}></div>
        <Chats messages={messages} />
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <div className={styles.inputContainer}>
        <Input onSubmit={handleSendPrompt} isLoading={isLoading} />
      </div>
    </div>
  )
}