import { useEffect, useState } from "react"

export function Spinner() {

   const chars = ['\\', '|', '/', '—']
   const [charIndex, setCharIndex] = useState(0)

   useEffect(() => {
      const intervalId = setInterval(() => {
         setCharIndex(prevIndex => (prevIndex + 1) % chars.length)
      }, 90)
      return () => clearInterval(intervalId)
   }, [])


   return (
      <div
         style={{ display: "inline-block" }}>
         {chars[charIndex]}
      </div>
   )
}