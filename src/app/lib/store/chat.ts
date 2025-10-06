import { create } from 'zustand'
import { request, requestImage, type ImageRequestPayload, type ImageResponse } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
    messageType?: 'text' | 'image'
    metadata?: Record<string, unknown>
}

interface Conversation {
    id: string
    messages: Message[]
    createdAt: number
    updatedAt: number
    title?: string
}

type MessageUpdater = Message[] | ((messages: Message[]) => Message[])

interface ParsedImageCommand {
    payload?: ImageRequestPayload
    error?: string
}

const parseImageCommand = (raw: string): ParsedImageCommand => {
    const commandBody = raw.trim().slice('/imagine'.length).trim()
    if (!commandBody) {
        return { error: 'Image prompt cannot be empty.' }
    }

    const firstFlagIndex = commandBody.indexOf('--')
    const prompt = (firstFlagIndex === -1 ? commandBody : commandBody.slice(0, firstFlagIndex)).trim()

    if (!prompt) {
        return { error: 'Image prompt cannot be empty.' }
    }

    const optionsSection = firstFlagIndex === -1 ? '' : commandBody.slice(firstFlagIndex)
    const payload: ImageRequestPayload = {
        imagePrompt: prompt
    }

    const optionRegex = /--(\w+)\s+("[^"]+"|[^\s]+)/g
    let match: RegExpExecArray | null

    while ((match = optionRegex.exec(optionsSection)) !== null) {
        const key = match[1].toLowerCase()
        let value = match[2]
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1)
        }

        const toNumber = (input: string) => {
            const parsed = Number(input)
            return Number.isFinite(parsed) ? parsed : undefined
        }

        switch (key) {
            case 'seed': {
                const parsed = toNumber(value)
                if (parsed === undefined) return { error: `Invalid seed value: ${value}` }
                payload.seed = parsed
                break
            }
            case 'gs':
            case 'guidance':
            case 'guidancescale':
            case 'guidance_scale': {
                const parsed = toNumber(value)
                if (parsed === undefined) return { error: `Invalid guidance value: ${value}` }
                payload.guidanceScale = parsed
                break
            }
            case 'steps':
            case 'nis':
            case 'inference':
            case 'inference_steps': {
                const parsed = toNumber(value)
                if (parsed === undefined) return { error: `Invalid steps value: ${value}` }
                payload.inferenceSteps = parsed
                break
            }
            case 'model':
                payload.desiredModel = value
                break
            case 'width': {
                const parsed = toNumber(value)
                if (parsed === undefined) return { error: `Invalid width value: ${value}` }
                payload.width = parsed
                break
            }
            case 'height': {
                const parsed = toNumber(value)
                if (parsed === undefined) return { error: `Invalid height value: ${value}` }
                payload.height = parsed
                break
            }
            default:
                // Ignore unknown flags for now
                break
        }
    }

    return { payload }
}

interface ChatState {
    messages: Message[]
    isTyping: boolean
    isLoading: boolean
    conversations: Conversation[]
    currentConversationId: string | null

    // Actions
    sendMessage: (content: string, model?: string) => Promise<void>
    clearMessages: () => void
    setTyping: (typing: boolean) => void
    setLoading: (loading: boolean) => void
    setMessages: (messages: MessageUpdater) => void
    setCurrentConversationId: (id: string) => void
    saveConversation: (title?: string) => void
    loadConversation: (id: string) => void
    deleteConversation: (id: string) => void
    loadConversations: () => void
    debugLogConversations: () => void
}

// Add a global store instance counter
let storeInstanceCount = 0

export const useChatStore = create<ChatState>()((set, get) => {
        storeInstanceCount++
        console.log('🔥 CHAT STORE INSTANCE CREATED! Count:', storeInstanceCount)

        const isRecord = (value: unknown): value is Record<string, unknown> =>
            typeof value === 'object' && value !== null

        const parsePersistedConversations = (raw: string | null): Conversation[] => {
            if (!raw) {
                return []
            }

            try {
                const parsed = JSON.parse(raw)
                if (!Array.isArray(parsed)) {
                    console.warn('Expected conversations array from storage but received:', parsed)
                    return []
                }

                return parsed
                    .filter(isRecord)
                    .filter((conv): conv is Record<string, unknown> & { id: string } => typeof conv.id === 'string')
                    .map(conv => {
                        const fallbackTimestamp = Date.now()
                        const createdAt = typeof conv.createdAt === 'number' ? conv.createdAt : fallbackTimestamp
                        const updatedAt = typeof conv.updatedAt === 'number' ? conv.updatedAt : createdAt

                        const messageCandidates = Array.isArray(conv.messages) ? conv.messages : []
                        const normalisedMessages: Message[] = messageCandidates
                            .filter(isRecord)
                            .filter((msg): msg is Record<string, unknown> & { id: string } => typeof msg.id === 'string')
                            .map(msg => ({
                                id: msg.id,
                                role: typeof msg.role === 'string' && msg.role === 'assistant' ? 'assistant' : 'user',
                                content: typeof msg.content === 'string' ? msg.content : '',
                                timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : fallbackTimestamp,
                                messageType: msg.messageType === 'image' ? 'image' : 'text',
                                metadata: isRecord(msg.metadata) ? { ...msg.metadata } : undefined
                            }))

                        const normalisedConversation: Conversation = {
                            id: conv.id,
                            messages: normalisedMessages,
                            createdAt,
                            updatedAt
                        }

                        if (typeof conv.title === 'string') {
                            normalisedConversation.title = conv.title
                        }

                        return normalisedConversation
                    })
            } catch (error) {
                console.error('Failed to parse persisted conversations JSON:', error)
                return []
            }
        }

        const readPersistedConversations = (): Conversation[] => {
            if (typeof window === 'undefined') {
                return []
            }

            return parsePersistedConversations(localStorage.getItem('conversations'))
        }

        const persistConversations = (items: Conversation[]) => {
            if (typeof window === 'undefined') {
                return
            }

            localStorage.setItem('conversations', JSON.stringify(items))
        }

        const mergeAndSortConversations = (...lists: Conversation[][]): Conversation[] => {
            const byId = new Map<string, Conversation>()

            lists.forEach(list => {
                list.forEach(conversation => {
                    if (conversation && typeof conversation.id === 'string') {
                        byId.set(conversation.id, conversation)
                    }
                })
            })

            return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt)
        }

        const cloneMessages = (items: Message[]): Message[] => items.map(message => ({
            ...message,
            metadata: message.metadata ? { ...message.metadata } : undefined
        }))

        const resolveMessages = (current: Message[], next: MessageUpdater): Message[] =>
            typeof next === 'function'
                ? (next as (messages: Message[]) => Message[])(current)
                : next

        return {
            // Add debug function to log current state
            debugLogConversations: () => {
                const state = get()
                console.log('=== DEBUG CURRENT STORE STATE ===')
                console.log('Store instance:', storeInstanceCount)
                console.log('Conversations array length:', state.conversations.length)
                console.log('Conversations IDs:', state.conversations.map(c => c.id))
                console.log('Current conversation ID:', state.currentConversationId)
                console.log('Messages count:', state.messages.length)
                console.log('=== END DEBUG ===')
            },
            messages: [],
            isTyping: false,
            isLoading: false,
            conversations: [],
            currentConversationId: null,

            sendMessage: async (content: string, model = 'openai-large') => {
                const { messages, currentConversationId } = get()
                console.log('Sending message. Current conversation ID:', currentConversationId, 'Existing messages:', messages.length)

                const isImageCommand = content.trim().toLowerCase().startsWith('/imagine')

                // Create user message
                const userMessage: Message = {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'user',
                    content,
                    timestamp: Date.now(),
                    messageType: 'text'
                }

                // Create empty assistant message for loading state
                const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                const assistantMessage: Message = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now(),
                    messageType: isImageCommand ? 'image' : 'text'
                }

                // Add user and empty assistant message to state
                const newMessages = [...messages, userMessage, assistantMessage]
                set(() => ({
                    messages: newMessages,
                    isTyping: true,
                    isLoading: true
                }))

                // If this is the first message in a new conversation, save the conversation immediately
                if (messages.length === 0 && currentConversationId) {
                    console.log('First message in new conversation, saving immediately')
                    const { saveConversation } = get()
                    saveConversation()
                }

                const updatePlaceholder = (updater: (message: Message) => Message) => {
                    set(state => ({
                        messages: state.messages.map(msg =>
                            msg.id === assistantMessageId
                                ? updater(msg)
                                : msg
                        ),
                        isTyping: false,
                        isLoading: false
                    }))
                }

                const handleImageCommand = async () => {
                    const parsed = parseImageCommand(content)
                    if (parsed.error || !parsed.payload) {
                        updatePlaceholder(msg => ({
                            ...msg,
                            content: parsed.error ?? 'Image prompt cannot be empty.',
                            messageType: 'text'
                        }))
                        return
                    }

                    const logImageResponse = (label: string, payload: ImageRequestPayload, response?: ImageResponse, error?: unknown) => {
                        console.groupCollapsed(label)
                        console.log('Request payload:', payload)
                        if (response) {
                            console.log('Response JSON:', response)
                        }
                        if (error) {
                            console.error('Error:', error)
                        }
                        console.groupEnd()
                    }

                   try {
                        const response = await requestImage(parsed.payload)
                        logImageResponse('🖼️ Image route success', parsed.payload, response)
                        const imageUrl = (response.metadata?.['source'] as string | undefined) ?? response.response
                        const responseMetadata = {
                            ...response.metadata,
                            prompt: parsed.payload.imagePrompt,
                            seed: parsed.payload.seed,
                            guidanceScale: parsed.payload.guidanceScale,
                            inferenceSteps: parsed.payload.inferenceSteps,
                            model: parsed.payload.desiredModel ?? response.metadata?.['model']
                        }
                        updatePlaceholder(msg => ({
                            ...msg,
                            content: imageUrl,
                            metadata: responseMetadata,
                            messageType: 'image'
                        }))
                   } catch (error) {
                       logImageResponse('🖼️ Image route failed', parsed.payload, undefined, error)
                        console.error('Failed to generate image:', error)
                        const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error')
                        updatePlaceholder(msg => ({
                            ...msg,
                            content: `Sorry, I could not generate that image. ${errorMessage}`,
                            messageType: 'text'
                        }))
                    }
                }

                try {
                    if (isImageCommand) {
                        await handleImageCommand()
                        return
                    }

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
                    updatePlaceholder(msg => ({
                        ...msg,
                        content: assistantContent,
                        messageType: 'text'
                    }))

                } catch (error) {
                    console.error('Failed to send message:', error)

                    // Update the empty assistant message with error
                    updatePlaceholder(msg => ({
                        ...msg,
                        content: 'Sorry, I encountered an error. Please try again.',
                        messageType: 'text'
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

            setMessages: (next: MessageUpdater) => {
                set(state => ({ messages: resolveMessages(state.messages, next) }))
            },

            setCurrentConversationId: (id: string) => {
                set({ currentConversationId: id })
                localStorage.setItem('currentConversationId', id)
            },

            saveConversation: (title?: string) => {
                const { messages, conversations, currentConversationId } = get()
                if (messages.length === 0) {
                    return
                }

                if (typeof window === 'undefined') {
                    console.warn('Attempted to save a conversation outside the browser environment')
                    return
                }

                const now = Date.now()
                const conversationId = currentConversationId || `conv-${now}-${Math.random().toString(36).substring(2, 9)}`

                const safeMessages = cloneMessages(messages)
                const persisted = readPersistedConversations()
                const combinedExisting = mergeAndSortConversations(persisted, conversations)
                const existing = combinedExisting.find(conv => conv.id === conversationId)

                const conversationRecord: Conversation = {
                    ...(existing ?? {}),
                    id: conversationId,
                    messages: safeMessages,
                    createdAt: existing?.createdAt ?? now,
                    updatedAt: now
                }

                if (title) {
                    conversationRecord.title = title
                }

                const updatedConversations = mergeAndSortConversations(combinedExisting, [conversationRecord])

                persistConversations(updatedConversations)
                localStorage.setItem('currentConversationId', conversationId)

                console.log('Saved conversation:', conversationId, 'Total stored:', updatedConversations.length)

                set(state => ({
                    ...state,
                    conversations: updatedConversations,
                    currentConversationId: conversationId
                }))
            },

            loadConversation: (id: string) => {
                const { conversations, messages, currentConversationId } = get()
                const inMemoryConversation = conversations.find(conv => conv.id === id)

                if (inMemoryConversation) {
                    console.log('Loading conversation from memory:', id)
                    set(state => ({
                        ...state,
                        messages: inMemoryConversation.messages,
                        currentConversationId: id
                    }))
                    localStorage.setItem('currentConversationId', id)
                    return
                }

                const persistedConversation = readPersistedConversations().find(conv => conv.id === id)
                if (persistedConversation) {
                    console.log('Hydrating conversation from storage:', id)
                    const mergedConversations = mergeAndSortConversations(conversations, [persistedConversation])

                    set(state => ({
                        ...state,
                        conversations: mergedConversations,
                        messages: persistedConversation.messages,
                        currentConversationId: id
                    }))
                    localStorage.setItem('currentConversationId', id)
                    return
                }

                if (currentConversationId === id && messages.length > 0) {
                    console.log('Keeping existing messages for active conversation:', id)
                    set(state => ({
                        ...state,
                        currentConversationId: id
                    }))
                    localStorage.setItem('currentConversationId', id)
                    return
                }

                console.log('Creating placeholder conversation for ID:', id)
                set(state => ({
                    ...state,
                    messages: [],
                    currentConversationId: id
                }))
                localStorage.setItem('currentConversationId', id)
            },

            deleteConversation: (id: string) => {
                const { conversations, currentConversationId } = get()
                const persisted = readPersistedConversations()
                const merged = mergeAndSortConversations(persisted, conversations)
                const updatedConversations = merged.filter(conv => conv.id !== id)

                persistConversations(updatedConversations)

                if (currentConversationId === id) {
                    localStorage.removeItem('currentConversationId')
                }

                set(state => ({
                    ...state,
                    conversations: updatedConversations,
                    currentConversationId: currentConversationId === id ? null : state.currentConversationId,
                    messages: currentConversationId === id ? [] : state.messages
                }))
            },

            loadConversations: () => {
                if (typeof window === 'undefined') {
                    return
                }

                let savedConversations: string | null = null
                try {
                    savedConversations = localStorage.getItem('conversations')
                    const currentId = localStorage.getItem('currentConversationId')

                    const persisted = parsePersistedConversations(savedConversations)
                    const unified = mergeAndSortConversations(persisted, get().conversations)

                    if (persisted.length > 0) {
                        console.log('Loaded conversations from storage:', persisted.map(conv => conv.id))
                    } else {
                        console.log('No conversations found in localStorage')
                    }

                    set(state => ({
                        ...state,
                        conversations: unified
                    }))

                    if (currentId) {
                        const currentConversation = unified.find(conv => conv.id === currentId)
                        if (currentConversation) {
                            set(state => ({
                                ...state,
                                messages: currentConversation.messages,
                                currentConversationId: currentId
                            }))
                        } else {
                            console.log('Current conversation ID not found in loaded conversations')
                        }
                    }
                } catch (error) {
                    console.error('Failed to load conversations:', error)
                    console.error('localStorage data was:', savedConversations)
                }
            }
        }
    })
