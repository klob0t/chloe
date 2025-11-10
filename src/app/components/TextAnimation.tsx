import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useEffect, useRef, useState } from 'react'
import Markdown, { type MarkdownToJSX } from 'markdown-to-jsx'

interface TextAnimationProps {
  text: string
  delay?: number
  duration?: number
  className?: string
  animationKey?: number
  markdownOptions?: MarkdownToJSX.Options
}

export default function TextAnimation({
  text,
  delay = 0,
  duration = 0.03,
  className = "",
  animationKey = 0,
  markdownOptions
}: TextAnimationProps) {
  const [displayedContent, setDisplayedContent] = useState(() => (animationKey <= 0 ? text : ''))
  const animationRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    return () => {
      animationRef.current?.kill()
      animationRef.current = null
    }
  }, [])

  useGSAP(() => {
    animationRef.current?.kill()
    animationRef.current = null

    if (!text) {
      setDisplayedContent('')
      return
    }

    if (animationKey <= 0) {
      setDisplayedContent(text)
      return
    }

    const words = text.split(/(\s+)/)
    const elementsCount = words.filter(word => word.trim() !== '').length

    if (elementsCount === 0) {
      setDisplayedContent(text)
      return
    }

    setDisplayedContent('')

    const proxy = { value: 0 }

    animationRef.current = gsap.to(proxy, {
      value: words.length,
      duration: elementsCount * duration,
      ease: 'none',
      delay: delay,
      onUpdate: () => {
        setDisplayedContent(words.slice(0, Math.floor(proxy.value)).join(''))
      },
      onComplete: () => {
        setDisplayedContent(text)
      }
    })

    return () => {
      animationRef.current?.kill()
      animationRef.current = null
    }
  }, { dependencies: [text, animationKey, delay, duration] })

  return (
    <div className={className}>
      {displayedContent
        ? <Markdown options={markdownOptions}>{displayedContent}</Markdown>
        : null}
    </div>
  )
}
