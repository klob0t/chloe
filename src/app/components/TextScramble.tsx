'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'

type ScrambleQueueItem = {
  from: string
  to: string
  startFrame: number
  endFrame: number
  tempChar?: string
}

type TextScrambleProps = React.HTMLAttributes<HTMLElement> & {
  phrases?: string[]
  text?: string | null
  as?: 'span' | 'p' | 'div'
  loop?: boolean
  holdDuration?: number
}

const DEFAULT_PHRASES = ['klob0t', 'Airlangga']
const scrambleChars = '!-_\\/=+*^?'

const getRandomChar = (): string =>
  scrambleChars[Math.floor(Math.random() * scrambleChars.length)] ?? ''

const buildQueue = (from: string, to: string): ScrambleQueueItem[] => {
  const maxLength = Math.max(from.length, to.length)
  const queue: ScrambleQueueItem[] = []

  for (let i = 0; i < maxLength; i++) {
    const fromChar = from[i] ?? ''
    const toChar = to[i] ?? ''
    const startFrame = Math.floor(Math.random() * 40)
    const endFrame = startFrame + Math.floor(Math.random() * 40)
    queue.push({ from: fromChar, to: toChar, startFrame, endFrame })
  }

  return queue
}

export function TextScramble({
  phrases = DEFAULT_PHRASES,
  text,
  as: Element = 'span',
  className,
  loop = true,
  holdDuration = 2000,
  ...rest
}: TextScrambleProps) {
  const phraseList = useMemo(
    () => (phrases.length > 0 ? phrases : DEFAULT_PHRASES),
    [phrases]
  )
  const phraseCount = phraseList.length
  const hasTargetText = text !== undefined && text !== null
  const initialString = hasTargetText ? text ?? '' : phraseList[0] ?? ''

  const [displayedText, setDisplayedText] = useState(() => initialString.split(''))
  const [phraseIndex, setPhraseIndex] = useState(0)

  const displayedTextRef = useRef(displayedText)
  const queueRef = useRef<ScrambleQueueItem[]>([])
  const frameRef = useRef(0)
  const animationFrameIdRef = useRef<number | null>(null)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    displayedTextRef.current = displayedText
  }, [displayedText])

  const cancelAnimation = useCallback(() => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
  }, [])

  const clearHoldTimeout = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
  }, [])

  const startScramble = useCallback(
    (targetText: string, onComplete?: () => void) => {
      const nextText = targetText ?? ''
      const currentText = displayedTextRef.current.join('')

      if (currentText === nextText) {
        onComplete?.()
        return
      }

      cancelAnimation()
      clearHoldTimeout()

      const queue = buildQueue(currentText, nextText)
      queueRef.current = queue
      frameRef.current = 0

      if (queue.length === 0) {
        setDisplayedText(() => {
          const chars = nextText.split('')
          displayedTextRef.current = chars
          return chars
        })
        onComplete?.()
        return
      }

      const step = () => {
        const frame = frameRef.current
        let completedChars = 0

        const updatedText = queueRef.current.map(item => {
          if (frame >= item.endFrame) {
            completedChars++
            return item.to
          }

          if (frame >= item.startFrame) {
            const newTempChar =
              !item.tempChar || Math.random() < 0.28 ? getRandomChar() : item.tempChar
            item.tempChar = newTempChar
            return newTempChar
          }

          return item.from
        })

        if (completedChars === queueRef.current.length) {
          const finalChars = queueRef.current.map(item => item.to)
          setDisplayedText(() => {
            displayedTextRef.current = finalChars
            return finalChars
          })
          animationFrameIdRef.current = null
          onComplete?.()
          return
        }

        setDisplayedText(() => {
          displayedTextRef.current = updatedText
          return updatedText
        })

        frameRef.current++
        animationFrameIdRef.current = requestAnimationFrame(step)
      }

      animationFrameIdRef.current = requestAnimationFrame(step)
    },
    [cancelAnimation, clearHoldTimeout]
  )

  useEffect(() => {
    if (!hasTargetText) {
      return
    }

    startScramble(text ?? '')
  }, [hasTargetText, text, startScramble])

  useEffect(() => {
    if (hasTargetText || phraseCount === 0) {
      return undefined
    }

    const target = phraseList[phraseIndex % phraseCount] ?? ''
    startScramble(target, () => {
      if (!loop || phraseCount === 0) {
        return
      }

      holdTimeoutRef.current = setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % phraseCount)
      }, holdDuration)
    })

    return () => {
      clearHoldTimeout()
    }
  }, [hasTargetText, phraseIndex, phraseList, phraseCount, loop, holdDuration, startScramble, clearHoldTimeout])

  useEffect(() => {
    if (!hasTargetText) {
      setDisplayedText((phraseList[0] ?? '').split(''))
      setPhraseIndex(0)
    }
  }, [phraseList, hasTargetText])

  useEffect(() => {
    return () => {
      cancelAnimation()
      clearHoldTimeout()
    }
  }, [cancelAnimation, clearHoldTimeout])

  return (
    <Element className={className} {...rest}>
      {displayedText.map((char, index) => (
        <span
          key={index}
          style={{
            fontFamily: 'var(--font-geist-mono)'
          }}
        >
          {char}
        </span>
      ))}
    </Element>
  )
}
