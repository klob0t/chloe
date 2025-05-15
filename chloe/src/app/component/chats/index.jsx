'use client'
import styles from './page.module.css'
import Markdown from 'markdown-to-jsx'
import Welcome from '@/app/component/welcome'
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import ImageReveal from '@/app/utils/imageReveal'

function AnimatedMessageContent({ message, messageKey }) {
   const [displayedContent, setDisplayedContent] = useState('')
   const loadingChars = ['\\', '|', '/', '—']
   const [currentSpinnerChar, setCurrentSpinnerChar] = useState(loadingChars[0]);

   const markdownOptions = {
      wrapper: 'article',
   }

   useEffect(() => {
      const isTextType = message.type !== 'loading' && message.type !== 'image'
      const contentToAnimate = (isTextType && typeof message.content === 'string') ? message.content : ''

      // console.log(`Effect run: type=${message.type}, typeof message.content=${typeof message.content}, contentToAnimate=`, JSON.stringify(contentToAnimate), typeof contentToAnimate);

      if (!isTextType) {
         setDisplayedContent( (message.type === 'image' && typeof message.content === 'string') ? message.content : '')
         return
      }

      setDisplayedContent('')

      const ctx = gsap.context(() => {
         if (contentToAnimate) {
            gsap.to({ value: 0 }, {
               value: contentToAnimate.length,
               duration: contentToAnimate.length * 0.01,
               ease: 'sine.out',
               onUpdate: function () {
                  setDisplayedContent(contentToAnimate.substring(0, Math.floor(this.targets()[0].value)))
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
      return <span className={styles.spinner}>{currentSpinnerChar}</span>
   }

   if (message.type === 'image' && typeof message.content === 'string') {
      const markdownImageRegex = /!\[(.*?)\]\((.*?)\)/
      const match = message.content.match(markdownImageRegex)

      if (match && match[2]) {
         const altText = match[1] || 'Generated Image'
         const imageUrl = match[2]
         return <ImageReveal imageUrl={imageUrl} altText={altText} />
      } else {
         console.warn('MSG TYPE IS IMAGE BUT NO VALID CONTENT', message.content)
         return <Markdown >{message.content || 'ERROR: INVALID IMAGE DATA'}</Markdown>
      }
   }

   return (
      <>
         <Markdown options={markdownOptions}>{displayedContent}</Markdown>
      </>
   )

}

export default function Chats({ messages }) {
   if (!messages || messages.length === 0) {
      return <Welcome />
   }

   return (
      <div className={styles.chatsContainer}>
         <div className={styles.messages}>
            {messages.map((msg, index) => (
               <div
                  key={msg.id || index}
                  className={`${styles.message} ${styles[msg.role]}`}
               >
                  <div className={styles[`role-${msg.role}`]}>{msg.role === 'user' ? '<' : '>'}</div>
                  <div className={styles[`msgContent-${msg.role}`]}>
                     <AnimatedMessageContent message={msg} />
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}