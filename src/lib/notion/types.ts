/**
 * Notion 포스트 데이터 모델 (PRD 데이터 모델의 TypeScript 표현).
 * 본문(blocks/markdown)은 파생 데이터로, 별도 조회 시점에 채워집니다.
 */
export interface PostMeta {
  /** Notion 페이지 ID */
  id: string
  /** 글 제목 (title) */
  title: string
  /** URL 경로 식별자 (rich_text) */
  slug: string
  /** 발행 상태 */
  status: 'Draft' | 'Published' | (string & {})
  /** 발행일 ISO 문자열 (date) */
  publishedAt: string | null
  /** 태그 목록 (multi_select) */
  tags: string[]
  /** 카테고리 (select) */
  category: string | null
  /** 요약 (rich_text) — 목록/SEO description */
  excerpt: string | null
  /** 커버 이미지 URL (페이지 cover 또는 files 속성) */
  cover: string | null
  /** 작성자 (rich_text / people) */
  author: string | null
}

/** 본문까지 포함한 글 상세 */
export interface Post extends PostMeta {
  /** Notion 블록 트리를 변환한 마크다운 */
  markdown: string
  /** 마크다운을 변환한 렌더용 HTML (코드 하이라이팅 포함) */
  html: string
}
