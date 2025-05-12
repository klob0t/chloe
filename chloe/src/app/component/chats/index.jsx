'use client'
import styles from './page.module.css'
import Markdown from 'markdown-to-jsx'
import Welcome from '@/app/component/welcome'
import { useEffect, useState } from 'react'
import gsap from 'gsap'

function AnimatedMessageContent({ message }) {
   const [displayedContent, setDisplayedContent] = useState('')
   const loadingChars = ['\\', '|', '/', '—']
   const [currentSpinnerChar, setCurrentSpinnerChar] = useState(loadingChars[0]);

   useEffect(() => {
      const contentToAnimate = (message.type !== 'loading' && typeof message.content === 'string') ? message.content : ''

      let progress = { value: 0 }
      setDisplayedContent('')

      const ctx = gsap.context(() => {
         if (contentToAnimate) {
            gsap.to(progress, {
               value: contentToAnimate.length,
               duration: contentToAnimate.length * 0.04,
               ease: 'sine.out',
               onUpdate: () => {
                  setDisplayedContent(contentToAnimate.substring(0, Math.floor(progress.value)))
               },
               onComplete: () => {
                  setDisplayedContent(contentToAnimate)
               },
            })
         } else {
            setDisplayedContent('')
         }
      })

      return () => {
         ctx.revert()
      }
   }, [message.content, message.type])


   useEffect(() => {
      let intervalId;
      if (message.type === 'loading') {
         let charIndex = 0;
         intervalId = setInterval(() => {
            charIndex = (charIndex + 1) % loadingChars.length;
            setCurrentSpinnerChar(loadingChars[charIndex]);
         }, 100); // Adjust spinner speed (ms)
      }
      return () => clearInterval(intervalId); // Cleanup interval
   }, [message.type]);

   if (message.type === 'loading') {
      return <span className={styles.spinner}>{currentSpinnerChar}</span>
   }

   return (
      <>
         <Markdown>{displayedContent}</Markdown>
      </>
   )

}

export default function Chats({ messages }) {
   if (!messages || messages.length === 0) {
      return <Welcome />
   }

   return (
      <div className={styles.messages}>
         {messages.map((msg, index) => (
            <div
               key={msg.id || index}
               className={`${styles.message} ${styles[msg.role]}`}
            >
               <div>{msg.role === 'user' ? '$ ' : '> '}</div>
               <div className={styles.messageContent}>
                  <AnimatedMessageContent message={msg} />
               </div>
            </div>
         ))}
      </div>
   )
}