'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useChatStore } from '@/app/lib/store/chat'
import ChatFeed from '@/app/components/ChatFeed'
import Sidebar from '@/app/components/Sidebar'
import Input from '@/app/components/Input'
import styles from './chat.module.css'

export default function ChatPage() {
    const params = useParams()
    const conversationId = params.id as string
    const { loadConversation, setCurrentConversationId, currentConversationId, loadConversations } = useChatStore()

    useEffect(() => {
        // First load all conversations from localStorage
        console.log('Chat page: Loading all conversations first')
        loadConversations()

        // Then load the specific conversation
        console.log('Chat page: Loading specific conversation:', conversationId)
        loadConversation(conversationId)

        // If this is a new conversation (no messages yet), ensure it's set as current
        if (!currentConversationId || currentConversationId !== conversationId) {
            setCurrentConversationId(conversationId)
        }
    }, [conversationId, loadConversation, setCurrentConversationId, currentConversationId, loadConversations])

    return (
        <div className={styles.chatPage}>
            <Sidebar />
            <ChatFeed />
            <Input />
        </div>
    )
}