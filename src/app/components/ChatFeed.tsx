'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/app/lib/store/chat'
import { useSidebarStore } from '@/app/lib/store/sidebar'
import Message from '@/app/components/Message'
import { Spinner } from '@/app/components/Spinner'
import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'
import styles from './chatFeed.module.css'

export default function ChatFeed() {
    const router = useRouter()
    const {
        messages,
        isTyping,
        isLoading,
        clearMessages,
        setMessages,
        setTyping,
        setLoading,
        saveConversation,
        loadConversations,
        currentConversationId,
        setCurrentConversationId
    } = useChatStore()

    console.log('ChatFeed rendered. Current conversation ID:', currentConversationId, 'Messages:', messages.length)

    const { isOpen, toggleSidebar } = useSidebarStore()
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

    const handleNewChat = async () => {
        // Save current conversation before starting new one
        if (messages.length > 0) {
            saveConversation()
        }

        // Create new conversation ID and navigate to it
        const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        // Set the current conversation ID immediately
        setCurrentConversationId(conversationId)

        router.push(`/chat/${conversationId}`)

        // Clear messages for fresh start
        clearMessages()

        // Create empty assistant message for loading state
        const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const emptyAssistantMessage = {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: '',
            timestamp: Date.now()
        }

        // Set the empty message and loading state
        setMessages([emptyAssistantMessage])
        setTyping(true)
        setLoading(false)

        try {
            const payload = {
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: 'greet the user warmly with hello and offer what you can do to the user in 5 or less words' }
                ],
                model: 'openai'
            }

            const data = await request(payload)
            const response = data.response || data

            // Update the empty message with the greeting response
            setMessages(messages =>
                messages.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: response }
                        : msg
                )
            )
        } catch (error) {
            console.error('Failed to fetch greeting:', error)

            // Update the empty message with error fallback
            setMessages(messages =>
                messages.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: 'Hi! How can I help you today?' }
                        : msg
                )
            )
        } finally {
            setTyping(false)
            setLoading(false)
        }
    }



    return (
        <>
            <div className={`${styles.chatFeed} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.chatFeedHeader}>
                    <div className={styles.chatFeedButtons}>
                        <div className={styles.hamburger} onClick={toggleSidebar}>
                            ☰
                        </div>
                        <div className={styles.newChat} onClick={handleNewChat}>
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
        </>
    )
}
