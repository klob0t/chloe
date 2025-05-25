'use client'
import styles from './page.module.css'
import Welcome from '@/app/component/welcome'
import MessageAnim from '@/app/utils/messageAnim'
import Link from 'next/link'

export default function Chats({ messages }) {

   if (!messages || messages.length === 0) {
      return <Welcome className={styles.welcomeComp} />
   }

   const ASSISTANT_ASCII_ART =
      `       _
    __/ \\__
   (  \\ /  )
    >--o--<
   (__/ \\__)
      \\_/
   
   `

   return (
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
            {messages.map((msg) => {
               console.log(msg)
               return (
                  <div
                     key={msg.id}
                     className={`${styles.message} ${styles[msg.role]}`}>
                     <div className={styles[`role-${msg.role}`]}>{msg.role === 'user' ? '<' : (
                        <pre className={styles.asciiArtDisplay}>
                           {ASSISTANT_ASCII_ART}
                        </pre>
                     )}
                     </div>
                     <div className={styles[`msgContent-${msg.role}`]}>
                        <MessageAnim message={msg} />
                     </div>
                  </div>
               )
            })}
         </div>
      </div>
   )
}