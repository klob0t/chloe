'use client'

import { useEffect } from 'react'

export default function IosZoomFix () {
   useEffect(() => {
      const checkIsIos = () => {
         return /iPad|iPhone|iPod/.test(navigator.userAgent)
      }

      if (!checkIsIos){
         return
      }

      const addMaximumScaleToMetaViewPort = () => {
         const el = document.querySelector('meta[name=viewport]')

         if (el) {
            let content = el.getAttribute('content')
            const re = /maximum-scale=[0-9.]+/g

            if (re.test(content)) {
               content = content.replace(re, 'maximum-scale=1.0')
            } else {
               content = [content, 'maximum-scale=1.0'].join(', ')
            }

            el.setAttribute('content', content)
         }
      }

      addMaximumScaleToMetaViewPort()
   }, [])

   return null
}