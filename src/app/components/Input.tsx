'use client'
import { useState, useRef, useEffect, useCallback, KeyboardEvent, ChangeEvent } from 'react'
import styles from './input.module.css'
import { useChatStore } from '@/app/lib/store/chat'
import { useRouter, usePathname } from 'next/navigation'
import { IoMdArrowUp } from 'react-icons/io'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

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

   const { contextSafe } = useGSAP({ scope: inputRef })
   const flashInput = contextSafe(() => {
      const target = inputRef.current
      if (!target) return

      const baseColor = getComputedStyle(target).getPropertyValue('background-color') || 'var(--background-darker)'                                                           

    gsap.timeline()                                                                                                                      
      .to(target, {                                                                                                                      
        backgroundColor: 'var(--text-light)',
        duration: 0.02,                                                                                                                  
        ease: 'power1.inOut',                                                                                                            
      })                                                                                                                                 
      .to(target, {                                                                                                                      
        backgroundColor: baseColor,                                                                                                      
        duration: 0.18,                                                                                                                  
        ease: 'power1.inOut',                                                                                                            
      })                                                                                                                                 
      .repeat(1)         // repeat the two-step sequence once => two blinks total                                                        
  })     

   useEffect(() => {
      const element = inputRef.current
      if (!element) {
         return
      }

      element.style.height = 'auto'
      element.style.height = `${element.scrollHeight}px`
   }, [inputValue])

   const ensureActiveConversation = useCallback(() => {
      const onChatRoute = pathname.startsWith('/chat/')
      const segments = pathname.split('/').filter(Boolean)
      const pathConversationId = onChatRoute && segments.length >= 2 ? segments[1] : null

      if (!onChatRoute || !pathConversationId) {
         const newConversationId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
         clearMessages()
         setCurrentConversationId(newConversationId)
         router.push(`/chat/${newConversationId}`)
         return newConversationId
      }

      if (currentConversationId !== pathConversationId) {
         setCurrentConversationId(pathConversationId)
      }

      return pathConversationId
   }, [clearMessages, currentConversationId, pathname, router, setCurrentConversationId])

   const sendContent = useCallback(() => {
      const content = inputValue.trim()
      if (!content || isLoading) {
         return
      }

      ensureActiveConversation()
      flashInput()

      setInputValue('')

      requestAnimationFrame(() => {
         inputRef.current?.focus()
      })

      const send = onSendMessage ? onSendMessage : sendMessage
      void Promise.resolve(send(content)).catch(error => {
         console.error('Failed to send message', error)
      })
   }, [ensureActiveConversation, inputValue, isLoading, onSendMessage, sendMessage, flashInput])

   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault()
         sendContent()
         flashInput()

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
                  <IoMdArrowUp />
               </button>
            </div>

            {/* <div className={styles.hints}>
               <span className={styles.hint}>Type /imagine to generate image</span>
               <span className={styles.hint}>Press Enter to send · Shift+Enter for newline</span>

            </div> */}

         </div>
         <div className={styles.disclaimer}>
            Chloe might make mistakes... please double-check the fact.
         </div>
      </div>
   )
}
