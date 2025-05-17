'use client'
import styles from './page.module.css'
import Welcome from '@/app/component/welcome'
import TextReveal from '@/app/utils/textReveal'

export default function Chats({ messages }) {
   if (!messages || messages.length === 0) {
      return <Welcome className={styles.welcomeComp} />
   }

   return (
      <div className={styles.chatsContainer}>
      {!messages && messages.length === 0 && <Welcome className={styles.welcomeComp} />}
         <div className={styles.messages}>
            {messages.map((msg, index) => (
               <div
                  key={msg.id || index}
                  className={`${styles.message} ${styles[msg.role]}`}
               >
                  <div className={styles[`role-${msg.role}`]}>{msg.role === 'user' ? '<' : '>'}</div>
                  <div className={styles[`msgContent-${msg.role}`]}>
                     <TextReveal message={msg} />
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}