import { z } from 'zod'

/**
 * 환경변수 스키마.
 *
 * Notion 관련 값은 모두 optional 입니다. 자격 증명 없이도 빌드(`npm run build`)가
 * 성공해야 하므로(SSG 사전 렌더링 단계에서 throw 방지) 데이터 레이어에서
 * `isNotionConfigured`로 구성 여부를 검사한 뒤 안전하게 빈 결과를 반환합니다.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  VERCEL_URL: z.string().optional(),
  /** 사이트 공개 URL (SEO canonical / OG 메타에 사용) */
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  /** Notion 내부 인테그레이션 시크릿 (ntn_...) */
  NOTION_TOKEN: z.string().optional(),
  /** Notion 데이터베이스 ID (data source ID 미지정 시 이 값으로 조회) */
  NOTION_DATABASE_ID: z.string().optional(),
  /** Notion data source ID (2025-09-03 API, 쿼리 기준 — 지정 시 우선 사용) */
  NOTION_DATA_SOURCE_ID: z.string().optional(),
  /** 온디맨드 재검증(ISR revalidate) 웹훅 보호용 시크릿 */
  NOTION_REVALIDATE_SECRET: z.string().optional(),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NOTION_TOKEN: process.env.NOTION_TOKEN,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  NOTION_DATA_SOURCE_ID: process.env.NOTION_DATA_SOURCE_ID,
  NOTION_REVALIDATE_SECRET: process.env.NOTION_REVALIDATE_SECRET,
})

export type Env = z.infer<typeof envSchema>

/** Notion 연동에 필요한 최소 환경변수가 모두 설정되었는지 여부 */
export const isNotionConfigured = Boolean(
  env.NOTION_TOKEN && (env.NOTION_DATA_SOURCE_ID || env.NOTION_DATABASE_ID)
)
