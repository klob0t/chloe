'use client'
import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react'
import styles from './input.module.css'
import { useChatStore } from '@/app/lib/store/chat'

interface InputProps {
   onSendMessage?: (content: string) => Promise<void>
}

export default function Input({ onSendMessage }: InputProps) {
   const [inputValue, setInputValue] = useState('')
   const { sendMessage, isLoading } = useChatStore()
   const inputRef = useRef<HTMLDivElement>(null)

   const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault()
         const content = inputValue.trim()
         if (content && !isLoading) {
            if (onSendMessage) {
               onSendMessage(content)
            } else {
               sendMessage(content)
            }
            setInputValue('')
            if (inputRef.current) {
               inputRef.current.innerText = ''
            }
         }
      }
   }

   const handleInput = (e: ChangeEvent<HTMLDivElement>) => {
      const content = e.currentTarget.innerText || ''
      setInputValue(content)
   }

   const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text/plain')
      document.execCommand('insertText', false, text)
   }

   return (
      <div className={styles.inputWrapper}>
         <div
            ref={inputRef}
            spellCheck={false}
            role="textbox"
            contentEditable={true}
            aria-multiline={true}
            className={styles.inputArea}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onPaste={handlePaste}
            suppressContentEditableWarning={true}
         />
         <div className={styles.disclaimer}>
            Chloe might make mistakes... please double-check the fact.
         </div>
      </div>
   )
}