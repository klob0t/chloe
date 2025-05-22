'use client'
import { useEffect, useRef, useState } from "react"
import gsap, { wrap } from 'gsap'
import styles from './page.module.css'

const PIXEL_SIZE = 32
const COL_NUM = 34
const ROW_NUM = 43
const PIXEL_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FFFF33', '#FF33FF', '#33FFFF', '#A0A0A0', '#081057', '#00084D']

const PixelOverlaySvg = () => (
   <svg
      className={styles.pixelOverlay}
      viewBox={`0 0 ${PIXEL_SIZE * COL_NUM} ${PIXEL_SIZE * ROW_NUM}`}
      preserveAspectRatio='none'
      xmlns='http://www.w3.org/2000/svg'
   >
      <g clipPath='url(#clipPath_pixel_reveal_image_component)'>
         {Array.from({ length: ROW_NUM }).map((_, rowIndex) =>
            Array.from({ length: COL_NUM }).map((_, colIndex) => (
               <rect
                  key={`rect-${rowIndex}-${colIndex}`}
                  x={colIndex * PIXEL_SIZE}
                  y={rowIndex * PIXEL_SIZE}
                  width={PIXEL_SIZE + 1}
                  height={PIXEL_SIZE + 1}
                  fill='#00084d'
                  className={styles.pixelRect}
               />
            ))
         )}
      </g>
      <defs>
         <clipPath id='clipPath_pixel_reveal_image_component'>
            <rect width={PIXEL_SIZE * COL_NUM} height={PIXEL_SIZE * ROW_NUM} fill='#00084d' />
         </clipPath>
      </defs>
   </svg>
)

export default function ImageReveal({ msgType, imageUrl, altText = 'Generated Image' }) {
   const wrapperRef = useRef(null)
   const imageRef = useRef(null)
   const animationPlayedRef = useRef(false)

   const loadingAnimationTimelineRef = useRef(null)

   const [isImageLoaded, setIsImageLoaded] = useState(false)

   const handleImageLoad = () => {
      setIsImageLoaded(true)
   }

   //-------------------LOADING ANIMATION----------------
   useEffect(() => {
      console.log("LOADING/SETUP EFFECT - msgType: ", msgType, "URL", imageUrl)

      if (loadingAnimationTimelineRef.current) {
            loadingAnimationTimelineRef.current.kill()
            loadingAnimationTimelineRef.current = null
        }

      setIsImageLoaded(false)
      animationPlayedRef.current = false

      if (!wrapperRef.current) return

      const svgElement = wrapperRef.current.querySelector('svg')

      if (msgType === 'image-loading') {
         gsap.set(wrapperRef.current, { opacity: 1 })

         if (svgElement) {
            svgElement.style.display = 'block'

            const selector = `.${styles.pixelRect}`
            const svgRects = svgElement.querySelectorAll(selector)
            console.log("Found svgRects:", svgRects.length)
            if (svgRects.length > 0) {
               gsap.set(svgRects, { opacity: 1 })

               const ctx = gsap.context(() => {
                  loadingAnimationTimelineRef.current = gsap.timeline()
                  .to(svgRects, {
                     fill: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
                     duration: 0.1,
                     stagger: {
                            amount: 1,
                            from: 'random',
                            ease: 'power2.Out',
                            repeat: -1,
                            repeatRefresh: true // ✨ Add this line
                        }
                  })
               }, svgElement)
            }
         }
      } else if (msgType === 'image') {
         if (svgElement) {
            svgElement.style.display = 'block'

            const selector = `.${styles.pixelRect}`
            const svgRects = svgElement.querySelectorAll(selector)
            if (svgRects.length > 0) {
               gsap.set(svgRects, { opacity: 1 })
            }
         }
      } else {
         gsap.set(wrapperRef.current, { opacity: 0 })
         if (svgElement) {
            svgElement.style.display = 'none'
         }
      }

      return () => {
         if (loadingAnimationTimelineRef.current) {
            loadingAnimationTimelineRef.current.kill()
            loadingAnimationTimelineRef.current = null
         }
      }
   }, [imageUrl, msgType])


//-------------------REVEAL ANIMATION--------------------
   useEffect(() => {

      if (!wrapperRef.current || !styles?.pixelRect) {
         return
      }

      if (msgType !== 'image') {
         return
      }

      if (isImageLoaded && !animationPlayedRef.current) {

         const svgElement = wrapperRef.current.querySelector('svg')
         const selector = `.${styles.pixelRect}`
         const svgRects = svgElement ? svgElement.querySelectorAll(selector) : []

         if (!imageRef.current) {
            return
         }

         if (!svgElement || svgRects.length === 0) {
            gsap.set(wrapperRef.current, { opacity: 0 })
            gsap.to(wrapperRef.current, {
               opacity: 1,
               duration: 0.01,
               ease: 'none',
               onComplete: () => {
                  animationPlayedRef.current = true
                  if (svgElement) { svgElement.style.display = 'none' }
               }
            })
            return
         }

         gsap.set(wrapperRef.current, { opacity: 0 })
         svgElement.style.display = 'block'

         const ctx = gsap.context(() => {
            const tl = gsap.timeline({
               onComplete: () => {
                  animationPlayedRef.current = true
                  if (svgElement) { svgElement.style.display = 'none' }
               }
            })
            tl.to(wrapperRef.current, {
               opacity: 1,
               duration: 0.01,
               ease: 'none'
            }).to(svgRects, {
               opacity: 0,
               duration: 0.01,
               stagger: { amount: 1, from: 'random', ease: 'power2.Out'}
            }, '+=1.2')
         }, wrapperRef)
         return () => { ctx.revert() }
      }

   }, [isImageLoaded, msgType, imageUrl, styles?.pixelRect])


   return (
      <div ref={wrapperRef} className={styles.imageWrapper}>
         {imageUrl && (
            <img ref={imageRef} src={imageUrl} alt={altText} onLoad={handleImageLoad} />)}
         <PixelOverlaySvg />
      </div>
   )
}





// useEffect(() => {
//    if (imageUrl &&
//       wrapperRef.current &&
//       imageRef.current &&
//       !animationPlayedRef.current) {

//       const selector = `.${styles.pixelRect}`
//       const svgRects = wrapperRef.current.querySelectorAll(selector)

//       if (svgRects.length === 0) {

//          return
//       }

//       gsap.set(wrapperRef.current, { opacity: 0 })
//       gsap.set(svgRects, { opacity: 1 })

//       const ctx = gsap.context(() => {
//          const tl = gsap.timeline({
//             onComplete: () => {
//                animationPlayedRef.current = true
//                const svgElement = wrapperRef.current.querySelector('svg')
//                if (svgElement) {
//                   svgElement.style.display = 'none'
//                }
//             }
//          })

//          tl.to(wrapperRef.current, {
//             opacity: 1,
//             duration: 1.5,
//             ease: 'none'
//          }) .to(svgRects, {
//                opacity: 0,
//                duration: 0.01,
//                stagger: {
//                   amount: 1,
//                   from: 'random',
//                   ease: 'power2.Out'
//                }
//             }, "+=1.2")
//       }, wrapperRef)

//       return () => {
//          animationPlayedRef.current = false
//          ctx.revert()
//       }
//    } else {

//    }
// }, [imageUrl])

// if (!imageUrl) return null
