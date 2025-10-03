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

    return (
        <div className={styles.chatFeed}>
            <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <div className={styles.welcomeMessage}>
                        <p>Hi! I'm Chloe. How can I help you today?</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <Message key={message.id} message={message} />
                    ))
                )}
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