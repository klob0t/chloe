'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './page.module.css'
import gsap from 'gsap'

export default function Input({ onSubmit, isLoading, mainAnim }) {
  const [currentText, setCurrentText] = useState('')
  const inputRef = useRef(null)
  const customCaretRef = useRef(null)
  const effectRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      if (document.activeElement !== inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [isLoading])

  const updateCaretPosition = useCallback(() => {

    if (!inputRef.current || !customCaretRef.current) {
      return
    }

    if (isLoading) {
      if (customCaretRef.current) customCaretRef.current.style.opacity = '0'
      return
    }

    const inputElement = inputRef.current
    const caretElement = customCaretRef.current
    const currentLocalInnerText = inputElement.innerText
    const inputDivStyle = window.getComputedStyle(inputElement)
    const inputDivRect = inputElement.getBoundingClientRect()

    let caretX, caretY
    let finalTop

    const firstCharVisualOffsetX = 1.5
    const firstCharVisualOffsetY = 1.5

    if (currentLocalInnerText.trim().length === 0) {

      const paddingTop = parseFloat(inputDivStyle.paddingTop) || 0
      const paddingLeft = parseFloat(inputDivStyle.paddingLeft) || 0
      const scrollTop = inputElement.scrollTop
      const scrollLeft = inputElement.scrollLeft

      caretX = (paddingLeft + scrollLeft) + firstCharVisualOffsetX
      caretY = (paddingTop + scrollTop) + firstCharVisualOffsetY
      finalTop = caretY

      caretElement.style.left = `${caretX}px`
      caretElement.style.top = `${finalTop}px`
      caretElement.style.opacity = '1'

    } else {

      const selection = window.getSelection()

      if (!selection || selection.rangeCount === 0) {

        if (caretElement) caretElement.style.opacity = '0'
        return
      }

      const range = selection.getRangeAt(0)

      if (!inputElement.contains(range.commonAncestorContainer) && inputElement !== range.commonAncestorContainer) {

        if (caretElement) caretElement.style.opacity = '0'
        return
      }

      let rect = range.getBoundingClientRect()


      if (rect.top === 0 && rect.left === 0 && inputDivRect.top !== 0) {

      }

      caretX = rect.left - inputDivRect.left + inputElement.scrollLeft
      caretY = rect.top - inputDivRect.top + inputElement.scrollTop

      if (range.startOffset > 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
        caretX -= 12
      }

      finalTop = caretY

      caretElement.style.left = `${caretX}px`
      caretElement.style.top = `${finalTop}px`
      caretElement.style.opacity = '1'
    }
  }, [isFocused, isLoading])

  useEffect(() => {
    if (!isLoading) {
      setTimeout(updateCaretPosition, 0)
    }
  }, [currentText, isLoading, updateCaretPosition])

  const handleInput = (e) => {
    setCurrentText(e.currentTarget.innerText)
  }

  const performSubmit = () => {
    if (!currentText.trim() || isLoading) return
    onSubmit(currentText)

    setCurrentText('')
    if (inputRef.current) {
      inputRef.current.innerText = ''
      if (document.activeElement === inputRef.current) {
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(inputRef.current)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        updateCaretPosition()
      } else {
        updateCaretPosition()
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      const inputElement = effectRef.current
      if (!inputElement) return
      performSubmit()

      const opacity1 = '1';

      const tl = gsap.timeline()

      tl.to(inputElement, {
        opacity: opacity1,
        duration: 0.1,
        ease: 'none',
        repeat: 2,
        onComplete: () => {
          gsap.set(inputElement, { clearProps: 'opacity' })
        }
      })
    }
  }

  const handleFocus = () => {
    if (!isLoading) {
      setIsFocused(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  useEffect(() => {
    const currentInputRef = inputRef.current
    if (!isFocused || isLoading) {
      if (customCaretRef.current) {
        customCaretRef.current.style.opacity = '0'
      }
      return
    }

    if (currentInputRef) {
      const eventHandler = () => setTimeout(updateCaretPosition, 0)

      updateCaretPosition()
      const timeoutId = setTimeout(updateCaretPosition, 0)

      document.addEventListener('selectionchange', eventHandler)
      currentInputRef.addEventListener('keyup', eventHandler)
      currentInputRef.addEventListener('click', eventHandler)
      currentInputRef.addEventListener('input', eventHandler)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('selectionchange', eventHandler)
        if (currentInputRef) {
          currentInputRef.removeEventListener('keyup', eventHandler)
          currentInputRef.removeEventListener('click', eventHandler)
          currentInputRef.removeEventListener('input', eventHandler)
        }
      }
    }
  }, [isFocused, isLoading, updateCaretPosition])

  useEffect(() => {
    if (isFocused && !isLoading) {
      setTimeout(updateCaretPosition, 0)
    }
  }, [currentText, isFocused, isLoading, updateCaretPosition])


  return (
    <div
      className={`${styles.inputContainer} ${isLoading ? styles.disabled : ''}`}
    >
      {!isLoading && <span ref={customCaretRef} className={styles.customCaret}></span>}
      <div
        className={styles.inputEffect}
        ref={effectRef}
      />
      <div
        ref={inputRef}
        className={styles.inputArea}
        contentEditable={!isLoading}
        spellCheck='false'
        onInput={handleInput}
        onKeyDown={handleKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        role='textbox'
        aria-multiline="true"
      />

      <div className={styles.disclaimWrapper}>
        <span className={styles.disclaimerText}>chloe may make mistakes... double-check it.</span>
      </div>
    </div>
  )
}