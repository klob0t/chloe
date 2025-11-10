'use client'
import { useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode, type CSSProperties } from 'react'
import styles from './message.module.css'
import { Message as MessageType } from '@/app/lib/store/chat'
import { useChatStore } from '@/app/lib/store/chat'
import Markdown, { type MarkdownToJSX } from 'markdown-to-jsx'
import { Spinner } from '@/app/components/Spinner'
import TextAnimation from '@/app/components/TextAnimation'
import ImageReveal from '@/app/components/ImageReveal'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDarkReasonable } from 'react-syntax-highlighter/dist/esm/styles/hljs'

interface MarkdownCodeProps extends HTMLAttributes<HTMLElement> {
    className?: string
    children: ReactNode
    parentName?: string
}

const normalizeLanguage = (value: string): string => {
    const lower = value.toLowerCase()
    if (lower.length % 2 === 0) {
        const half = lower.slice(0, lower.length / 2)
        if (half.repeat(2) === lower) {
            return half
        }
    }
    return lower
}

const resolveLanguage = (className?: string): { lang: string; label: string } => {
    if (!className) {
        return { lang: 'text', label: 'TEXT' }
    }

    const tokens = className.split(/\s+/).filter(Boolean)
    const languageToken = tokens.find(token => token.startsWith('lang-') || token.startsWith('language-'))
    const raw = languageToken ? languageToken.replace(/^lang(uage)?-/, '') : ''
    const normalised = raw ? normalizeLanguage(raw) : 'text'
    const lang = normalised || 'text'

    return {
        lang,
        label: lang.toUpperCase()
    }
}

const toCodeString = (value: ReactNode): string => {
    if (typeof value === 'string') {
        return value
    }
    if (Array.isArray(value)) {
        return value.map(item => toCodeString(item)).join('')
    }
    return ''
}

const CodeBlock = ({ className, children }: Pick<MarkdownCodeProps, 'className' | 'children'>) => {
    const { lang, label } = resolveLanguage(className)
    const codeContent = toCodeString(children).trimEnd()

    const customTheme = {
        ...atomOneDarkReasonable,
        'hljs-comment': { color: '#0b489d', fontStyle: 'italic' },
        'hljs-title': { color: '#4893f5' }
    }

    const wrapperStyles: CSSProperties = {
        width: '100%',
        backgroundColor: '#00052a',
        padding: '1rem 0rem 0rem 0',
        margin: '1rem 0 1rem 0'
    }

    const preTagStyles: CSSProperties = {
        backgroundColor: 'transparent',
        padding: '0 0em 1rem 1rem',
        marginLeft: 0,
        marginBottom: 0,
        overflowX: 'auto',
        color: '#4894f5'
    }

    const lineNumStyles: CSSProperties = {
        color: '#0b489d',
        textAlign: 'right'
    }

    return (
        <div style={wrapperStyles} className={styles.codeBlock}>
            <p
                style={{
                    color: '#0b489d',
                    paddingRight: '1rem',
                    textAlign: 'right',
                    fontFamily: 'var(--font-geist-mono)',
                    fontSize: '0.8rem',
                    fontWeight: 500
                }}
            >
                {label}
            </p>
            <SyntaxHighlighter
                showInlineLineNumbers={true}
                showLineNumbers={true}
                lineNumberStyle={lineNumStyles}
                customStyle={preTagStyles}
                language={lang}
                style={customTheme}
            >
                {codeContent}
            </SyntaxHighlighter>
        </div>
    )
}

const PreBlock = ({ children }: { children: ReactNode }) => <>{children}</>

const MarkdownCode = ({ className, parentName, children, ...props }: MarkdownCodeProps) => {
    const languageClass = className ?? ''
    const isBlock = parentName === 'pre' || /\blang(?:uage)?-/.test(languageClass)

    if (isBlock) {
        return <CodeBlock className={languageClass}>{children}</CodeBlock>
    }

    const combinedClassName = [styles.inlineCode, className].filter(Boolean).join(' ')
    return (
        <code className={combinedClassName} {...props}>
            {children}
        </code>
    )
}

const buildMarkdownOptions = (): MarkdownToJSX.Options => ({
    overrides: {
        pre: { component: PreBlock },
        code: { component: MarkdownCode }
    }
})

interface MessageProps {
    message: MessageType
}

export default function Message({ message }: MessageProps) {
    const isUser = message.role === 'user'
    const { messages, isTyping, isLoading } = useChatStore()
    const isImage = message.messageType === 'image'
    const metadata = message.metadata as Record<string, unknown> | undefined
    const getNumber = (value: unknown) => (typeof value === 'number' ? value : undefined)
    const imageWidth = metadata ? getNumber(metadata['width']) : undefined
    const imageHeight = metadata ? getNumber(metadata['height']) : undefined
    const imageStatus: 'loading' | 'revealing' | 'idle' = !isImage ? 'idle' : message.content ? 'revealing' : 'loading'
    const displayWidth = imageWidth ?? 1080
    const displayHeight = imageHeight ?? Math.round(displayWidth * (5 / 4))

    const markdownOptions = useMemo(buildMarkdownOptions, [])

    const [animationKey, setAnimationKey] = useState(0)
    const previousContentRef = useRef(message.content ?? '')

    useEffect(() => {
        if (isUser || isImage) {
            previousContentRef.current = message.content ?? ''
            return
        }

        const previousContent = previousContentRef.current ?? ''
        const currentContent = message.content ?? ''

        if (currentContent && currentContent !== previousContent) {
            setAnimationKey(previous => previous + 1)
        }

        previousContentRef.current = currentContent
    }, [isUser, isImage, message.content])



    const ASSISTANT_ASCII_ART =
        `       _
    __/ \\__
   (  \\ /  )
    >--o--<
   (__/ \\__)
      \\_/

   `

    // Show spinner only for the last assistant message when loading
    const shouldShowSpinner = !isUser && !isImage &&
        ((messages.length > 0 && messages[messages.length - 1].id === message.id && (isTyping || isLoading)) ||
            (!message.content && (isTyping || isLoading)))

    const messageClassNames = [isUser ? styles.userMessage : styles.assistantMessage]
    if (!isUser && isImage) {
        messageClassNames.push(styles.assistantMessageImage)
    }

    return (
        <div className={styles.messageWrapper}>
            <div className={messageClassNames.join(' ')}>
                <div className={`${isUser ? styles.userAvatar : styles.assistantAvatar}`}>
                    {isUser ? (
                        <div>&lt;</div>
                    ) : (
                        <div>
                            <pre>
                                {ASSISTANT_ASCII_ART}
                            </pre>
                        </div>
                    )}

                </div>
                <div className={styles.content}>
                    {/* Show spinner only for the last assistant message when loading */}
                    {shouldShowSpinner && (
                        <div className={styles.spinnerWrapper}>
                            <Spinner />
                        </div>
                    )}
                    {isImage && (
                        <ImageReveal
                            status={imageStatus}
                            imageUrl={message.content || undefined}
                            width={displayWidth}
                            height={displayHeight}
                        />
                    )}
                    {!isImage && !isUser && (
                        <TextAnimation
                            text={message.content}
                            delay={0.2}
                            duration={0.03}
                            animationKey={animationKey}
                            markdownOptions={markdownOptions}
                        />
                    )}
                    {message.content && isUser && (
                        <Markdown options={markdownOptions}>{message.content}</Markdown>
                    )}
                </div>
            </div>
        </div>
    )
}
