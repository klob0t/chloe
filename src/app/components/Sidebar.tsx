'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
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
      debugLogConversations,
      titleGenerationStatus,
      ensureConversationTitle
   } = useChatStore()

   const { isOpen, closeSidebar, toggleSidebar, openSidebar } = useSidebarStore()
   const router = useRouter()
   const pathname = usePathname()

   const DESKTOP_BREAKPOINT = 1280
   const [isDesktop, setIsDesktop] = useState(false)

   useEffect(() => {
      const updateIsDesktop = () => {
         setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
      }

      updateIsDesktop()
      window.addEventListener('resize', updateIsDesktop)

      return () => {
         window.removeEventListener('resize', updateIsDesktop)
      }
   }, [])

   const previousIsDesktop = useRef<boolean | null>(null)

   useEffect(() => {
      if (previousIsDesktop.current === isDesktop) {
         return
      }

      previousIsDesktop.current = isDesktop

      if (isDesktop) {
         openSidebar()
      } else {
         closeSidebar()
      }
   }, [isDesktop, openSidebar, closeSidebar])

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

   useEffect(() => {
      sortedConversations.forEach(conversation => {
         const status = titleGenerationStatus[conversation.id]
         const hasTitle = Boolean(conversation.title && conversation.title.trim().length > 0 && conversation.title !== conversation.id)
         const hasMessages = conversation.messages && conversation.messages.length > 0

         if (!hasTitle && hasMessages && status !== 'loading' && status !== 'error') {
            void ensureConversationTitle(conversation.id)
         }
      })
   }, [sortedConversations, titleGenerationStatus, ensureConversationTitle])

   // Debug the store state when list changes
   useEffect(() => {
      debugLogConversations()
   }, [debugLogConversations, conversations.length, currentConversationId])

   const handleConversationClick = (id: string) => {
      loadConversation(id)
      if (pathname !== `/chat/${id}`) {
         router.push(`/chat/${id}`)
      }
      if (!isDesktop) {
         closeSidebar()
      }
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

   const resolveTitle = (title?: string) => {
      const trimmed = title?.trim()
      return trimmed && trimmed.length > 0 ? trimmed : 'New chat'
   }

   const getTitleStatus = (id: string) => titleGenerationStatus[id] ?? 'idle'


   const ASSISTANT_ASCII_ART =
      `   _
 __/ \\__
(  \\ /  )
 >--o--<
(__/ \\__)
   \\_/
   `


   return (
      <div className={styles.sidebar}>
         {/* Overlay */}
         {isOpen ?
            (
               <>
                  {isDesktop ? null : (
                     <div className={styles.overlay} onClick={closeSidebar} />
                  )}

                  <div className={styles.sidebarOpen}>

                     <div className={styles.sidebarHeader}>

                        <h3>Chats</h3>
                        <button className={styles.closeButton} onClick={closeSidebar}>
                           &lt;
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
                           sortedConversations.map((conversation) => {
                              const titleLabel = resolveTitle(conversation.title)
                              const titleStatus = getTitleStatus(conversation.id)
                              const isLoadingTitle = titleStatus === 'loading'
                              const isTitleError = titleStatus === 'error'

                              return (
                                 <div
                                    key={conversation.id}
                                    className={`${styles.conversationItem} ${currentConversationId === conversation.id ? styles.active : ''
                                       }`}
                                    onClick={() => handleConversationClick(conversation.id)}
                                 >
                                    <div className={styles.conversationContent}>
                                       <div
                                          className={`${styles.conversationTitle} ${styles.conversationTitleRow}`}
                                          title={titleLabel}
                                       >
                                          <span className={styles.conversationTitleText}>{titleLabel}</span>
                                          {isLoadingTitle ? <span className={styles.titleSpinner} aria-label="Generating title" /> : null}
                                          {isTitleError ? <span className={styles.titleError} title="Title generation failed">!</span> : null}
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
                              )
                           })
                        )}
                     </div>
                     <div className={styles.sidebarFooter}>
                        <div className={styles.logo}>
                           <Link href='/'>
                              <pre>
                                 {ASSISTANT_ASCII_ART}
                              </pre>
                           </Link>
                        </div>
                        <div className={styles.footerLinks}>
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
      </div>
   )
}
