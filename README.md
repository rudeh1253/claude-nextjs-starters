# Notarie

Notion 으로 작성·발행하면 방문자가 읽기 전용으로 소비하는 정적 개인 블로그 (Next.js 15 App Router · SSG + ISR).

요구사항은 [`docs/PRD.md`](docs/PRD.md), 개발 지침은 [`CLAUDE.md`](CLAUDE.md) 를 참고하세요.

## 기술 스택

- Next.js 15.5.3 (App Router, Turbopack) · React 19 · TypeScript 5
- TailwindCSS v4 + shadcn/ui (new-york) + Lucide React
- 콘텐츠 백엔드: Notion (`@notionhq/client` v5, API `2025-09-03` data source 모델)
- 본문 렌더링: `notion-to-md`(블록 → 마크다운) + unified/remark/rehype + `rehype-pretty-code`(Shiki 코드 하이라이팅)

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

### 환경변수

| 변수                       | 필수 | 설명                                         |
| -------------------------- | ---- | -------------------------------------------- |
| `NOTION_TOKEN`             | ✅   | Notion 내부 인테그레이션 시크릿 (`ntn_...`)  |
| `NOTION_DATA_SOURCE_ID`    | △    | data source ID. 지정 시 우선 사용            |
| `NOTION_DATABASE_ID`       | △    | data source ID 미지정 시 이 값으로 자동 조회 |
| `NOTION_REVALIDATE_SECRET` | ⬜   | 온디맨드 재검증 웹훅 보호용                  |
| `NEXT_PUBLIC_SITE_URL`     | ⬜   | SEO canonical / OG 메타용 사이트 URL         |

`NOTION_DATA_SOURCE_ID` 또는 `NOTION_DATABASE_ID` 중 **하나는 반드시** 설정해야 합니다.
Notion DB 의 컬럼명은 `src/lib/notion/posts.ts` 의 `PROPERTY` 상수에서 조정합니다.

## 주요 명령어

```bash
npm run dev         # 개발 서버 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # typecheck + lint + format 검사
```

## 배포

Vercel 권장. 환경변수를 프로젝트 설정에 등록하면 SSG + ISR 로 동작합니다.
