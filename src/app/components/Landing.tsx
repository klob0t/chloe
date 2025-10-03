'use client'
import styles from './landing.module.css'
import ChatInterface from './ChatInterface'

export default function Landing() {
    return (
        <div className={styles.landingPage}>
            <ChatInterface />
        </div>
    )
}