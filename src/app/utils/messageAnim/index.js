'use client'
import { memo, useState, useRef, useEffect, forwardRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import styles from './page.module.css'
import Markdown from 'markdown-to-jsx'

//*=====HELPER COMPS=====

const TextMessageDisplay = memo(({ text }) => (
    <Markdown options={{ wrapper: 'article' }}>{text || ''}</Markdown>
))
TextMessageDisplay.displayName = 'TextMessageDisplay'

const ImageResponseWrapper = memo(({ children }) => (
    <div className={styles.imageResponse}>{children}</div>
))
ImageResponseWrapper.displayName = 'ImageResponseWrapper'

const TypingSpinner = memo(() => {
    const loadingChars = ['\\', '|', '/', '—']
    const [charIndex, setCharIndex] = useState(0)
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCharIndex(prevIndex => (prevIndex + 1) % loadingChars.length)
        }, 100)
        return () => clearInterval(intervalId)
    }, [])
    return <div className={styles.TypingSpinner}>{loadingChars[charIndex]}</div>
})
TypingSpinner.displayName = 'TypingSpinner'


//*=====IMAGE REVEAL & ITS COMPS=====

const COL_NUM = 17
const ROW_NUM = 21
const PIXEL_COLORS = ['#000B2E', '#0963B3', '#2E9DFF', '#00084D']

const PixelGrid = memo(forwardRef(function PixelGrid(props, ref) {
    return (
        <div className={styles.pixelGrid} ref={ref}>
            {Array.from({ length: ROW_NUM * COL_NUM }).map((_, i) => (
                <div key={i} className={styles.pixelDiv} />
            ))}
        </div>
    )
}))
PixelGrid.displayName = 'PixelGrid'

export function ImageReveal({ status, imageUrl }) {
    const imageRef = useRef(null)
    const wrapperRef = useRef(null)
    const [isImageLoaded, setIsImageLoaded] = useState(false)
    // const loadingAnim = useRef(null)
    // const revealTl = useRef(null)
    let tl = useRef(null)

    const handleImageLoad = () => setIsImageLoaded(true)

    useGSAP(() => {
        if (!wrapperRef.current) return
        const pixels = gsap.utils.toArray(`.${styles.pixelDiv}`, wrapperRef.current)

        const cleanupAnimation = () => {
            if (tl.current) {
                tl.current.kill()
                tl.current = null
            }
        }

        if (status === 'loading' || status === 'revealing' && !isImageLoaded) {
            gsap.set(wrapperRef.current, {
                visibility: 'visible',
                opacity: 1
            })
            gsap.set(pixels, {
                scale: 0.5,
                autoAlpha: 1,
                backgroundColor: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)]
            })
        } else if (status === 'revealing' && isImageLoaded) {
            gsap.set(wrapperRef.current, {
                visibility: 'visible',
                opacity: 1
            })
        } else {
            gsap.set(wrapperRef.current, {
                visibility: 'hidden',
                opacity: 0
            })
            return
        }

        if (status === 'loading') {

            tl.current = gsap.timeline()
            tl.current.to(pixels, {
                backgroundColor: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
                duration: 0.1,
                ease: 'none',
                stagger: {
                    ease: 'power2.inOut',
                    amount: 1,
                    from: 'random',
                    repeat: -1,
                    repeatRefresh: true
                }
            })
        } else if (status === 'revealing' && isImageLoaded) {

            const image = imageRef.current
            tl.current = gsap.timeline()

            if (image) tl.current.set(image, { opacity: 0 })

            tl.current.to(pixels, {
                scale: 1,
                duration: 1.2,
                ease: 'steps(2)',
                stagger: {
                    ease: 'power2.out',
                    amount: 1,
                    from: 'random',
                }
            }).to(pixels, {
                autoAlpha: 0,
                duration: 0.1,
                ease: 'none',
                stagger: {
                    ease: 'none',
                    amount: 1,
                    from: 'random',
                },
            }, "-=0.1")

            if (image) {
                tl.current.to(image, {
                    opacity: 1,
                    duration: 0.1
                }, '<')
            }

            return () => {
                cleanupAnimation()
            }
        }

    }, { scope: [wrapperRef], dependencies: [status, isImageLoaded, imageUrl] })


    return (
        <div ref={wrapperRef} className={styles.imageWrapper} style={{ visibility: 'hidden' }}>
            {imageUrl && (
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="generated @ chloethinks.vercel.app"
                    onLoad={handleImageLoad}
                    className={styles.generatedImage}
                />
            )}
            <PixelGrid />
        </div>
    )
}

export default function MessageAnim({ message }) {
    const [displayedContent, setDisplayedContent] = useState('')

    useGSAP(() => {
        const isTextualMessage = !['text-loading', 'image-loading', 'image'].includes(message.type)
        const contentToAnimate = (isTextualMessage && typeof message.content === 'string' ? message.content : '')

        if (!contentToAnimate) {
            setDisplayedContent(message.type === 'text' ? message.content : '')
            return
        }

        const words = contentToAnimate.split(/(\s+)/)
        const elementsCount = words.filter(word => word.trim() !== '').length
        setDisplayedContent('')

        const ctx = gsap.context(() => {
            if (contentToAnimate) {
                gsap.to({ value: 0 }, {
                    value: words.length,
                    duration: elementsCount * 0.03,
                    ease: 'none',
                    onUpdate: function () {
                        setDisplayedContent(words.slice(0, Math.floor(this.targets()[0].value)).join(''))
                    },
                    onComplete: () => {
                        setDisplayedContent(contentToAnimate)
                    }
                })
            }
        })
        return () => ctx.revert()
    }, { dependencies: [message.id, message.content, message.type] })

    switch (message.type) {
        case 'text-loading':
            return <TypingSpinner />
        case 'image-loading':
        case 'image': {
            const status = message.type === 'image-loading' ? 'loading' : 'revealing'
            const imageUrl = message.type === 'image' ? message.content : null

            return (
                <ImageResponseWrapper>
                    <ImageReveal
                        key={message.id}
                        status={status}
                        imageUrl={imageUrl}
                    />
                </ImageResponseWrapper>
            )
        }

        default:
            return <TextMessageDisplay text={displayedContent} />
    }
}
