import styles from './input.module.css'
import { useLoadingStore } from '@/app/lib/store/loading'

export default function Input() {
   const isLoading = useLoadingStore((state) => state.isLoading)

   return (
      <div className={styles.inputWrapper}>
         <div
            spellCheck='false'
            role='textbox'
            contentEditable={!isLoading}
            aria-multiline='true'
         />
      </div>
   )
}