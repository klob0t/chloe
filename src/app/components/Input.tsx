'use client'
import { useState, useRef, useEffect, useCallback, KeyboardEvent, ChangeEvent } from 'react'
import styles from './input.module.css'
import { useChatStore } from '@/app/lib/store/chat'
import { useRouter, usePathname } from 'next/navigation'
import { FiSend } from 'react-icons/fi'

interface InputProps {
   onSendMessage?: (content: string) => Promise<void>
}

export default function Input({ onSendMessage }: InputProps) {
   const [inputValue, setInputValue] = useState('')
   const sendMessage = useChatStore(state => state.sendMessage)
   const isLoading = useChatStore(state => state.isLoading)
   const currentConversationId = useChatStore(state => state.currentConversationId)
   const setCurrentConversationId = useChatStore(state => state.setCurrentConversationId)
   const clearMessages = useChatStore(state => state.clearMessages)
   const inputRef = useRef<HTMLTextAreaElement>(null)
   const router = useRouter()
   const pathname = usePathname()

   useEffect(() => {
      const element = inputRef.current
      if (!element) {
         return
      }

      element.style.height = 'auto'
      element.style.height = `${element.scrollHeight}px`
   }, [inputValue])

   const ensureActiveConversation = useCallback(() => {
      const pathConversationId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null
      let nextConversationId = currentConversationId ?? pathConversationId

      if (!nextConversationId) {
         nextConversationId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
         clearMessages()
         setCurrentConversationId(nextConversationId)
      } else if (currentConversationId !== nextConversationId) {
         setCurrentConversationId(nextConversationId)
      }

      if (nextConversationId && pathname !== `/chat/${nextConversationId}`) {
         router.push(`/chat/${nextConversationId}`)
      }

      return nextConversationId
   }, [clearMessages, currentConversationId, pathname, router, setCurrentConversationId])

   const sendContent = useCallback(() => {
      const content = inputValue.trim()
      if (!content || isLoading) {
         return
      }

      ensureActiveConversation()

      setInputValue('')

      requestAnimationFrame(() => {
         inputRef.current?.focus()
      })

      const send = onSendMessage ? onSendMessage : sendMessage
      void Promise.resolve(send(content)).catch(error => {
         console.error('Failed to send message', error)
      })
   }, [ensureActiveConversation, inputValue, isLoading, onSendMessage, sendMessage])

   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault()
         sendContent()
      }
   }

   const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value)
   }

   return (
      <div className={styles.inputWrapper}>
         <div
            className={styles.inputContainer}
         >
            <div className={styles.inputRow}>
               <textarea
                  ref={inputRef}
                  spellCheck={false}
                  rows={1}
                  value={inputValue}
                  disabled={isLoading}
                  placeholder="Ask Chloe anything..."
                  aria-label="Chat prompt input"
                  className={styles.inputArea}
                  onKeyDown={handleKeyDown}
                  onChange={handleChange}
               />
               <button
                  type="button"
                  className={styles.sendButton}
                  onClick={sendContent}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send message"
               >
                  <FiSend />
               </button>
            </div>
            <span className={styles.hint}>Press Enter to send · Shift+Enter for newline</span>
         </div>
         <div className={styles.disclaimer}>
            Chloe might make mistakes... please double-check the fact.
         </div>
      </div>
   )
}
