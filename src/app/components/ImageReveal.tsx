'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import styles from './imageReveal.module.css'
import Image from 'next/image'

const COLS = 17
const ROWS = 21
const PIXEL_COLORS = ['#4893f5', '#0b489d', '#050d41', '#00052a']

interface ImageRevealProps {
   status: 'loading' | 'revealing' | 'idle'
   imageUrl?: string | null
   width?: number
   height?: number
   onComplete?: () => void
}

const PixelGrid = memo(() => (
   <div className={styles.pixelGrid}>
      {Array.from({ length: ROWS * COLS }).map((_, index) => (
         <div key={index} className={styles.pixelDiv} data-pixel />
      ))}
   </div>
))
PixelGrid.displayName = 'PixelGrid'

export default function ImageReveal({ status, imageUrl, width, height, onComplete }: ImageRevealProps) {
   const wrapperRef = useRef<HTMLDivElement>(null)
   const coverRef = useRef<HTMLDivElement>(null)
   const loadingAnim = useRef<gsap.core.Tween | null>(null)
   const revealTimeline = useRef<gsap.core.Timeline | null>(null)
   const [isImageLoaded, setIsImageLoaded] = useState(false)
   const [isDownloading, setIsDownloading] = useState(false)

   useEffect(() => {
      setIsImageLoaded(false)
      setIsDownloading(false)
   }, [imageUrl])

   const handleImageLoad = useCallback(() => {
      setIsImageLoaded(true)
   }, [])

   const stopAnimation = useCallback(() => {
      loadingAnim.current?.kill()
      loadingAnim.current = null
      revealTimeline.current?.kill()
      revealTimeline.current = null
   }, [])

   useEffect(() => {
         const wrapper = wrapperRef.current
         if (!wrapper) return

         const pixels = Array.from(wrapper.querySelectorAll<HTMLDivElement>('[data-pixel]'))
         if (pixels.length === 0) {
            return
         }

         const cover = coverRef.current

         const setWrapperVisibility = (visible: boolean) => {
            gsap.set(wrapper, {
               visibility: visible ? 'visible' : 'hidden',
               opacity: visible ? 1 : 0
            })
         }

         if (status === 'idle') {
            stopAnimation()
            setWrapperVisibility(false)
            if (cover) {
               gsap.set(cover, { opacity: 1 })
            }
            return
         }

         setWrapperVisibility(true)

         if (status === 'loading' || (status === 'revealing' && !isImageLoaded)) {
            revealTimeline.current?.kill()
            revealTimeline.current = null

            if (!loadingAnim.current || !loadingAnim.current.isActive()) {
               loadingAnim.current?.kill()
               loadingAnim.current = gsap.to(pixels, {
                  backgroundColor: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
                  duration: 0.01,
                  ease: 'none',
                  repeat: -1,
                  repeatRefresh: true,
                  stagger: {
                     amount: 0.1,
                     from: 'random',
                     ease: 'power2.inOut'
                  }
               })
            }
            if (cover) {
               gsap.set(cover, { opacity: 1 })
            }
            return
         }

         if (status === 'revealing' && isImageLoaded) {
            loadingAnim.current?.kill()
            loadingAnim.current = null

            revealTimeline.current?.kill()

            revealTimeline.current = gsap.timeline({
               onComplete: () => {
                  stopAnimation()
                  onComplete?.()
               }
            })

            if (cover) {
               gsap.set(cover, { opacity: 1, backgroundColor: '#00052a' })
            }

            gsap.set(pixels, { autoAlpha: 1 })

            revealTimeline.current
               .to(pixels, {
                  backgroundColor: '#00052a',
                  duration: 0.5,
                  ease: 'steps(3)',
                  stagger: {
                     amount: 0.1,
                     ease: 'power2.out',
                     from: 'random'
                  }
               })
               .to(pixels, {
                  autoAlpha: 0,
                  duration: 0.02,
                  ease: 'none',
                  stagger: {
                     amount: 0.8,
                     from: 'random'
                  }
               }, '-=0.6')
               .to(cover, {
                  opacity: 0,
                  duration: 0.12
               }, '<')
         }
      }, [status, isImageLoaded, stopAnimation, onComplete])

   useEffect(() => () => {
      stopAnimation()
   }, [stopAnimation])
   const ratio = width && height ? width / height : 4 / 5

   const downloadFilename = 'chloe-image.png'

   const handleDownload = useCallback(async () => {
      if (!imageUrl || isDownloading) {
         return
      }

      setIsDownloading(true)
      try {
         const response = await fetch(imageUrl)
         if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
         }
         const blob = await response.blob()
         const objectUrl = URL.createObjectURL(blob)
         const link = document.createElement('a')
         link.href = objectUrl
         link.download = downloadFilename
         document.body.appendChild(link)
         link.click()
         document.body.removeChild(link)
         URL.revokeObjectURL(objectUrl)
      } catch (error) {
         console.error('Image download failed:', error)
         try {
            window.open(imageUrl, '_blank', 'noopener')
         } catch (openError) {
            console.error('Fallback open failed:', openError)
         }
      } finally {
         setIsDownloading(false)
      }
   }, [downloadFilename, imageUrl, isDownloading])

   return (
      <div className={styles.imageContainer}>
         <div
            ref={wrapperRef}
            className={styles.imageWrapper}
            style={{ aspectRatio: `${ratio}` }}
         >
            {imageUrl ? (
               <Image
                  key={imageUrl}
                  src={imageUrl}
                  alt="Generated by Chloe"
                  className={styles.generatedImage}
                  onLoad={handleImageLoad}
                  width={0}
                  height={0}
               />
            ) : null}
            <div ref={coverRef} className={styles.imageCover} />
            <PixelGrid />
            {imageUrl && isImageLoaded ? (
               <button
                  type="button"
                  className={styles.downloadButton}
                  onClick={handleDownload}
                  disabled={isDownloading}
               >
                  {isDownloading ? '…' : '⤓'}
                  <span className={styles.srOnly}>Download image</span>
               </button>
            ) : null}
         </div>
      </div>
   )
}
