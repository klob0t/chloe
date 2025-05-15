'use client'
import { useEffect, useRef } from "react"
import gsap from 'gsap'
import styles from './reveal.module.css'



const PixelOverlaySvg = () => (
   <svg
      className={styles.pixelOverlay}
      viewBox='0 0 1024 1024'
      preserveAspectRatio='none'
      xmlns='http://www.w3.org/2000/svg'
   >
      <g clipPath='url(#clipPath_pixel_reveal_image_component)'>
         {Array.from({ length: 16 }).map((_, rowIndex) =>
            Array.from({ length: 16 }).map((_, colIndex) => (
               <rect
                  key={`rect-${rowIndex}-${colIndex}`}
                  x={colIndex * 64}
                  y={rowIndex * 64}
                  width='68'
                  height='68'
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

         gsap.set(imageRef.current, { opacity: 1 })
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

            tl.to(imageRef.current, {
               opacity: 1,
               duration: 0.5,
               ease: 'none'
            },)
               .to(svgRects, {
                  opacity: 0,
                  duration: 0.01,
                  stagger: {
                     amount: 1,
                     from: 'random',
                     ease: 'power2.Out'
                  }
               }, "+=1")

            /*             tl.to(svgRects, {
                           opacity: 0,
                           duration: 0.3,
                           stagger: {
                              amount: 1.2,
                              from: 'random',
                              ease: 'none'
                           }
                        })
                           .to(imageRef.current, {
                              opacity: 1,
                              duration: 0.5,
                              ease:'none'
                           }, "-=0.8") */
         }, wrapperRef)

         return () => {

            animationPlayedRef.current = false
            ctx.revert()
         }
      } else {

      }
   }, [imageUrl])

   if (!imageUrl) return null

   return (
      <div ref={wrapperRef} className={styles.imageWrapper}>
         <img ref={imageRef} src={imageUrl} alt={altText} />
         <PixelOverlaySvg />
      </div>
   )
}