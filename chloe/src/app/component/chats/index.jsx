'use client'
import styles from './page.module.css'
import Markdown from 'markdown-to-jsx'

export default function Chats({ messages }) {
/*    if (!messages || messages.length === 0) {
      return (
         <div className={styles.empty}>talk to me...</div>
      )
   } */

   return (
      <div className={styles.messages}>
         {messages.map((msg, index) => (
            <div
               key={index}
               className={`${styles.message} ${styles[msg.role]}`}>
               <div>{msg.role === 'user' ? '$ ' : '> '}</div> 
               <div className={styles.messageContent}>
               <Markdown>{msg.content}</Markdown>
               </div>
            </div>
         ))}
      </div>
   )
}