'use client'
import styles from './landing.module.css'
import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'
import { useLoadingStore } from '@/app/lib/store/loading'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'
import { Spinner } from './Spinner'
import Input from '@/app/components/Input'
import { useConversationStore } from '@/app/lib/store/conversation'
import { useChatStore } from '@/app/lib/store/chat'

export default function Landing() {
    const [response, setResponse] = useState('')
    const [error, setError] = useState('')
    const { setLoading } = useLoadingStore()
    const router = useRouter()
    const { createConversation } = useConversationStore()
    const { sendMessage, clearMessages } = useChatStore()

    const welcomePrompt: string = "greet the user warmly and offer what you can do to the user 5 words"

    useEffect(() => {
        const id = () => `${Date.now()}-${Math.random().toString(36)}`
        const fetchResponse = async () => {
            setError('')
            setLoading(true)
            try {
                const payload = {
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: 'greet the user warmly and offer what you can do to the user in 10 or less words' }
                    ],
                    model: 'openai'
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

        // Create new conversation
        const conversationId = createConversation()

        // Navigate immediately to chat page
        router.push(`/chat/${conversationId}`)

        // Send the message after a short delay to ensure chat page has loaded
        setTimeout(() => {
            sendMessage(content)
        }, 100)
    }

    return (
        <div className={styles.landingPage}>
            <div className={styles.landingWrapper}>
                <div>
                    <pre>
                        &nbsp;      __     __                      <br />
                        &nbsp;     /\ \   /\_`\                    <br />
                        &nbsp;  ___\ \ \__\//\ \     ___     ___   <br />
                        &nbsp; / ___\ \  _ `\ \ \   / __`\  / __`\ <br />
                        &nbsp;/\ \__/\ \ \ \ \ \ \_/\ \_\ \/\  __/ <br />
                        &nbsp;\ \____\\ \_\ \_\ \__\ \____/\ \____\<br />
                        &nbsp; \/____/ \/_/\/_/\/__/\/___/  \/____/<br />
                    </pre>
                </div>
                <div className={styles.greeting}>
                    {error ? <p>{error}</p> : response ? <p>{typeof response === 'string' ? response : JSON.stringify(response)}</p> : <Spinner />}
                </div>
            </div>
            <Input onSendMessage={handleSendMessage} />
        </div>
    )
}