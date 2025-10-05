'use client'
import styles from './message.module.css'
import { Message as MessageType } from '@/app/lib/store/chat'
import { useChatStore } from '@/app/lib/store/chat'
import Markdown from 'react-markdown'
import { Spinner } from '@/app/components/Spinner'
import TextAnimation from '@/app/lib/tools/TextAnimation'

interface MessageProps {
    message: MessageType
}

export default function Message({ message }: MessageProps) {
    const isUser = message.role === 'user'
    const { messages, isTyping, isLoading } = useChatStore()

    const ASSISTANT_ASCII_ART =
        `       _
    __/ \\__
   (  \\ /  )
    >--o--<
   (__/ \\__)
      \\_/

   `

    // Show spinner only for the last assistant message when loading
    const shouldShowSpinner = !isUser &&
        ((messages.length > 0 && messages[messages.length - 1].id === message.id && (isTyping || isLoading)) ||
          (!message.content && (isTyping || isLoading)))

    return (
        <div className={styles.messageWrapper}>
            <div className={`${isUser ? styles.userMessage : styles.assistantMessage}`}>
                <div className={`${isUser ? styles.userAvatar : styles.assistantAvatar}`}>
                    {isUser ? (
                        <div>&lt;</div>
                    ) : (
                        <div>
                            <pre>
                                {ASSISTANT_ASCII_ART}
                            </pre>
                        </div>
                    )}

                </div>
                <div className={styles.content}>
                    {/* Show spinner only for the last assistant message when loading */}
                    {shouldShowSpinner && (
                        <div className={styles.spinnerWrapper}>
                            <Spinner />
                        </div>
                    )}
                    {message.content && !isUser && (
                        <TextAnimation
                            text={message.content}
                            delay={0.2}
                            duration={0.03}
                        />
                    )}
                    {message.content && isUser && (
                        <Markdown>{message.content}</Markdown>
                    )}
                </div>
            </div>
        </div>
    )
}