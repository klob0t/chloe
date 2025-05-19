'use client'
import { useEffect, useRef } from "react"
import gsap from 'gsap'
import styles from './page.module.css'



const PixelOverlaySvg = () => (
   <svg
      className={styles.pixelOverlay}
      viewBox='0 0 1080 1080'
      preserveAspectRatio='none'
      xmlns='http://www.w3.org/2000/svg'
   >
      <g clipPath='url(#clipPath_pixel_reveal_image_component)'>
         {Array.from({ length: 32 }).map((_, rowIndex) =>
            Array.from({ length: 40 }).map((_, colIndex) => (
               <rect
                  key={`rect-${rowIndex}-${colIndex}`}
                  x={colIndex * 32}
                  y={rowIndex * 32}
                  width='40'
                  height='40'
                  fill='#081057'
                  className={styles.pixelRect}
               />
            ))
         )}
      </g>
      <defs>
         <clipPath id='clipPath_pixel_reveal_image_component'>
            <rect width='1024' height='1024' fill='white' />
         </clipPath>
      </defs>
   </svg>
)

export default function ImageReveal({ imageUrl, altText = 'Generated Image' }) {
   const wrapperRef = useRef(null)
   const imageRef = useRef(null)
   const animationPlayedRef = useRef(false)

   useEffect(() => {
      if (imageUrl &&
         wrapperRef.current &&
         imageRef.current &&
         !animationPlayedRef.current) {

         const selector = `.${styles.pixelRect}`

         const svgRects = wrapperRef.current.querySelectorAll(selector)

         if (svgRects.length === 0) {

            return
         }

         gsap.set(wrapperRef.current, { opacity: 0 })
         gsap.set(svgRects, { opacity: 1 })

         const ctx = gsap.context(() => {
            const tl = gsap.timeline({
               onComplete: () => {
                  animationPlayedRef.current = true
                  const svgElement = wrapperRef.current.querySelector('svg')
                  if (svgElement) {
                     svgElement.style.display = 'none'
                  }
               }
            })

            tl.to(wrapperRef.current, {
               opacity: 1,
               duration: 1.5,
               ease: 'none'
            }) .to(svgRects, {
                  opacity: 0,
                  duration: 0.01,
                  stagger: {
                     amount: 1,
                     from: 'random',
                     ease: 'power2.Out'
                  }
               }, "+=1.2")
         }, wrapperRef)

         return () => {
            animationPlayedRef.current = false
            ctx.revert()
         }
      } else {

      }
   }, [imageUrl])

   if (!imageUrl) return null

   console.log("ATTEMPTING TO LOAD IMAGE:", imageUrl)

   return (
      <div ref={wrapperRef} className={styles.imageWrapper}>
         <img ref={imageRef} src={imageUrl} alt={altText} />
         <PixelOverlaySvg />
      </div>
   )
}