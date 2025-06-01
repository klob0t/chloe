'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import Markdown from 'markdown-to-jsx'
import styles from './page.module.css'
import { useGSAP } from '@gsap/react'

export default function RunningText({ speed, children }) {
    const containerRef = useRef(null)
    const wrapperRef = useRef(null)
    const instanceRef = useRef([])
    const tl = useRef(null)

    const N = 2


    useGSAP(() => {

        const containerWidth = containerRef.current.offsetWidth;
    const instanceWidth = instanceRef.current[0].offsetWidth;

    
    for (let i = 1; i < N; i++) {
        gsap.set(instanceRef.current[i], {
   
            position: 'absolute',
            left: `${i / (N - 1) * 100}%`,
        });
    }

    gsap.set(containerRef.current, {
        left: '100%',
        opacity: 1,
    });

    
    const tl = gsap.timeline();
    
    tl.to(containerRef.current, {
        xPercent: -100,
        duration: 5,
        ease: 'none',
    });

    
    const wrapperTl = gsap.timeline({
        repeat: -1
    });

    wrapperTl.to(wrapperRef.current, {
        xPercent: -100,
        duration: 5,
        ease: 'none',
    });

    tl.add(wrapperTl);

    }, { dependencies: [children, speed] })

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