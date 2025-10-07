'use client'

import type { AppRouterInstance } from 'next/navigation'
import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'
import { useChatStore, type Message } from '@/app/lib/store/chat'
import { useSidebarStore } from '@/app/lib/store/sidebar'

const createEmptyAssistantMessage = (): Message => ({
   id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
   role: 'assistant',
   content: '',
   timestamp: Date.now()
})

const createConversationId = () => `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const startNewConversation = async (router: AppRouterInstance) => {
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
         model: 'openai'
      }

      const data = await request(payload)
      const response = data.response || data

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
