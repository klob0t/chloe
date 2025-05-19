'use client'

import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import Markdown from 'markdown-to-jsx'
import styles from './page.module.css'

export default function RunningText({ speed, children }) {
    const containerRef = useRef(null)
    const wrapperRef = useRef(null)
    const instanceRef = useRef([])
    const tl = useRef(null)

    const N = 2


    useEffect(() => {

        const containerWidth = containerRef.current.offsetWidth

        const instanceWidth = instanceRef.current[0].offsetWidth

        if (tl.current) {
            tl.current.kill();
        }

        tl.current = gsap.timeline()

        for (let i = 1; i < N; i++) {
            gsap.set(instanceRef.current[i], {
                position: 'absolute',
                left: `${i / (N - 1) * 100}%`,
            })
        }

        gsap.set(containerRef.current, {
            left: '100%'
        })

        tl.current.to(containerRef.current, {
            xPercent: -100,
            duration: 5,
            ease: 'none',
        })

        const wrapperTl = gsap.timeline()

        wrapperTl.to(wrapperRef.current, {
            xPercent: -100,
            duration: 5,
            ease: 'none',
            repeat: -1
        })

        tl.current.add(wrapperTl)

        return () => {
            if (tl.current) {
                tl.current.kill()
            }
        }

    }, [children, speed])

    return (
        <div ref={containerRef} className={styles.marqueeContainer}>
            <div ref={wrapperRef} className={styles.marqueeWrapper}>
                {Array.from({ length: N }).map((_, i) => (
                    <p
                        key={i}
                        ref={el => instanceRef.current[i] = el}
                        className={styles.textInstance}>
                        <Markdown>{children}</Markdown>
                    </p>
                ))}
            </div>


        </div>
    )
}