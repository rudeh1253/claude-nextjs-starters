# Development Guidelines (Notarie)

> AI Coding Agent 전용 작업 규칙. 이 문서는 **Notarie 프로젝트에만 해당하는 규칙**만 담는다. 일반적인 Next.js/React/TS 지식은 포함하지 않는다.

## 프로젝트 개요

- **Notarie** = Notion 데이터 소스를 **단일 콘텐츠 백엔드**로 쓰는 **읽기 전용 정적 블로그**.
- 기술 스택: Next.js 15.5.3 (App Router + Turbopack) · React 19.1.0 · TypeScript 5 · TailwindCSS v4 · shadcn/ui(new-york) · `@notionhq/client` v5.
- **별도 RDB(Supabase/Prisma 등)를 도입하지 말 것.** 콘텐츠는 Notion에서만 온다. DB 레이어 추가 제안 금지.
- 인증/어드민/글쓰기 UI를 만들지 말 것. 글 작성은 Notion 앱에서 한다. 사이트는 **읽기 전용**이다.
- 진행 상태와 작업 순서는 항상 `docs/ROADMAP.md` 와 `docs/PRD.md` 를 먼저 확인한 뒤 작업한다.

## 프로젝트 아키텍처

### 디렉토리 역할 (반드시 이 위치에 배치)

- `src/lib/env.ts` — 환경변수 zod 스키마. **모든 환경변수 접근의 유일한 출처.**
- `src/lib/notion/` — Notion 데이터 레이어. 모든 Notion API 호출은 여기 안에서만 한다.
  - `client.ts` — 싱글턴 클라이언트 + `data_source_id` 해석. `isNotionConfigured` 재노출.
  - `posts.ts` — 글 쿼리 함수. 파일 맨 위 `import 'server-only'` 필수.
  - `markdown.ts` — 마크다운 → HTML unified 파이프라인.
  - `types.ts` — `PostMeta` / `Post` 타입.
- `src/lib/utils.ts` — `cn()` 유틸. Tailwind 클래스 병합은 반드시 `cn()` 사용.
- `src/app/` — App Router 라우트. ISR 설정(`export const revalidate`)을 페이지에 둔다.
- `src/components/ui/` — shadcn/ui 컴포넌트. **직접 수동 작성 금지** (아래 규칙 참조).
- `src/components/layout/` — `Header`/`Footer`/`Container`.
- `src/components/navigation/` — `MainNav`/`MobileNav`.
- `src/components/content/` — `PostCard`/`PostContent` 등 콘텐츠 표현 컴포넌트.
- `src/components/providers/` — `ThemeProvider` 등 클라이언트 프로바이더.

### 새 코드 배치 결정 트리

- Notion 데이터를 가져오는가? → `src/lib/notion/` 에 함수 추가. 페이지/컴포넌트에서 직접 Notion SDK 호출 **금지**.
- 환경변수가 필요한가? → `src/lib/env.ts` 스키마에 필드 추가 후 `env.*` 로 사용.
- 재사용 UI 표현인가? → `src/components/<영역>/` 에 컴포넌트.
- 라우트(페이지)인가? → `src/app/<route>/page.tsx`.

## 환경변수 규칙 (엄격)

- **`process.env` 를 컴포넌트·페이지·notion 함수에서 직접 읽지 말 것.** 반드시 `src/lib/env.ts` 의 `env` 객체를 import 한다.
- 새 환경변수는 `src/lib/env.ts` 의 `envSchema` 에 추가하고, 같은 파일의 `envSchema.parse({...})` 호출 객체에도 **동시에** 매핑해야 한다 (둘 중 하나만 수정하면 값이 누락된다).
- Notion 관련 환경변수는 **반드시 `.optional()`** 로 둔다. 자격 증명 없이도 `npm run build` 가 성공해야 한다.
- Notion 데이터를 읽는 새 함수는 **항상 `isNotionConfigured` 를 먼저 검사**하고, 미설정이면 안전한 빈 값(`[]`/`null`)을 반환한다.
  - ✅ 올바른 예:
    ```ts
    export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
      if (!isNotionConfigured) return []
      // ... 쿼리
    }
    ```
  - ❌ 금지: 미설정 상태에서 throw 하여 빌드/프리렌더를 깨뜨리는 코드.

## Notion API 사용 규칙

- **2025-09-03 data source 모델만 사용한다.** 쿼리는 `notion.dataSources.query({ data_source_id, ... })` 형태.
  - ❌ 금지: `notion.databases.query(...)` (구식 데이터베이스 쿼리 모델).
- `data_source_id` 는 직접 만들지 말고 `getDataSourceId()` (in `client.ts`) 로 얻는다.
- 클라이언트는 `new Client(...)` 를 새로 만들지 말고 `getNotionClient()` 싱글턴을 쓴다.
- 페이지 결과는 반드시 `isFullPage` 로 필터링한 뒤 매핑한다 (`results.filter(isFullPage)`).
- Notion 컬럼명은 `src/lib/notion/posts.ts` 의 `PROPERTY` 상수에 모아둔다. 컬럼명을 변경하거나 새 속성을 읽을 때는 **문자열을 코드 곳곳에 흩지 말고 `PROPERTY` 객체만 수정**한다.
- 발행 필터 값은 `PUBLISHED_STATUS` 상수(`'Published'`)를 재사용한다. 새 쿼리도 `status === Published` 필터를 반드시 포함한다 (Draft 노출 금지).
- 속성 추출은 기존 `getProperty(props, name, type)` / `richTextToPlain(...)` 헬퍼를 재사용한다. 인라인으로 `properties['x'].rich_text[0]...` 식 접근을 새로 작성하지 말 것.

## 컴포넌트 / 렌더링 규칙

- **서버 컴포넌트가 기본**이다. `'use client'` 는 상호작용(상태/이벤트/브라우저 훅)이 필요한 컴포넌트에만 붙인다 (예: `header.tsx`, `main-nav.tsx`, `mobile-nav.tsx`, `theme-provider.tsx`).
- 데이터 패칭은 서버 컴포넌트(`async function Page()`)에서 `src/lib/notion/*` 함수를 호출해 수행한다. 클라이언트 컴포넌트에서 Notion 함수를 호출하지 말 것.
- 본문 HTML 렌더는 `PostContent` 컴포넌트만 사용한다 (`dangerouslySetInnerHTML` 직접 작성 금지). HTML은 반드시 `markdownToHtml()` 산출물이어야 한다 (신뢰 가능한 빌드 시점 값).
- 이미지는 `next/image` 의 `<Image>` 를 쓴다. 새 외부 이미지 호스트가 필요하면 `next.config.ts` 의 `images.remotePatterns` 에 추가한다.
- 새 페이지 레이아웃은 기존 패턴을 따른다: `<div className="flex min-h-screen flex-col"> <Header /> <main className="flex-1"><Container>...</Container></main> <Footer /> </div>`.
- 너비 제어는 `Container` 의 `size` prop(`sm|md|lg|xl|full`)으로 한다. 임의의 `max-w-*` 를 새로 만들지 말 것.
- 날짜 표기는 기존 `formatDate` 패턴(`Intl.DateTimeFormat('ko-KR', ...)`)을 따른다.

## 스타일링 규칙

- Tailwind 클래스 결합/조건부 클래스는 **반드시 `cn()`** (`@/lib/utils`) 사용. 문자열 직접 결합 금지.
- shadcn 토큰 색상(`text-muted-foreground`, `bg-background`, `text-primary` 등)을 사용한다. 하드코딩 hex 색상 금지.
- 본문(prose) 스타일은 `prose prose-neutral dark:prose-invert` 패턴을 유지한다.

## shadcn/ui 컴포넌트 규칙

- 새 UI 프리미티브가 필요하면 `npx shadcn@latest add <name>` 로 추가한다. `src/components/ui/*.tsx` 를 손으로 새로 작성하지 말 것.
- 설정은 `components.json`(new-york, baseColor neutral, 별칭) 을 기준으로 한다. 이 설정과 다른 스타일/별칭으로 컴포넌트를 추가하지 말 것.
- 아이콘은 `lucide-react` 만 사용한다.

## 경로 / import 규칙

- 절대 경로 별칭 `@/*` = `src/*` 를 사용한다 (예: `@/lib/notion/posts`, `@/components/ui/button`). 페이지/컴포넌트에서 `../../lib` 식 상대경로로 src 루트를 거슬러 올라가지 말 것.
- 같은 디렉토리 내 형제 모듈은 상대경로(`./client`, `./container`) 허용 (기존 `posts.ts`, `header.tsx` 패턴).

## 라우팅 / 네비게이션 동기화 규칙 (다중 파일)

- 전역 네비게이션 항목은 `src/components/navigation/main-nav.tsx` 의 `navItems` 배열이 단일 출처다.
- **`navItems` 에 링크를 추가/변경하면 대응하는 `src/app/<route>/page.tsx` 라우트를 반드시 함께 생성/수정**한다. (현재 `/categories`, `/tags`, `/search`, `/about` 는 링크만 있고 라우트 미존재 — ROADMAP Task 003.)
- `MobileNav` 도 같은 `navItems` 를 사용하도록 유지한다. 데스크톱/모바일 메뉴 항목이 어긋나지 않게 한다.

## 기능 ID(F00X) 주석 규칙

- PRD 기능을 구현하는 함수/컴포넌트에는 기존 코드처럼 관련 기능 ID 주석을 단다 (예: `/** 발행된 글 목록 ... (F001) */`).
- 기능 ID의 정의는 `docs/PRD.md` "기능 명세" 표가 출처다. 새 ID를 임의로 만들지 말 것.

## 언어 규칙

- **코드 주석·UI 텍스트·커밋 메시지·문서는 한국어**로 작성한다 (기존 코드베이스 전체가 한국어).
- 식별자(변수/함수/타입명)는 영어 camelCase/PascalCase 를 유지한다.
- 커밋 메시지는 이모지 + 컨벤셔널 형식을 따른다 (예: `✨ feat:`, `📝 docs:`, `🔧 chore:`).

## 작업 완료 게이트 (필수)

- 코드 변경 후 **반드시** 아래를 통과시킨다:
  ```bash
  npm run check-all   # typecheck + lint + format:check
  npm run build       # 프로덕션 빌드 (Notion 미설정에서도 성공해야 함)
  ```
- Notion 연동/비즈니스 로직 작업은 ROADMAP 규정대로 Playwright MCP E2E 검증을 동반한다.
- TypeScript는 `strict` 모드다. `any` 남용·`@ts-ignore` 추가를 피하고 기존 제네릭 헬퍼 패턴을 활용한다.

## 문서 동기화 규칙 (다중 파일)

- 기능/페이지/Task를 완료하면 `docs/ROADMAP.md` 의 상태(체크박스/✅)를 갱신한다 (`/docs:update-roadmap` 스킬 활용 가능).
- PRD 범위를 바꾸는 변경은 `docs/PRD.md` 와 `docs/ROADMAP.md` 를 함께 갱신한다.
- 기술 스택/명령어가 바뀌면 `CLAUDE.md` 와 `README.md` 를 함께 갱신한다.

## 금지 사항 (Prohibited)

- ❌ 별도 데이터베이스/ORM 도입.
- ❌ 글쓰기·인증·어드민 기능 추가 (읽기 전용 위반).
- ❌ `process.env` 직접 접근 (반드시 `@/lib/env` 의 `env`).
- ❌ `notion.databases.query` 등 구식 모델 사용 (data source 모델만).
- ❌ 페이지/컴포넌트에서 `@notionhq/client` 직접 호출 (반드시 `src/lib/notion/*` 경유).
- ❌ Notion 미설정 시 throw 하여 빌드를 깨뜨리는 코드.
- ❌ `src/components/ui/*` 수동 작성 (shadcn CLI 사용).
- ❌ Tailwind 클래스 문자열 직접 결합 (`cn()` 미사용).
- ❌ MVP 제외 기능(댓글·좋아요·RSS·i18n·다크모드 토글·TOC·본문 풀텍스트 검색)을 요청 없이 구현.
- ❌ Draft 글을 노출하는 쿼리 작성 (`status=Published` 필터 누락).
- ❌ `navItems` 와 실제 라우트를 불일치 상태로 방치.
