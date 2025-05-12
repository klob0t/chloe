'use client'
import styles from './page.module.css'
import Markdown from 'markdown-to-jsx'
import { useEffect, useState } from 'react'
import gsap from 'gsap'

function AnimatedMessageContent({ fullContent }) {
   const [displayedContent, setDisplayedContent] = useState('')
   useEffect(() => {
      const contentToAnimate = typeof fullContent === 'string' ? fullContent : ''
      
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
   }, [fullContent])

   const isTyping = displayedContent.length < (typeof fullContent === 'string' ? fullContent.length : 0)

   return(
      <>
      <Markdown>{displayedContent}</Markdown>
      {isTyping && <span className={styles.cursor}>_</span>}
      </>
   )

}

export default function Chats({ messages }) {
   /*    if (!messages || messages.length === 0) {
         return (
            <div className={styles.empty}></div>
         )
      } */


   return (
      <div className={styles.messages}>
         {messages.map((msg, index) => (
            <div
               key={index}
               className={`${styles.message} ${styles[msg.role]}`}>
               <div>{msg.role === 'user' ? '$ ' : '> '}</div>
               <div className={styles.messageContent}>
                  <AnimatedMessageContent fullContent={msg.content}/>
               </div>
            </div>
         ))}
      </div>
   )
}