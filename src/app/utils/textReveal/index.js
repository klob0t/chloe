'use client'
import { useEffect, useState } from 'react'
import Markdown from 'markdown-to-jsx'
import gsap from 'gsap'
import styles from './page.module.css'
import ImageReveal from '@/app/utils/imageReveal'

export default function TextReveal({ message, messageKey }) {
    const [displayedContent, setDisplayedContent] = useState('')
    const loadingChars = ['\\', '|', '/', '—']
    const [currentSpinnerChar, setCurrentSpinnerChar] = useState(loadingChars[0]);

    const markdownOptions = {
        wrapper: 'article',
    }

    useEffect(() => {
        const isTextType = message.type !== 'loading' && message.type !== 'image'
        const contentToAnimate = (isTextType && typeof message.content === 'string') ? message.content : ''

        if (!isTextType) {
            setDisplayedContent( (message.type === 'image' && typeof message.content === 'string') ? message.content : '')
            return
        }

        const words = contentToAnimate.split(/(\s+)/)
        const elementsCount = words.filter(word => word.trim() !== '').length

        setDisplayedContent('')

        const ctx = gsap.context(() => {
            if (contentToAnimate) {
                gsap.to({ value: 0 }, {
                    value: words.length,
                    duration: elementsCount * 0.03,
                    ease: 'none',
                    onUpdate: function () {
                        const currentWordIndex = Math.floor(this.targets()[0].value)
                        setDisplayedContent(words.slice(0, currentWordIndex).join(""))
                    },
                    onComplete: () => {
                        setDisplayedContent(contentToAnimate)
                    }
                })
            }
        })
        return () => ctx.revert()
    }, [message.content, message.type])

    useEffect(() => {
        let intervalId;
        if (message.type === 'loading') {
            let charIndex = 0
            intervalId = setInterval(() => {
                charIndex = (charIndex + 1) % loadingChars.length
                setCurrentSpinnerChar(loadingChars[charIndex])
            }, 100)
        }
        return () => clearInterval(intervalId)
    }, [message.type])

    if (message.type === 'loading') {
        return <span className={styles && styles.spinner ? styles.spinner : 'default-spinner-class'}>{currentSpinnerChar}</span>
    }

    if (message.type === 'image' && typeof message.content === 'string') {
        // const markdownImageRegex = /!\[(.*?)\]\((.*?)\)/
        // const match = message.content.match(markdownImageRegex)
        // console.log(match)
        return <ImageReveal imageUrl={message.content}/>

        // if (match && match[2]) {
        //     const altText = match[1] || 'Generated Image'
        //     const imageUrl = match[2]
        //     return <ImageReveal imageUrl={message.content} altText={altText} />
        // } else {
        //     console.warn('MSG TYPE IS IMAGE BUT NO VALID CONTENT', message.content)
        //     return <Markdown >{message.content || 'ERROR: INVALID IMAGE DATA'}</Markdown>
        // }
    }

    return (
        <>
            <Markdown options={markdownOptions}>{displayedContent}</Markdown>
        </>
    )
}