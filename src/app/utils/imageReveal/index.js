// 'use client'
// import { useEffect, useRef, useState } from "react"
// import gsap from 'gsap'
// import styles from './page.module.css'

// const PIXEL_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FFFF33', '#FF33FF', '#33FFFF', '#888888', '#BBBBBB', '#081057']


// export default function ImageReveal({ imageUrl, altText = 'Generated Image' }) {
//    const wrapperRef = useRef(null)
//    const imageRef = useRef(null)
//    const animationPlayedRef = useRef(false)
//    const [isLoaded, setIsLoaded] = useState(false) // New state for actual image load

//    // Effect for LOADING animation (plays when imageUrl is present but image not yet loaded)
//    useEffect(() => {
//       if (isLoaded) {
//          return; // Don't run if no image URL, or if image already loaded
//       }

//       const svgRects = wrapperRef.current.querySelectorAll(`.${styles.pixelRect}`);
//       if (svgRects.length === 0) return;

//       // Make sure overlay is visible
//       gsap.set(wrapperRef.current.querySelector('svg'), { display: 'block', opacity: 1 });
//       gsap.set(svgRects, { opacity: 1 }); // Ensure pixels are visible for loading animation
//       gsap.set(imageRef.current, { opacity: 0 }); // Hide image initially

//       // Example loading animation: pixels shimmer
//       const loadingTl = gsap.timeline({ yoyo: true });
//       loadingTl.to(svgRects, {
//          fill: () => PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
//          opacity: 0.5,
//          duration: 0.5,
//          stagger: {
//             repeat: -1,
//             amount: 0.8,
//             from: 'random',
//             ease: 'power1.inOut'
//          }
//       });

//       return () => {
//          loadingTl.kill(); // Kill loading animation when component unmounts or image loads
//          gsap.set(svgRects, { opacity: 1 }); // Reset opacity for reveal
//       };
//    }, [imageUrl, isLoaded]); // Rerun if imageUrl changes or image load status changes

//    // Effect for REVEAL animation (plays after image is loaded)
//    useEffect(() => {
//       if (imageUrl &&
//          wrapperRef.current &&
//          imageRef.current &&
//          isLoaded && // Only run if image is actually loaded
//          !animationPlayedRef.current) {

//          const selector = `.${styles.pixelRect}`
//          const svgRects = wrapperRef.current.querySelectorAll(selector)
//          if (svgRects.length === 0) {
//             return
//          }

//          // Ensure image is visible before reveal starts fading out pixels
//          gsap.set(imageRef.current, { opacity: 1 });
//          gsap.set(wrapperRef.current, { opacity: 1 }) // Wrapper should already be visible
//          gsap.set(svgRects, { opacity: 1 }) // Ensure pixels are visible before fading out

//          const ctx = gsap.context(() => {
//             const tl = gsap.timeline({
//                onComplete: () => {
//                   animationPlayedRef.current = true
//                   const svgElement = wrapperRef.current.querySelector('svg')
//                   if (svgElement) {
//                      svgElement.style.display = 'none' // Hide SVG after animation
//                   }
//                }
//             })

//             // Removed the wrapper fade-in as it might have been handled by loading state
//             tl.to(svgRects, {
//                opacity: 0,
//                duration: 0.01, // Fast fade for individual pixels
//                stagger: {
//                   amount: 1, // Total time for all staggers
//                   from: 'random',
//                   ease: 'power2.Out'
//                }
//             }, 0); // Start immediately
//          }, wrapperRef)

//          return () => {
//             // animationPlayedRef.current = false; // Reset only if imageUrl changes (handled by key or next effect)
//             ctx.revert()
//          }
//       }
//    }, [imageUrl, isLoaded]) // Rerun if imageUrl changes or image is loaded

//    // Reset animation played flag and loaded state when imageUrl changes
//    useEffect(() => {
//       setIsLoaded(false);
//       animationPlayedRef.current = false;
//       // Potentially show the SVG overlay again if you want the loading animation on image URL change
//       if (wrapperRef.current) {
//          const svgElement = wrapperRef.current.querySelector('svg');
//          if (svgElement) {
//             svgElement.style.display = 'block';
//          }
//          gsap.set(wrapperRef.current.querySelectorAll(`.${styles.pixelRect}`), { opacity: 1 });
//       }

//    }, [imageUrl]);


//    if (!imageUrl) return null

//    return (
//       <div className={styles.imageContainer}>
//          <div ref={wrapperRef} className={styles.imageWrapper} style={{ opacity: 1 }}> {/* Initial opacity for wrapper */}
//             <img
//                ref={imageRef}
//                src={imageUrl}
//                alt={altText}
//                onLoad={() => setIsLoaded(true)} // Set image as loaded
//                onError={() => setIsLoaded(true)} // Also handle error, perhaps show placeholder
//                style={{ opacity: isLoaded ? 1 : 0 }} // Hide image until loaded
//             />
//             {(!isLoaded || !animationPlayedRef.current) && <PixelOverlaySvg />} {/* Conditionally render overlay */}
//          </div>
//       </div>
//    )
// }



'use client'
import { useEffect, useRef } from "react"
import gsap from 'gsap'
import styles from './page.module.css'



const IMAGE_WIDTH = 1080;  // Your target image width
const IMAGE_HEIGHT = 1350; // Your target image height
const PIXEL_RECT_SIZE = 32;

const NUM_COLS = Math.ceil(IMAGE_WIDTH / PIXEL_RECT_SIZE);
const NUM_ROWS = Math.ceil(IMAGE_HEIGHT / PIXEL_RECT_SIZE);

const SVG_VIEWBOX_WIDTH = NUM_COLS * PIXEL_RECT_SIZE;
const SVG_VIEWBOX_HEIGHT = NUM_ROWS * PIXEL_RECT_SIZE;

const PixelOverlaySvg = () => (
   <svg
      className={styles.pixelOverlay}
      viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`}
      preserveAspectRatio='none'
      xmlns='http://www.w3.org/2000/svg'
   >
      <g clipPath='url(#clipPath_pixel_reveal_image_component)'>
         {Array.from({ length: NUM_ROWS }).map((_, rowIndex) =>
            Array.from({ length: NUM_COLS }).map((_, colIndex) => (
               <rect
                  key={`rect-${rowIndex}-${colIndex}`}
                  x={colIndex * PIXEL_RECT_SIZE}
                  y={rowIndex * PIXEL_RECT_SIZE}
                  width={PIXEL_RECT_SIZE + 10}
                  height={PIXEL_RECT_SIZE + 10}
                  fill='#00084d' // Ensure this is visible for loading
                  className={styles.pixelRect}
               />
            ))
         )}
      </g>
      <defs>
         <clipPath id='clipPath_pixel_reveal_image_component'>
            <rect width={SVG_VIEWBOX_WIDTH} height={SVG_VIEWBOX_HEIGHT} fill='white' />
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