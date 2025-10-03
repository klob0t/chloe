'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/app/lib/store/chat'
import { useConversationStore } from '@/app/lib/store/conversation'
import ChatFeed from './ChatFeed'
import Input from './Input'
import styles from './chatInterface.module.css'

export default function ChatInterface() {
    const router = useRouter()
    const { messages, sendMessage, isLoading } = useChatStore()
    const { createConversation, currentConversationId } = useConversationStore()
    const [hasStartedChat, setHasStartedChat] = useState(false)

    const handleSendMessage = async (content: string) => {
        // If this is the first message and no conversation exists, create one
        if (!currentConversationId && !hasStartedChat) {
            const conversationId = createConversation()
            setHasStartedChat(true)

            // Navigate to the conversation URL
            router.push(`/chat/${conversationId}`)

            // Send the message
            await sendMessage(content)
        } else {
            // Just send the message normally
            await sendMessage(content)
        }
    }

    return (
        <div className={styles.chatInterface}>
            {!hasStartedChat && messages.length === 0 ? (
                <div className={styles.welcomeScreen}>
                    <div className={styles.greeting}>
                        <p>Hi! I'm Chloe. How can I help you today?</p>
                    </div>
                </div>
            ) : (
                <ChatFeed />
            )}
            <Input onSendMessage={handleSendMessage} />
        </div>
    )
}