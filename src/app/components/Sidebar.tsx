'use client'
import { useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useChatStore } from '@/app/lib/store/chat'
import { useSidebarStore } from '@/app/lib/store/sidebar'
import styles from './sidebar.module.css'
import Link from 'next/link'
import { GiHamburgerMenu } from 'react-icons/gi'
import { AiOutlinePlus } from 'react-icons/ai'
import { startNewConversation } from '@/app/lib/utils/handleNewChat'

export default function Sidebar() {
   const {
      conversations,
      currentConversationId,
      loadConversation,
      deleteConversation,
      loadConversations,
      debugLogConversations
   } = useChatStore()

   const { isOpen, closeSidebar, toggleSidebar } = useSidebarStore()
   const router = useRouter()
   const pathname = usePathname()

   useEffect(() => {
      console.log('Sidebar: Loading conversations...')
      loadConversations()
   }, [loadConversations])

   // Also reload conversations when sidebar opens
   useEffect(() => {
      if (isOpen) {
         console.log('Sidebar: Opened, reloading conversations...')
         loadConversations()
      }
   }, [isOpen, loadConversations])

   console.log('Sidebar: Current conversations count:', conversations.length)
   console.log('Sidebar: Current conversation ID:', currentConversationId)

   const sortedConversations = useMemo(
      () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
      [conversations]
   )

   // Debug the store state when list changes
   useEffect(() => {
      debugLogConversations()
   }, [debugLogConversations, conversations.length, currentConversationId])

   const handleConversationClick = (id: string) => {
      loadConversation(id)
      if (pathname !== `/chat/${id}`) {
         router.push(`/chat/${id}`)
      }
      closeSidebar()
   }

   const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      if (confirm('Delete this conversation?')) {
         deleteConversation(id)
      }
   }

   const formatDate = (timestamp: number) => {
      const date = new Date(timestamp)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
   }


   const ASSISTANT_ASCII_ART =
      `   _
 __/ \\__
(  \\ /  )
 >--o--<
(__/ \\__)
   \\_/
   `


   return (
      <>
         {/* Overlay */}
         {isOpen ?
            (
               <>
                  <div className={styles.overlay} onClick={closeSidebar} />

                  <div className={styles.sidebarOpen}>

                     <div className={styles.sidebarHeader}>

                        <h3>Chats</h3>
                        <button className={styles.closeButton} onClick={closeSidebar}>
                           ×
                        </button>
                     </div>
                     <div className={styles.conversationList}>
                        <div
                           className={styles.newChat}
                           onClick={() => startNewConversation(router)}
                        >
                           <AiOutlinePlus />
                           <span>&nbsp;New chat</span>
                        </div>
                        {conversations.length === 0 ? (
                           <div className={styles.emptyState}>
                              No chats yet
                           </div>
                        ) : (
                           sortedConversations.map((conversation) => (
                              <div
                                 key={conversation.id}
                                 className={`${styles.conversationItem} ${currentConversationId === conversation.id ? styles.active : ''
                                    }`}
                                 onClick={() => handleConversationClick(conversation.id)}
                              >
                                 <div className={styles.conversationContent}>
                                    <div className={styles.conversationTitle}>
                                       {conversation.id}
                                    </div>
                                    <div className={styles.conversationMeta}>
                                       {formatDate(conversation.updatedAt)}
                                    </div>
                                 </div>
                                 <button
                                    className={styles.deleteButton}
                                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                                    title="Delete conversation"
                                 >
                                    ×
                                 </button>
                              </div>
                           ))
                        )}
                     </div>
                     <div className={styles.sidebarFooter}>
                        made by<Link
                           style={{
                              display: 'inline-flex'
                           }}
                           href='https://klob0t.xyz'>
                           klob0t
                        </Link>&nbsp;
                        + support from <Link href='https://pollinations.ai'>
                           Pollinations.ai</Link>
                     </div>
                  </div>
               </>
            ) : (
               <div className={styles.sidebarClosed}>
                  <div className={styles.chatFeedButtons}>

                     <div className={styles.hamburger} onClick={toggleSidebar}>
                        <GiHamburgerMenu />
                     </div>

                  </div>
                  <div className={styles.logo}>
                     <Link href='/'>
                        <pre>
                           {ASSISTANT_ASCII_ART}
                        </pre>
                     </Link>
                  </div>
               </div>
            )
         }


      </>
   )
}
