'use client'
import styles from './message.module.css'
import { Message as MessageType } from '@/app/lib/store/chat'

interface MessageProps {
    message: MessageType
}

export default function Message({ message }: MessageProps) {
    const isUser = message.role === 'user'

    return (
        <div className={`${styles.messageWrapper} ${isUser ? styles.userMessage : styles.assistantMessage}`}>
            <div className={styles.message}>
                <div className={styles.avatar}>
                    {isUser ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor" />
                            <path d="M12 14C7.029 14 3 18.029 3 23H21C21 18.029 16.971 14 12 14Z" fill="currentColor" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z" fill="currentColor" />
                        </svg>
                    )}
                </div>
                <div className={styles.content}>
                    <p className={styles.text}>{message.content}</p>
                </div>
            </div>
        </div>
    )
}