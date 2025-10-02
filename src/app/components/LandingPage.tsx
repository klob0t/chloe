'use client'
import styles from './landing.module.css'
import { usePollinationsText } from '@pollinations/react'
import { sysPrompt } from '@/app/lib/store/prompt'

export default function Landing() {
    const welcomePrompt: string = "greet the user warmly and offer what you can do to the user 5 words"

    const text = usePollinationsText(welcomePrompt, {
        seed: 42,
        model: 'openai',
        systemPrompt: sysPrompt
    })

    return (
        <div className={styles.landingPage}>
            {text ? <p>{text}</p> : <p>Loading...</p>}
        </div>
    )
}