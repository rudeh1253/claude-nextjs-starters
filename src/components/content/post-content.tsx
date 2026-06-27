import { cn } from '@/lib/utils'

interface PostContentProps {
  /** markdownToHtml 로 변환된 신뢰 가능한 HTML (Notion 본문) */
  html: string
  className?: string
}

/**
 * Notion 본문(HTML)을 렌더링합니다. (F002, F003)
 *
 * html 은 빌드 시점에 자체 unified 파이프라인으로 생성한 신뢰 가능한 값이므로
 * dangerouslySetInnerHTML 을 사용합니다. Tailwind Typography(`prose`)로 스타일링합니다.
 */
export function PostContent({ html, className }: PostContentProps) {
  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
