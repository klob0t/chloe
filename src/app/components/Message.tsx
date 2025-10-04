'use client'
import styles from './message.module.css'
import { Message as MessageType } from '@/app/lib/store/chat'

interface MessageProps {
    message: MessageType
}

export default function Message({ message }: MessageProps) {
    const isUser = message.role === 'user'

    const ASSISTANT_ASCII_ART =
        `       _
    __/ \\__
   (  \\ /  )
    >--o--<
   (__/ \\__)
      \\_/
   
   `

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
                    <p className={styles.text}>{message.content}</p>
                </div>
            </div>
        </div>
    )
}