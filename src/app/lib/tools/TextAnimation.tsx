import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useState } from 'react'
import Markdown from 'react-markdown'

interface TextAnimationProps {
  text: string
  delay?: number
  duration?: number
  className?: string
}

export default function TextAnimation({
  text,
  delay = 0,
  duration = 0.03,
  className = ""
}: TextAnimationProps) {
  const [displayedContent, setDisplayedContent] = useState('')

  useGSAP(() => {
    if (!text) return

    const words = text.split(/(\s+)/)
    const elementsCount = words.filter(word => word.trim() !== '').length
    setDisplayedContent('')

    const ctx = gsap.context(() => {
      if (text) {
        gsap.to({ value: 0 }, {
          value: words.length,
          duration: elementsCount * duration,
          ease: 'none',
          delay: delay,
          onUpdate: function () {
            setDisplayedContent(words.slice(0, Math.floor(this.targets()[0].value)).join(''))
          },
          onComplete: () => {
            setDisplayedContent(text)
          }
        })
      }
    })
    return () => ctx.revert()
  }, { dependencies: [text] })

  return (
    <div className={className}>
      {displayedContent ? <Markdown>{displayedContent}</Markdown> : null}
    </div>
  )
}