'use client'
import styles from './message.module.css'
import { Message as MessageType } from '@/app/lib/store/chat'
import { useChatStore } from '@/app/lib/store/chat'
import Markdown from 'react-markdown'
import { Spinner } from '@/app/components/Spinner'
import TextAnimation from '@/app/lib/tools/TextAnimation'
import ImageReveal from '@/app/components/ImageReveal'

interface MessageProps {
    message: MessageType
}

export default function Message({ message }: MessageProps) {
    const isUser = message.role === 'user'
    const { messages, isTyping, isLoading } = useChatStore()
    const isImage = message.messageType === 'image'
    const metadata = message.metadata as Record<string, unknown> | undefined
    const getNumber = (value: unknown) => (typeof value === 'number' ? value : undefined)
    const imageWidth = metadata ? getNumber(metadata['width']) : undefined
    const imageHeight = metadata ? getNumber(metadata['height']) : undefined
    const imageStatus: 'loading' | 'revealing' | 'idle' = !isImage ? 'idle' : message.content ? 'revealing' : 'loading'
    const displayWidth = imageWidth ?? 1080
    const displayHeight = imageHeight ?? Math.round(displayWidth * (5 / 4))



    const ASSISTANT_ASCII_ART =
        `       _
    __/ \\__
   (  \\ /  )
    >--o--<
   (__/ \\__)
      \\_/

   `

    // Show spinner only for the last assistant message when loading
    const shouldShowSpinner = !isUser && !isImage &&
        ((messages.length > 0 && messages[messages.length - 1].id === message.id && (isTyping || isLoading)) ||
          (!message.content && (isTyping || isLoading)))

    const messageClassNames = [isUser ? styles.userMessage : styles.assistantMessage]
    if (!isUser && isImage) {
        messageClassNames.push(styles.assistantMessageImage)
    }

    return (
        <div className={styles.messageWrapper}>
            <div className={messageClassNames.join(' ')}>
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
                    {isImage && (
                        <ImageReveal
                            status={imageStatus}
                            imageUrl={message.content || undefined}
                            width={displayWidth}
                            height={displayHeight}
                        />
                    )}
                    {!isImage && message.content && !isUser && (
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
