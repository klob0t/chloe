import { create } from 'zustand'
import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

interface ChatState {
    messages: Message[]
    isTyping: boolean
    isLoading: boolean

    // Actions
    sendMessage: (content: string, model?: string) => Promise<void>
    clearMessages: () => void
    setTyping: (typing: boolean) => void
    setLoading: (loading: boolean) => void
    setMessages: (messages: Message[]) => void
}

export const useChatStore = create<ChatState>()(
    (set, get) => ({
            messages: [],
            isTyping: false,
            isLoading: false,

            sendMessage: async (content: string, model = 'openai-large') => {
                const { messages } = get()

                // Create user message
                const userMessage: Message = {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'user',
                    content,
                    timestamp: Date.now()
                }

                // Create empty assistant message for loading state
                const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                const assistantMessage: Message = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now()
                }

                // Add user and empty assistant message to state
                set(state => ({
                    messages: [...state.messages, userMessage, assistantMessage],
                    isTyping: true,
                    isLoading: true
                }))

                try {
                    // Prepare messages array for OpenAI format
                    const apiMessages = [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...messages.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        })),
                        { role: 'user', content }
                    ]


                    // Make API request with OpenAI format
                    const payload = {
                        messages: apiMessages,
                        model
                    }

                    const response = await request(payload)


                    const assistantContent = response.response || response

                    // Update assistant message with content
                    set(state => ({
                        messages: state.messages.map(msg =>
                            msg.id === assistantMessageId
                                ? { ...msg, content: assistantContent }
                                : msg
                        ),
                        isTyping: false,
                        isLoading: false
                    }))

                } catch (error) {
                    console.error('Failed to send message:', error)

                    // Update the empty assistant message with error
                    set(state => ({
                        messages: state.messages.map(msg =>
                            msg.id === assistantMessageId
                                ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                                : msg
                        ),
                        isTyping: false,
                        isLoading: false
                    }))
                }
            },

            clearMessages: () => {
                set({ messages: [] })
            },

            setTyping: (typing: boolean) => {
                set({ isTyping: typing })
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading })
            },

            setMessages: (messages: Message[]) => {
                set({ messages })
            }
        })
)