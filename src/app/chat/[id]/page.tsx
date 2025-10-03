'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useChatStore } from '@/app/lib/store/chat'
import { useConversationStore } from '@/app/lib/store/conversation'
import ChatFeed from '@/app/components/ChatFeed'
import Input from '@/app/components/Input'
import styles from './chat.module.css'

export default function ChatPage() {
    const params = useParams()
    const conversationId = params.id as string
    const { messages, sendMessage } = useChatStore()
    const { setCurrentConversation, getConversation, updateConversationMessages } = useConversationStore()

    useEffect(() => {
        // Set the current conversation
        setCurrentConversation(conversationId)

        // Load conversation messages if they exist
        const conversation = getConversation(conversationId)
        if (conversation && conversation.messages.length > 0) {
            // Load messages into chat store (this would need to be implemented)
            // For now, we'll keep the messages in the chat store
        }
    }, [conversationId, setCurrentConversation, getConversation])

    // Save messages to conversation when they change
    useEffect(() => {
        if (messages.length > 0) {
            updateConversationMessages(conversationId, messages)
        }
    }, [messages, conversationId, updateConversationMessages])

    return (
        <div className={styles.chatPage}>
            <ChatFeed />
            <Input />
        </div>
    )
}