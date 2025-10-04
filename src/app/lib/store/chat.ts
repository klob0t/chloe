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

                // Add user message to state
                set(state => ({
                    messages: [...state.messages, userMessage],
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

                    // Create assistant message
                    const assistantMessage: Message = {
                        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        role: 'assistant',
                        content: assistantContent,
                        timestamp: Date.now()
                    }

                    // Add assistant message to state
                    set(state => ({
                        messages: [...state.messages, assistantMessage],
                        isTyping: false,
                        isLoading: false
                    }))

                } catch (error) {
                    console.error('Failed to send message:', error)

                    // Create error message
                    const errorMessage: Message = {
                        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        role: 'assistant',
                        content: 'Sorry, I encountered an error. Please try again.',
                        timestamp: Date.now()
                    }

                    set(state => ({
                        messages: [...state.messages, errorMessage],
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