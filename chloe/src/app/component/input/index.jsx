'use client'
import { useState, useRef } from 'react'
import styles from './page.module.css'

export default function Input({ onSubmit, isLoading }) {
  const [currentText, setCurrentText] = useState('')
  const inputRef = useRef(null)

  const handleInput = (e) => {
    setCurrentText(e.currentTarget.innerText)
  }

  const performSubmit = () => {
    if (!currentText.trim()) return
    onSubmit(currentText)

    setCurrentText('')
    if (inputRef.current) {
      inputRef.current.innerText = ''
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      performSubmit()
    }
  }

  return (
    <div className={styles.inputContainer}>
    <div
      ref={inputRef}
      className={styles.inputArea}
      contentEditable={!isLoading}
      spellCheck='false'
      onInput={handleInput}
      onKeyDown={handleKeyPress}
      role='textbox'
    />
    </div>
  )
}