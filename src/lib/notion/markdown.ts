import rehypePrettyCode from 'rehype-pretty-code'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

/**
 * 마크다운 문자열을 렌더용 HTML 로 변환합니다.
 *
 * - remark-gfm: 표/체크리스트/취소선 등 GFM 지원
 * - rehype-raw: notion-to-md 가 내보내는 raw HTML(예: 일부 임베드) 파싱
 * - rehype-pretty-code (Shiki): 코드 블록 신택스 하이라이팅 (F003)
 *
 * 빌드(SSG) 시점에 호출되어 정적 HTML 로 굳어집니다.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePrettyCode, {
      theme: 'github-dark',
      keepBackground: true,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  return String(file)
}
