'use client'
import { memo, useEffect, useRef, useState } from "react"
import gsap, { wrap } from 'gsap'
import styles from './page.module.css'

const COL_NUM = 33
const ROW_NUM = 42
const PIXEL_COLORS = ['#000B2E', '#0963B3', '#2E9DFF', '#00084D']

const PixelGrid = memo(() => {
   return (
   <div className={styles.pixelGrid}>
      {Array.from({ length: ROW_NUM * COL_NUM }).map((_, i) => (
         <div
            key={i}
            className={styles.pixelDiv}
            style={{
               scale: 0.5,
               backgroundColor: PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)]
            }} />
      ))}
   </div>
   )
})

export default function ImageReveal({ msgType, imageUrl, altText = 'Generated Image' }) {
   const wrapperRef = useRef(null)
   const imageRef = useRef(null)
   const animationPlayedRef = useRef(false)

   const loadingAnimationTimelineRef = useRef(null)

   const [isImageLoaded, setIsImageLoaded] = useState(false)

   const handleImageLoad = () => {
      setIsImageLoaded(true)
   }

   useEffect(() => {
      const pixelGrid = wrapperRef.current.querySelector(`.${styles.pixelGrid}`)

      //-----LOADING ANIMATION-----

      if (msgType === 'image-loading') {
         gsap.set(wrapperRef.current, { opacity: 1 })

         if (pixelGrid) {
            pixelGrid.style.display = 'grid'

            const selector = `.${styles.pixelDiv}`
            console.log(selector)
            const pixels = wrapperRef.current.querySelectorAll(selector)

            if (pixels.length > 0) {
               gsap.set(pixels, {
                  opacity: 1,
                  scale: 0.5,
                  backgroundColor: '#000B2E'
               })

               const loadingCtx = gsap.context(() => {
                  loadingAnimationTimelineRef.current = gsap.timeline()
                     .to(pixels, {
                        backgroundColor: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
                        duration: 0.1,
                        stagger: {
                           amount: 1,
                           from: 'random',
                           ease: 'none',
                           repeat: -1,
                           repeatRefresh: true
                        }
                     })
               }, wrapperRef)

               return () => {
                  if (loadingCtx) {
                     loadingCtx.revert()
                  }
                  if (loadingAnimationTimelineRef.current) {
                     loadingAnimationTimelineRef.current.kill()
                     loadingAnimationTimelineRef.current = null
                  }
               }
            }
         }
      } else if (msgType === 'image') {
         gsap.set(wrapperRef.current, { opacity: 1 })
         if (pixelGrid) {
            pixelGrid.style.display = 'grid'
            const selector = `.${styles.pixelDiv}`
            const pixels = wrapperRef.current.querySelectorAll(selector)
            if (pixels.length > 0) {
               gsap.set(pixels, { opacity: 1 })
               gsap.to(pixels, {
                  backgroundColor: '#000B2E',
                  ease: 'none',
                  scale: 1,
                  duration: 1,
                  ease: 'steps(2)',
                  stagger: {
                     amount: 1,
                     from: 'random',
                     ease: 'none'
                  }
               })
            }
         }
      } else {
         gsap.set(wrapperRef.current, { opacity: 0 })
         if (pixelGrid) {
            pixelGrid.style.display = 'grid'
         }
      }
   }, [imageUrl, msgType])

   //-----REVEAL ANIMATION----- 
   useEffect(() => {
      if (!wrapperRef.current) {
         return
      }
      if (msgType !== 'image' || !isImageLoaded || animationPlayedRef.current) {
         return
      }

      const pixelGrid = wrapperRef.current.querySelector(`.${styles.pixelGrid}`)
      const selector = `.${styles.pixelDiv}`
      const pixels = pixelGrid ? pixelGrid.querySelectorAll(selector) : []

      if (!imageRef.current) {
         return
      }

      if (!pixelGrid || pixels.length === 0) {
         gsap.set(imageRef.current, { opacity: 1 })
         if (pixelGrid) pixelGrid.style.display = 'grid'
         animationPlayedRef.current = true
         return
      }

      gsap.set(imageRef.current, { opacity: 0 })
      gsap.set(pixelGrid, { display: 'grid '})

      const ctx = gsap.context(() => {
         const tl = gsap.timeline({
            onComplete: () => {
               animationPlayedRef.current = true
               if (pixelGrid) { pixelGrid.style.display = 'grid' }
            }
         })
         tl.to(imageRef.current, {
            opacity: 1,
            duration: 0.1,
            delay: 0.5
         }).to(pixels, {
            opacity: 0,
            duration: 0.01,
            stagger: {
               amount: 1,
               from: 'random',
               ease: 'none'
            }
         }, '+=0.')
      }, wrapperRef)

      return () => { ctx.revert() }
   }, [isImageLoaded, msgType, imageUrl])


   return (
      <div ref={wrapperRef} className={styles.imageWrapper}>
         {imageUrl && (
            <img ref={imageRef} src={imageUrl} alt={altText} onLoad={handleImageLoad} />)}
         <PixelGrid />
      </div>
   )
}