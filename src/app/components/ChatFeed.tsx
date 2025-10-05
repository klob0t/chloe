'use client'
import { useEffect, useRef } from 'react'
import { useChatStore } from '@/app/lib/store/chat'
import Message from '@/app/components/Message'
import { Spinner } from '@/app/components/Spinner'
import Sidebar from '@/app/components/Sidebar'
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
            <div className={styles.chatFeedHeader}>
                <div className={styles.chloeLogo}>
                    <pre>
                        {CHLOE_LOGOTYPE}
                    </pre>
                </div>
                <div className={styles.chatFeedButtons}>
                    <div className={styles.newChat}>
                        +
                    </div>
                </div>
            </div>
            <div className={styles.messagesContainer}>
                {messages.map((message) => (
                    <Message key={message.id} message={message} />
                ))
                }
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}