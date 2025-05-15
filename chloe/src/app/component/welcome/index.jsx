'use client'
import { useEffect, useState, useRef } from 'react'
import styles from './page.module.css'
import { sendPayload } from '@/app/utils/request'
import TextReveal from '@/app/utils/textReveal'
import RunningText from '@/app/component/runningText'

export default function Welcome({isLoading}) {
    const [error, setError] = useState('')
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            type: 'loading', 
            content: '' 
        }
    ])

    useEffect(() => {
        const fetchWelcomeMessage = async () => {
            setError('')
            try {
                const payloadToNextApi = {
                    currentPrompt: "greet and offer help to the user in 3 words",
                    messageHistory: [],
                    conversationId: null,
                    desiredProvider: 'PollinationsAI',
                    desiredModel: 'gemini',
                }
                const apiResponse = await sendPayload(payloadToNextApi)
                if (apiResponse && typeof apiResponse.answer === 'string') {
                    setMessages([{
                        role: 'assistant',
                        type: 'text',
                        content: apiResponse.answer
                    }]);
                } else {
                    setError("Received an invalid response from the server.");
                    setMessages([{
                        role: 'assistant',
                        type: 'text',
                        content: "Sorry, I couldn't fetch a greeting."
                    }]);
                }
            } catch (err) {
                setError(err.message || "NO WELCOME: An unexpected error occurred.")
                setMessages([{
                    role: 'assistant',
                    type: 'text',
                    content: "how can i help you?"
                }]);
            } 
        }
        fetchWelcomeMessage()
    }, [])

    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeAscii}>
                <pre>  
&nbsp;      __       ___                     <br />
&nbsp;     /\ \     /\_ \                    <br />
&nbsp;  ___\ \ \___ \//\ \     ___      __   <br />
&nbsp; /'___\ \  _ `\ \ \ \   / __`\  /'__`\ <br />
&nbsp;/\ \__/\ \ \ \ \ \_\ \_/\ \L\ \/\  __/ <br />
&nbsp;\ \____\\ \_\ \_\/\____\ \____/\ \____\<br />
&nbsp; \/____/ \/_/\/_/\/____/\/___/  \/____/<br />
                              
                </pre>
            </div>
            <div className={styles.greetingContainer}>
                {!isLoading && error && (
                    <div className={styles.errorMessage}>
                        <p>{error}</p>
                        {messages.length > 0 && messages[0] && (
                            <TextReveal
                                message={messages[0]}
                                messageKey="error-message"
                                styles={styles}
                            />
                        )}
                    </div>
                )}
                {!isLoading && !error && messages.length > 0 && messages[0] && (
                    <div className={styles.welcomeMessage}>
                        <TextReveal
                            message={messages[0]}
                            messageKey={`welcome-msg-${messages[0].id || 0}`}
                            styles={styles}
                        />
                    </div>
                )}
              
            </div>
              <RunningText className={styles.runningText} speed={2}> 
                type `/imagine` to generate image!
            </RunningText>
        </div>
    )
}