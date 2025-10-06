'use client'
import styles from './landing.module.css'
import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'
import { useLoadingStore } from '@/app/lib/store/loading'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from './Spinner'
import Input from '@/app/components/Input'
import { useChatStore } from '@/app/lib/store/chat'
import TextAnimation from '@/app/lib/tools/TextAnimation'
import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('@/app/components/Scene'), {
    ssr: false,
})

export default function Landing() {
    const [response, setResponse] = useState('')
    const [error, setError] = useState('')
    const { setLoading } = useLoadingStore()
    const router = useRouter()
    const { sendMessage, clearMessages, saveConversation, setCurrentConversationId } = useChatStore()

    useEffect(() => {
        const id = () => `${Date.now()}-${Math.random().toString(36)}`
        const fetchResponse = async () => {
            setError('')
            setLoading(true)
            try {
                const payload = {
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: 'greet the user warmly with Hi and offer what you can do to the user in 5 or less words' }
                    ],
                    model: 'openai-fast'
                }
                const data = await request(payload)
                setResponse(data.response || data)
            } catch (err) {
                setError('Failed to load greeting')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchResponse()
    }, [setLoading])

    const handleSendMessage = async (content: string) => {
        // Clear any existing messages
        clearMessages()

        // Generate a new conversation ID
        const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        // Set the current conversation ID in the store
        setCurrentConversationId(conversationId)

        // Navigate immediately to chat page
        router.push(`/chat/${conversationId}`)

        // Send the message after a short delay to ensure chat page has loaded
        setTimeout(() => sendMessage(content), 100)
    }

    return (
        <div className={styles.landingPage}>
      
            <div className={styles.landingWrapper}>
                  <div className={styles.ASCII}>
                    <Scene />
                </div>
                <div className={styles.greeting}>
                    {error ? (
                        <p>{error}</p>
                    ) : response ? (
                        <TextAnimation
                            text={typeof response === 'string' ? response : JSON.stringify(response)}
                            delay={0.5}
                            duration={JSON.stringify(response).length / 5000}
                        />
                    ) : (
                        <Spinner />
                    )}
                </div>
            </div>
            <Input onSendMessage={handleSendMessage} />
        </div>
    )
}
