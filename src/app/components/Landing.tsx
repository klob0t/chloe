'use client'
import styles from './landing.module.css'
import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'
import { useLoadingStore } from '@/app/lib/store/loading'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { TextScramble } from '@/app/components/TextScramble'

const Scene = dynamic(() => import('@/app/components/Scene'), {
    ssr: false,
})

const SCRAMBLE_PLACEHOLDERS = [
    '!-_\\/=+*^?',
    '-_\\/=+*^?!',
    '_\\/=+*^?!-',
    '\\/=+*^?!-_',
    '/=+*^?!-_\\',
    '=+*^?!-_\\/',
    '+*^?!-_\\/=',
    '*^?!-_\\/=+',
    '^?!-_\\/=+*',
    '?!-_\\/=+*^',
] as const

const SCRAMBLE_HOLD_DURATION = 1

const fallbackGreeting = 'Hi! How can I help you today?'

export default function Landing() {
    const [response, setResponse] = useState<string | null>(null)
    const [error, setError] = useState('')
    const { setLoading } = useLoadingStore()
    const scramblePlaceholders = useMemo(() => [...SCRAMBLE_PLACEHOLDERS], [])

    useEffect(() => {
        let isActive = true

        const fetchResponse = async () => {
            setError('')
            setLoading(true)
            try {
                const payload = {
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: 'greet the user warmly with Hi and offer what you can do to the user in 5 or less words' }
                    ],
                    model: 'openai-fast'
                }
                const data = await request(payload)
                const resolvedResponse =
                    typeof data.response === 'string' && data.response.trim().length > 0
                        ? data.response
                        : fallbackGreeting

                if (!isActive) {
                    return
                }

                setResponse(resolvedResponse)
            } catch (err) {
                console.error(err)
                if (!isActive) {
                    return
                }

                setError('Failed to load greeting')
                setResponse(fallbackGreeting)
            } finally {
                if (isActive) {
                    setLoading(false)
                }
            }
        }

        fetchResponse()

        return () => {
            isActive = false
        }
    }, [setLoading])

    return (
        <div className={styles.landingPage}>
            <div className={styles.landingWrapper}>
                <div className={styles.ASCII}>
                    <Scene />
                </div>
                <div className={styles.greeting}>
                    <TextScramble
                        as="p"
                        className={styles.greetingScramble}
                        phrases={scramblePlaceholders}
                        text={response}
                        holdDuration={SCRAMBLE_HOLD_DURATION}
                        aria-live="polite"
                    />
                    {error ? <p className={styles.greetingError}>{error}</p> : null}
                </div>
            </div>
        </div>
    )
}
