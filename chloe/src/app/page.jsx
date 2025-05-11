'use client'
import { useState, useEffect, useRef} from 'react'
import styles from './page.module.css'
import Input from '@/app/component/input'
import Chats from '@/app/component/chats'
import { parseAssistantMessage, sendPrompt } from '@/app/utils/request'

export default function Main() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState ([])
  const chatWindowRef = useRef(null)

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

  setMessages(prevMessages => [...prevMessages, newUserMessage])
  setIsLoading(true)

  try {
    const rawAssistantResponse = await sendPrompt(promptText)

    const { thinking, answer } =parseAssistantMessage(rawAssistantResponse)

    if (thinking) {
      console.log(thinking)
    }

    setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: answer}])
  } catch (err) {
    setError(err.message || "THIS IS UNEXPECTED")
  } finally {
    setIsLoading(false)
  }
}

  return(
    <div className={styles.mainContainer}>
      <div className={styles.chatWindow} ref={chatWindowRef}>
        {isLoading }<div className={styles.loadingSpinner}></div>
        <Chats messages={messages} />
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <div className={styles.inputContainer}>
        <Input onSubmit={handleSendPrompt} isLoading={isLoading} />
      </div>
    </div>
  )
}