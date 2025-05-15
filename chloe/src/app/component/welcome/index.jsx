'use client'
import { useEffect, useState, useRef } from 'react'
import styles from './page.module.css'
import { sendPayload } from '@/app/utils/request'
import { gsap } from 'gsap'
import Markdown from 'markdown-to-jsx'

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
               duration: contentToAnimate.length * 0.01,
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

   return (
      <>
         <div>{displayedContent}</div>
      </>
   )
}

export default function Welcome() {
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')
   const [messages, setMessages] = useState([])
   const [loadingText, setLoadingText] = useState('');
   const loadingChars = ['\\', '|', '/', '—'];
   const RunningText = ({ children, speed = 50, direction = 'left' }) => {
      const contentWrapperRef = useRef(null)
      const containerRef = useRef(null)
      const runningTextRef = useRef(null)

      useEffect(() => {
         if (!runningTextRef.current || !runningTextContainerRef.current)
            return
         const ctx = gsap.context(() => {
            const singleContentWidth = runningTextRef.current.children[0]?.offsetWidth || 0

            if (singleContentWidth === 0) {
               console.warn("content width is 0")
               return
            }

            let tl

            if (direction === 'left') {
               gsap.set(runningTextRef.current, { x: 0 })
               tl = gsap.to(runningTextRef.current, {
                  x: -singleContentWidth,
                  duration: singleContentWidth / speed,
                  ease: 'none',
                  repeat: -1,
               })
            }
         }, runningTextContainerRef)

         return () => {
            ctx.revert()
         }
      }, [children, speed, direction])

      return (
         <div ref={containerRef} className={styles.runningTextContainer}>
            <div ref={contentWrapperRef} className={styles.runningTextContentWrapper}>
               <span className={styles.runningTextItem}>
                  <Markdown>{children}</Markdown>
               </span>
            </div>
         </div>
      )
   }


   useEffect(() => {
      let spinnerIntervalId;
      if (isLoading) {
         let i = 0;
         spinnerIntervalId = setInterval(() => {
            setLoadingText(loadingChars[i % loadingChars.length]);
            i++;
         }, 100);
      } else {
         clearInterval(spinnerIntervalId);
         setLoadingText('');
      }
      return () => clearInterval(spinnerIntervalId);
   }, [isLoading]);

   useEffect(() => {

   })

   useEffect(() => {
      const fetchWelcomeMessage = async () => {
         setIsLoading(true)
         setError('')
         try {
            const payloadToNextApi = {
               currentPrompt: "greet the user warmly and say how you can do. in 5 words",
               messageHistory: [],
               conversationId: null,
               provider: 'PollinationsAI',
               model: 'gemini'
            }

            const apiResponse = await sendPayload(payloadToNextApi)

            setMessages([{ role: 'assistant', content: apiResponse.answer }])

         } catch (err) {
            setError(err.message || "NO WELCOME")
            setMessages([{ role: 'assistant', content: "how can i help you?" }])
         } finally {
            setIsLoading(false)
         }
      }

      fetchWelcomeMessage()

   }, [])

   return (
      <div className={styles.welcomeContainer}>
         <div className={styles.welcomeAscii}>
            <pre>
               &nbsp;              ___      ______                               <br />
               &nbsp;             |   |    |      |                              <br />
               &nbsp;             |   |    |      |                              <br />
               &nbsp;   .'```'.   |   /'``'.``|   |      .-'``'-.     .-'``'-.   <br />
               &nbsp;  /   _   '  |         ; |   |     /        \   /   ..   \  <br />
               &nbsp; ;  .- -.  : |   /`\   | |   |    .   /``\   . .   /__\   . <br />
               &nbsp; |  |   ```` |   | |   | |   |    |   ;  ;   | |          | <br />
               &nbsp; |  |   ;--- |   | |   | |   |    |   '  '   | |   -------` <br />
               &nbsp; '  `-_-   ` |   | |   | |   '---.:   \__/   : ;   \__/```  <br />
               &nbsp;  \       /  |   | |   | `.      | \        /   .        /  <br />
               &nbsp;   `:___:`   |___| |___|   ';____|  `.____.`     '.____.`   <br />
            </pre>
         </div>
         <div className={styles.greetingContainer}>
            {isLoading &&
               <div className={styles.spinner}>
                  {loadingText}
               </div>
            }
            {!isLoading && !error && messages.length > 0 && (
               <div className={styles.welcomeMessage}>
                  <AnimatedMessageContent fullContent={messages[0].content} />
               </div>
            )}
         </div>
         <RunningText direction='left' speed={13}/>
      </div>
   )
}