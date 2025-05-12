'use client'
import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { sendPayload } from '@/app/utils/request'
import { gsap } from 'gsap'

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

   return(
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
    const fetchWelcomeMessage = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payloadToNextApi = {
          currentPrompt: "greet the user warmly and say how you can do. in 5 words",
          messageHistory: [],
          conversationId: null
        }

        const apiResponse = await sendPayload(payloadToNextApi)

        if (apiResponse.thinking) {
          console.log("WELCOME THOUGHT", apiResponse.thinking)
        }
        
        setMessages([{ role: 'assistant', content: apiResponse.answer }])

      } catch (err) {
        setError(err.message || "NO WELCOME")
        setMessages([{ role: 'assistant', content: "how can i help you?"}])
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
&nbsp; ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓██████▓▒░░▒▓████████▓▒░ <br />
&nbsp;░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░        <br />
&nbsp;░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░        <br />
&nbsp;░▒▓█▓▒░      ░▒▓████████▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░   <br />
&nbsp;░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░        <br />
&nbsp; ▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░        <br />
&nbsp; ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓██████▓▒░░▒▓████████▓▒░ <br />
</pre>  
         </div >

      {isLoading && 
         <div className={styles.spinner}>
            {loadingText}
         </div>
      }

      {!isLoading && !error && messages.length > 0 && (
         <div className={styles.welcomeMessage}>
         <AnimatedMessageContent fullContent={messages[0].content}/>
         </div>     
      )}

      </div>
   )
}