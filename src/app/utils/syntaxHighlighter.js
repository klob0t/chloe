import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDarkReasonable } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import styles from './page.module.css'

export const CodeBlock = ({ className, children }) => {
   let lang = ''
   let langShow =''
   if (className && className.startsWith('lang-')) {
      lang = className.replace('lang-', '');
      langShow = lang.charAt(0).toUpperCase() + lang.slice(1)
   } else {
      langShow = 'Text'
   }

   const wrapperStyles = {
      width: '100%',
      backgroundColor: '#00052a', 
      padding: '1em 0em 0em 0',
      margin: '1em 0' 
   }

   const preTagStyles = {
      backgroundColor: 'transparent',
      padding: '0 0em 1em 1em',
      marginLeft: 0,
      marginBottom: 0,
      overflowX: 'auto' 
   }
   
   const lineNumStyles = {
      color: '#0b489d'
   }

   return (
         <div style={wrapperStyles} className={styles.codeBlock}>
            <p align='center' style={{ color: '#0b489d' }}>
               {langShow}
            </p>
            <SyntaxHighlighter
               showInlineLineNumbers={true}
               showLineNumbers={true}
               lineNumberStyle={lineNumStyles}
               customStyle={preTagStyles}
               language={lang}
               
               style={atomOneDarkReasonable}>
               {String(children).trim()}
            </SyntaxHighlighter></div>
   )
}
export const PreBlock = ({ children }) => {
   if ('type' in children && children['type'] === 'code') {
      return CodeBlock(children['props']);
   }
   return <pre>{children}</pre>;
}