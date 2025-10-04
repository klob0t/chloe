'use client'
import { useEffect, useRef } from 'react'
import { useChatStore } from '@/app/lib/store/chat'
import Message from './Message'
import { Spinner } from './Spinner'
import styles from './chatFeed.module.css'

export default function ChatFeed() {
    const { messages, isTyping, isLoading } = useChatStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping, isLoading])

    const CHLOE_LOGOTYPE =
        `
         __      __                       
        /\\ \\   /\\_ \\                   
     ___\\ \\ \\__\\//\\ \\     ___     ___   
    / ___\\ \\  _ \`\\ \\ \\   / __\`\\  / __\`\\ 
   /\\ \\__/\\ \\ \\ \\ \\ \\ \\_/\\ \\_\\ \\/\\  __/ 
   \\ \\____\\\\ \\_\\ \\_\\ \\__\\ \\____/\\ \\____\\
    \\/____/ \\/_/\\/_/\\/__/\\/___/  \\/____/

       `

    return (
        <div className={styles.chatFeed}>
        <div>
            <pre>
                {CHLOE_LOGOTYPE}
            </pre>
        </div>
            <div className={styles.messagesContainer}>
                {messages.map((message) => (
                    <Message key={message.id} message={message} />
                ))
                }
                {(isTyping || isLoading) && (
                    <div className={styles.spinnerWrapper}>
                        <Spinner />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}