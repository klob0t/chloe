'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'
import Input from '@/app/component/input'
import Chats from '@/app/component/chats'
import { handleSubmit } from '@/app/utils/request'

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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
  

  
  const handleSendPrompt = async (textPrompt) => {
    if (!textPrompt || !textPrompt.trim()) {
      return
    }

    const currentMessageHistoryForApi = [...messages]
    setError('')

    const newUserMessage = { role: 'user', content: textPrompt, id: `user-${generateId()}` }

    const assistantPlaceholderId = `assistant-${generateId()}`
    let placeholderType
    let imagePrompt


    if (textPrompt.toLowerCase().startsWith('/imagine ')) {
      imagePrompt = textPrompt.substring(8).trim()
      placeholderType = 'image-loading'
    } else {
      placeholderType = 'text-loading'
    }

    setMessages(prevMessages => [
      ...prevMessages,
      newUserMessage,
      { role: 'assistant', type: placeholderType, id: assistantPlaceholderId, content: '' }
    ])

    setIsLoading(true)

    try {

      const result = await handleSubmit(textPrompt, imagePrompt, currentMessageHistoryForApi, conversationId)

      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.id === assistantPlaceholderId) {
            let finalContent = result.answer
            let finalType = result.messageType

            if (result.type === 'validation') {
              finalContent = result.error
              finalType = 'text'
            } else if (result.type === 'api') {
              finalContent = result.error || 'AN API ERROR OCCURRED'
              finalType = 'text'
              setError(finalContent)
            } else if (result.messageType === 'image' && result.error) {
              finalContent = `IMAGE GENERATION ERROR: ${result.error}`
              finalType = 'text'
            } else if (!finalContent && !result.error) {
              finalContent = 'CHLOE CANT REACH THE SERVER AT THE MOMENT'
              finalType = 'text'
            }

            return {
              ...msg,
              type: finalType,
              content: finalContent
            }
          }
          return msg
        })
      )

      if (result.messageType === 'text' && !result.error) {
        if (result.newConversationId) {
          setConversationId(result.newConversationId)
        } else if (result.conversationId) {
          setConversationId(result.conversationId)
        }
      }
    } catch (err) {
      console.error('UNEXPECTED ERROR IN handleSendPrompt: ', err)
      const unexpectedErrorMessage = `AN UNEXPECTED ERROR OCCURRED:  ${err.message || String(err)}`
      setError(unexpectedErrorMessage)
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === assistandPlaceholderId
            ? { ...msg, type: 'text', content: unexpectedErrorMessage }
            : msg
        )
      )
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