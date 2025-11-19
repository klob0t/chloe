'use client'

import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'
import { useChatStore, type Message } from '@/app/lib/store/chat'
import { useSidebarStore } from '@/app/lib/store/sidebar'

type RouterLike = {
   push: (href: string) => void
}

const createEmptyAssistantMessage = (): Message => ({
   id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
   role: 'assistant',
   content: '',
   timestamp: Date.now()
})

const createConversationId = () => `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const extractResponseText = (result: unknown): string | null => {
   if (typeof result === 'string') {
      return result
   }

   if (result && typeof result === 'object' && 'response' in result) {
      const maybeResponse = (result as { response?: unknown }).response
      return typeof maybeResponse === 'string' ? maybeResponse : null
   }

   return null
}

export const startNewConversation = async (router: RouterLike) => {
   const {
      messages,
      saveConversation,
      clearMessages,
      setCurrentConversationId,
      setMessages,
      setTyping,
      setLoading
   } = useChatStore.getState()

   const { closeSidebar } = useSidebarStore.getState()

   if (messages.length > 0) {
      saveConversation()
   }

   const conversationId = createConversationId()
   setCurrentConversationId(conversationId)
   clearMessages()
   router.push(`/chat/${conversationId}`)

   const assistantMessage = createEmptyAssistantMessage()
   setMessages([assistantMessage])
   setTyping(true)
   setLoading(false)

   try {
      const payload = {
         messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
               role: 'user',
               content: 'greet the user warmly with hello and offer what you can do to the user in 5 or less words'
            }
         ],
         model: 'openai-fast'
      }

      const data = await request(payload)
      const response = extractResponseText(data)

      if (!response) {
         throw new Error('No assistant response returned')
      }

      setMessages(existing =>
         existing.map(message =>
            message.id === assistantMessage.id
               ? { ...message, content: response }
               : message
         )
      )
   } catch (error) {
      console.error('Failed to fetch greeting:', error)
      setMessages(existing =>
         existing.map(message =>
            message.id === assistantMessage.id
               ? { ...message, content: 'Hi! How can I help you today?' }
               : message
         )
      )
   } finally {
      setTyping(false)
      setLoading(false)
      closeSidebar()
   }
}
