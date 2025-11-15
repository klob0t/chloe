'use client'
import { useEffect, useRef } from 'react'
import { useChatStore } from '@/app/lib/store/chat'
import Message from '@/app/components/Message'
import styles from './chatFeed.module.css'

export default function ChatFeed() {
    const {
        messages,
        isTyping,
        isLoading,
        saveConversation,
        loadConversations,
        currentConversationId,
    } = useChatStore()

    console.log('ChatFeed rendered. Current conversation ID:', currentConversationId, 'Messages:', messages.length)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping, isLoading])

    // Load conversations on mount
    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    // Auto-save conversations when messages change
    useEffect(() => {
        if (messages.length > 0 && !isTyping && !isLoading) {
            const timer = setTimeout(() => {
                saveConversation()
            }, 1000) // Save 1 second after typing stops
            return () => clearTimeout(timer)
        }
    }, [messages, isTyping, isLoading, saveConversation])

    return (
        <>
            <div className={styles.chatFeed}>
                <div className={styles.messagesContainer}>
                    {messages.map((message) => (
                        <Message key={message.id} message={message} />
                    ))
                    }
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </>
    )
}
