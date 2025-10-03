import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Conversation {
  id: string
  title?: string
  createdAt: number
  messages: any[]
}

interface ConversationState {
  conversations: Record<string, Conversation>
  currentConversationId: string | null

  // Actions
  createConversation: () => string
  setCurrentConversation: (id: string) => void
  getConversation: (id: string) => Conversation | null
  updateConversationMessages: (id: string, messages: any[]) => void
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: {},
      currentConversationId: null,

      createConversation: () => {
        const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newConversation: Conversation = {
          id,
          createdAt: Date.now(),
          messages: []
        }

        set(state => ({
          conversations: {
            ...state.conversations,
            [id]: newConversation
          },
          currentConversationId: id
        }))

        return id
      },

      setCurrentConversation: (id: string) => {
        set({ currentConversationId: id })
      },

      getConversation: (id: string) => {
        const { conversations } = get()
        return conversations[id] || null
      },

      updateConversationMessages: (id: string, messages: any[]) => {
        set(state => ({
          conversations: {
            ...state.conversations,
            [id]: {
              ...state.conversations[id],
              messages
            }
          }
        }))
      }
    }),
    {
      name: 'chloe-conversation-storage'
    }
  )
)