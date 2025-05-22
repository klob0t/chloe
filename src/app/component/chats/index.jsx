'use client'
import { useEffect } from 'react'
import styles from './page.module.css'
import Welcome from '@/app/component/welcome'
import TextReveal from '@/app/utils/textReveal'
import Link from 'next/link'

export default function Chats({ messages }) {

   if (!messages || messages.length === 0) {
      return <Welcome className={styles.welcomeComp} />
   }

   return (
      <>
         <div className={styles.chatsContainer}>
            <Link href='/' className={styles.homePage}>
               <div className={styles.welcomeAscii}>
                  <pre>
                     &nbsp;      __       ___                     <br />
                     &nbsp;     /\ \     /\_ \                    <br />
                     &nbsp;  ___\ \ \___ \//\ \     ___      __   <br />
                     &nbsp; /'___\ \  _ `\ \ \ \   / __`\  /'__`\ <br />
                     &nbsp;/\ \__/\ \ \ \ \ \_\ \_/\ \L\ \/\  __/ <br />
                     &nbsp;\ \____\\ \_\ \_\/\____\ \____/\ \____\<br />
                     &nbsp; \/____/ \/_/\/_/\/____/\/___/  \/____/<br />

                  </pre>
               </div>
            </Link>
            {!messages && messages.length === 0 && <Welcome className={styles.welcomeComp} />}
            <div className={styles.messages}>
               {messages.map((msg, index) => {
                  // console.log('this is msg', msg)
                  return (
                     <div
                        key={msg.id || index}
                        className={`${styles.message} ${styles[msg.role]}`}
                     >
                        <div className={styles[`role-${msg.role}`]}>{msg.role === 'user' ? '<' : '>'}</div>
                        <div className={styles[`msgContent-${msg.role}`]}>
                           <TextReveal message={msg} />
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>
      </>
   )
}