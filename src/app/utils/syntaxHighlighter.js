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

   const customTheme = {
      ...atomOneDarkReasonable,
      'hljs-comment': { color: '#0b489d', fontStyle: 'italic' },
      'hljs-title' : { color: '#4893f5' },
      // 'hljs-identifier' : { color: '#4893f5' },
   }

   const wrapperStyles = {
      width: '100%',
      backgroundColor: '#00052a', 
      padding: '1em 0em 0em 0',
      margin: '0em 0 1em 0em' 
   }

   const preTagStyles = {
      backgroundColor: 'transparent',
      padding: '0 0em 1em 1em',
      marginLeft: 0,
      marginBottom: 0,
      overflowX: 'auto',
      color: '#4894f5'
   }
   
   const lineNumStyles = {
      color: '#0b489d',
      textAlign: 'right'
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
               style={customTheme}>
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