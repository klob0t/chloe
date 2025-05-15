'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import styles from './page.module.css'
import Markdown from 'markdown-to-jsx'

export default function RunningText({ speed, children }) { 
    const containerRef = useRef(null);
    const firstWrapperRef = useRef(null);
    const mainTl = useRef(null);

    useEffect(() => {

      if (mainTl.current) {
         mainTl.current.kill()
      }

      mainTl.current = gsap.timeline()

      mainTl.current.to(containerRef.current, {
         xPercent: -100,
         duration: speed,
         ease: 'none'
      })

      const wrapperTl = gsap.timeline({
         repeat: -1
      })

      wrapperTl.to(firstWrapperRef.current, {
         xPercent: -100,
         duration: speed,
         ease: 'none'
      })

      mainTl.current.add(wrapperTl)

      return () => {
            if (mainTl.current) {
                mainTl.current.kill()
            }
        };


    }, [speed]); 

    return (
        <div ref={containerRef} className={styles.runningTextContainer}>
            <div ref={firstWrapperRef} className={styles.runningTextWrapper}>
                <span><Markdown>{children}</Markdown></span>
                <span><Markdown>{children}</Markdown></span>
            </div>
        </div>
    );
}