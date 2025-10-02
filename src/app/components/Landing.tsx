'use client'
import styles from './landing.module.css'
import { request } from '@/app/lib/utils/request'
import { SYSTEM_PROMPT } from '@/app/lib/store/prompt'
import { useLoadingStore } from '@/app/lib/store/loading'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/app/components/Logo'
import { Spinner } from './Spinner'
import Input from '@/app/components/Input'

export default function Landing() {
    const [response, setResponse] = useState('')
    const [error, setError] = useState('')
    const { setLoading } = useLoadingStore()

    const welcomePrompt: string = "greet the user warmly and offer what you can do to the user 5 words"

    useEffect(() => {
        const id = () => `${Date.now()}-${Math.random().toString(36)}`
        const fetchResponse = async () => {
            setError('')
            setLoading(true)
            try {
                const payload = {
                    prompt: 'greet the user warmly and offer what you can do to the user in 10 or less words',
                    system: SYSTEM_PROMPT,
                    history: [],
                    id: id()
                }
                const data = await request(payload)
                setResponse(data.response || data)
            } catch (err) {
                setError('Failed to load greeting')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchResponse()
    }, [setLoading])

    return (
        <div className={styles.landingPage}>
            <Link href='https://klob0t.xyz'>
                <Logo />
            </Link>
            <div className={styles.chloeLogo}>
                <pre>
                    &nbsp;      __     __                      <br />
                    &nbsp;     /\ \   /\_`\                    <br />
                    &nbsp;  ___\ \ \__\//\ \     ___     ___   <br />
                    &nbsp; / ___\ \  _ `\ \ \   / __`\  / __`\ <br />
                    &nbsp;/\ \__/\ \ \ \ \ \ \_/\ \_\ \/\  __/ <br />
                    &nbsp;\ \____\\ \_\ \_\ \__\ \____/\ \____\<br />
                    &nbsp; \/____/ \/_/\/_/\/__/\/___/  \/____/<br />
                </pre>
            </div>
            <div className={styles.greeting}>
                {error ? <p>{error}</p> : response ? <p>{typeof response === 'string' ? response : JSON.stringify(response)}</p> : <Spinner />}
            </div>
            <Input />
        </div>
    )
}