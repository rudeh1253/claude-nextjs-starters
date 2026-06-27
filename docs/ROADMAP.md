# Notarie 개발 로드맵

> **Notion 앱에서 글을 쓰면 방문자가 읽는, 별도 어드민 없는 정적 개인 블로그.**

## 개요

**Notarie**는 검색·링크로 유입되는 익명 독자(개발자·기술 관심 일반 독자)를 위한 **Notion 기반 읽기 전용 정적 블로그**입니다. 콘텐츠 저장소는 Notion 데이터 소스 단일 백엔드이며, 별도 RDB는 사용하지 않습니다. SSG + ISR로 정적 생성하고 시간 기반/온디맨드 재검증으로 Notion 변경을 반영합니다.

핵심 가치:

- **읽기 중심 콘텐츠 소비**: 발행 글 목록(F001) → 글 본문 렌더(F002) → 코드 강조(F003)로 이어지는 핵심 독서 경험
- **탐색 동선**: 태그별(F005)·카테고리별(F006) 목록과 키워드 검색(F007)으로 원하는 글에 도달
- **신뢰성 있는 정적 사이트**: 이미지 영구화(F004), SEO 메타(F011), SSG+ISR(F010)로 안정적이고 검색 친화적인 콘텐츠 제공

### 기술 스택

| 구분        | 기술                                                                                |
| ----------- | ----------------------------------------------------------------------------------- |
| 프레임워크  | Next.js 15.5.3 (App Router + Turbopack), React 19.1.0, TypeScript 5                  |
| 스타일링/UI | TailwindCSS v4, shadcn/ui (new-york), Radix UI, Lucide Icons, @tailwindcss/typography |
| 콘텐츠 소스 | Notion — `@notionhq/client` v5 (`2025-09-03` data source 모델, `data_source_id` 쿼리) |
| 렌더링      | `notion-to-md` → unified(remark/rehype) → Shiki/rehype-pretty-code                    |
| 배포        | Vercel (SSG + ISR, 시간 기반/온디맨드 revalidate)                                     |

---

## 프로젝트 완료 기준 (Definition of Done)

MVP는 아래 조건을 **모두** 충족할 때 완료로 간주합니다.

- [ ] **기능**: F001~F008(핵심) + F010~F014(지원) 모든 기능이 동작
- [ ] **페이지**: 홈 / 글 상세 / 태그별 목록 / 카테고리별 목록 / 검색 / 소개 6개 페이지가 모두 구현되고 내비게이션으로 상호 이동 가능
- [ ] **콘텐츠 정확성**: `status=Published` 글만 노출되고 발행일 내림차순 정렬, Draft는 비노출
- [ ] **이미지 신뢰성**: Notion 호스팅 이미지가 만료(약 1시간)되어도 깨지지 않음(영구화 또는 재검증 갱신 검증)
- [ ] **SEO**: 글별 title·description·canonical·OG 메타 생성, `sitemap.xml`·`robots.txt` 제공
- [ ] **동기화**: 시간 기반 ISR + 온디맨드 revalidate로 Notion 발행 변경이 사이트에 반영됨
- [ ] **반응형**: 모바일·데스크톱 레이아웃 정상 동작
- [ ] **품질 게이트**: `npm run check-all`(typecheck + lint + format) 및 `npm run build` 성공
- [ ] **테스트**: 주요 사용자 플로우에 대한 Playwright MCP E2E 시나리오 통과
- [ ] **배포**: Vercel 프로덕션 배포 및 환경변수 구성 완료

---

## 현재 프로젝트 상태 요약

**Notion CMS 부트스트랩 + 핵심 골격이 이미 상당 부분 완료**된 상태입니다.

### ✅ 이미 완료된 것

- **인프라/데이터 레이어**
  - `src/lib/env.ts`: Zod 기반 환경변수 스키마, `isNotionConfigured` 가드 (자격증명 없이도 빌드 성공)
  - `src/lib/notion/client.ts`: 싱글턴 Notion 클라이언트, `data_source_id` 해석 (DATABASE_ID → data source 자동 조회)
  - `src/lib/notion/types.ts`: `PostMeta` / `Post` 타입 (PRD 데이터 모델 반영)
  - `src/lib/notion/posts.ts`: `getPublishedPosts`(F001), `getAllPostSlugs`, `getPostBySlug`(F002/F003) — 페이지네이션·필터·정렬 포함
  - `src/lib/notion/markdown.ts`: unified 파이프라인 + rehype-pretty-code(Shiki) 코드 하이라이팅 (F003)
- **페이지/UI**
  - `src/app/page.tsx`: 홈 — 발행 글 카드 목록 (F001, F012), `revalidate=3600`
  - `src/app/posts/[slug]/page.tsx`: 글 상세 — 본문 렌더(F002/F003), 메타·커버(F012), `generateMetadata`(F011 일부), `generateStaticParams`+ISR
  - 레이아웃: `header`/`footer`/`container`, 내비게이션 `main-nav`/`mobile-nav` (F013, 반응형 F014)
  - 콘텐츠 컴포넌트: `post-card`(F012), `post-content`(F002/F003)
  - 루트 `layout.tsx`: 기본 메타데이터 템플릿, 폰트, 테마 프로바이더
- **설정**: `next.config.ts` 이미지 `remotePatterns`(Notion/S3), 보안 헤더, shadcn/ui 컴포넌트 세트, `.env.example`

### ⚠️ 미완료 / 보완 필요

- **누락 페이지**: 태그별 목록(F005), 카테고리별 목록(F006), 검색(F007), 소개(F008) — 내비게이션 링크만 있고 라우트 미존재
- **F004 이미지 영구화 미구현**: 현재 Notion 호스팅 URL을 `next/image`로 직접 사용 → 약 1시간 후 만료 위험. 빌드 시 다운로드/프록시 영구화 필요
- **F010 온디맨드 재검증 미구현**: 시간 기반 ISR만 존재, 수동 revalidate 웹훅(`/api/revalidate`) 없음
- **F011 SEO 미완**: `sitemap.xml`·`robots.txt`·canonical·동적 OG 이미지 부재
- **목록/태그/카테고리 집계 함수 부재**: 태그·카테고리 목록 추출, 필터링 쿼리 함수 미구현
- **테스트**: Playwright MCP E2E 시나리오 부재

---

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**
   - `/tasks` 디렉토리에 새 작업 파일 생성 (명명: `XXX-description.md`, 예: `001-routing-skeleton.md`)
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
   - **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 (Playwright MCP 시나리오 작성)**
   - 직전 완료 작업을 예시로 참조, 신규 작업은 빈 체크박스 상태로 작성 (`000-sample.md` 참고)

3. **작업 구현**
   - 작업 파일 명세를 따라 구현
   - **Notion API 연동·비즈니스 로직 구현 시 Playwright MCP로 E2E 테스트 수행 필수**
   - 각 단계 후 작업 파일의 진행 상황 업데이트, 단계 완료 시 중단하고 추가 지시 대기
   - `npm run check-all` 및 `npm run build` 통과 확인

4. **로드맵 업데이트**
   - 완료된 작업을 ✅로 표시 (`docs:update-roadmap` 스킬 활용 가능)

### 표기 규칙

- 각 Task는 **ID · 의존성 · 병렬 가능 여부 · 관련 PRD 기능(F00X)** 을 명시
- 의존성: 해당 Task 시작 전 완료되어야 하는 Task ID (`없음`이면 즉시 착수 가능)
- 병렬 가능: 같은 Phase 내 다른 Task와 동시 진행 가능한지 여부

---

## 개발 단계

### Phase 1: 애플리케이션 골격 구축 ✅ (부트스트랩에서 대부분 완료)

데이터 레이어 타입·클라이언트와 핵심 라우트 골격이 부트스트랩 단계에서 구축되었습니다. 누락 라우트 껍데기만 보강합니다.

- **Task 001: 데이터 모델·Notion 클라이언트 골격** ✅ - 완료
  - 관련 기능: F001, F002 · 의존성: 없음 · 병렬 가능: -
  - ✅ `PostMeta`/`Post` 타입 정의 (`src/lib/notion/types.ts`)
  - ✅ 싱글턴 클라이언트 + `data_source_id` 해석 (`src/lib/notion/client.ts`)
  - ✅ 환경변수 Zod 스키마 + `isNotionConfigured` 가드 (`src/lib/env.ts`)

- **Task 002: 핵심 라우트·레이아웃 골격** ✅ - 완료
  - 관련 기능: F013, F014 · 의존성: 없음 · 병렬 가능: -
  - ✅ App Router 기반 루트 레이아웃, 폰트, 테마 프로바이더
  - ✅ 헤더/푸터/컨테이너 + 전역 내비게이션(데스크톱/모바일)
  - ✅ 홈·글 상세 라우트 존재

- **Task 003: 누락 라우트 빈 껍데기 생성** - 우선순위
  - 관련 기능: F005, F006, F007, F008 · 의존성: Task 002 · 병렬 가능: 예
  - 내비게이션이 가리키는 미존재 라우트의 빈 페이지 스캐폴딩 생성
  - `src/app/categories/page.tsx`, `src/app/categories/[category]/page.tsx`
  - `src/app/tags/page.tsx`, `src/app/tags/[tag]/page.tsx`
  - `src/app/search/page.tsx`, `src/app/about/page.tsx`
  - `not-found.tsx`, `loading.tsx`, `error.tsx` 공통 처리 골격
  - 각 페이지는 Header/Footer/Container 골격 + 자리표시자 콘텐츠로 구성 (데이터 연동 제외)

### Phase 2: UI/UX 완성 (더미 데이터 활용)

모든 페이지를 더미 데이터로 시각 완성하여 전체 사용자 플로우를 먼저 체험 가능하게 합니다. 백엔드 연동 없이 UI팀이 독립 진행 가능합니다.

- **Task 004: 공통 콘텐츠 컴포넌트** ✅ - 완료 (보완 여지)
  - 관련 기능: F012 · 의존성: Task 001 · 병렬 가능: 예
  - ✅ `PostCard` (커버·제목·요약·태그·발행일)
  - ✅ `PostContent` (prose 본문 렌더)
  - 보완: 빈 목록/결과 없음 상태 컴포넌트, 태그·카테고리 칩 링크 컴포넌트 추출

- **Task 005: 목록 페이지 UI (태그·카테고리)**
  - 관련 기능: F005, F006, F012, F014 · 의존성: Task 003, Task 004 · 병렬 가능: 예
  - 태그 인덱스(`/tags`)·카테고리 인덱스(`/categories`) 목록 UI (더미 데이터)
  - 태그별(`/tags/[tag]`)·카테고리별(`/categories/[category]`) 글 카드 그리드 + 현재 태그/카테고리명 헤딩
  - 반응형 그리드, 빈 상태 처리

- **Task 006: 검색 페이지 UI**
  - 관련 기능: F007, F014 · 의존성: Task 003, Task 004 · 병렬 가능: 예
  - 검색 입력 폼 + 결과 카드 목록 UI (더미 데이터)
  - 결과 없음 / 초기 안내 상태, URL 쿼리(`?q=`) 연동 골격

- **Task 007: 소개 페이지 UI**
  - 관련 기능: F008, F014 · 의존성: Task 003 · 병렬 가능: 예
  - 정적 소개 콘텐츠 레이아웃 + 외부 링크(연락처/SNS) 표시
  - (선택) Notion 페이지 렌더 대비 구조

- **Task 008: 홈·글 상세 UI 다듬기 + 페이지네이션**
  - 관련 기능: F001, F002, F012, F014 · 의존성: Task 004 · 병렬 가능: 예
  - ✅ 홈 글 카드 목록 / 글 상세 본문·메타·커버 (기존)
  - 홈 페이지네이션 또는 "더 보기" UI 추가
  - 글 상세 내 태그·카테고리 클릭 동선(목록으로 링크) 연결

### Phase 3: 핵심 기능 구현 (Notion 실데이터 연동)

더미 데이터를 실제 Notion 데이터 소스 쿼리로 교체하고 핵심 비즈니스 로직을 구현합니다. **각 Task는 Playwright MCP E2E 테스트를 동반합니다.**

- **Task 009: 태그·카테고리 집계 및 필터 쿼리** - 우선순위
  - 관련 기능: F005, F006 · 의존성: Task 005 · 병렬 가능: 예
  - `getAllTags()` / `getAllCategories()` (발행 글 기준 집계 + 카운트)
  - `getPostsByTag(tag)` / `getPostsByCategory(category)` 필터 쿼리 (`data_source_id` 기반)
  - `generateStaticParams`로 태그/카테고리 동적 라우트 정적 생성
  - 목록 페이지 더미 데이터를 실제 쿼리로 교체
  - **테스트 체크리스트**: 태그/카테고리별 정확 필터링, Published만 노출, 빈 결과 처리, 없는 태그 404

- **Task 010: 이미지 영구화 (F004)** - 우선순위
  - 관련 기능: F004 · 의존성: Task 001 · 병렬 가능: 예
  - 만료되는 Notion 호스팅 이미지(커버·본문)를 빌드 시 다운로드 또는 프록시로 영구화
  - 본문 마크다운/HTML 내 이미지 URL 치환 파이프라인 (`markdown.ts`/`posts.ts` 연계)
  - 영구화된 자산 경로 매핑(`originUrl → storedUrl`) 처리, `next/image` 연동 정리
  - **테스트 체크리스트**: 빌드 산출물에 이미지가 깨지지 않고 표시, 만료 URL 직접 의존 제거 확인

- **Task 011: 글 검색 로직 (F007)**
  - 관련 기능: F007 · 의존성: Task 006, Task 009 · 병렬 가능: 예
  - 제목·요약·태그 기준 키워드 매칭(MVP는 본문 풀텍스트 제외)
  - 발행 글 메타를 기반으로 한 클라이언트/서버 필터링, `?q=` 쿼리 연동
  - 결과 없음·초기 상태 처리
  - **테스트 체크리스트**: 제목/요약/태그 매칭 정확도, 대소문자·공백 처리, 결과 없음 안내, 결과 클릭 → 글 상세 이동

- **Task 012: 소개 페이지 콘텐츠 연동 (F008)**
  - 관련 기능: F008 · 의존성: Task 007 · 병렬 가능: 예
  - 정적 소개 콘텐츠 확정 또는 Notion 페이지 렌더 연동
  - 외부 링크 구성 확정
  - **테스트 체크리스트**: 소개 콘텐츠 렌더, 외부 링크 정상 동작

- **Task 013: ISR 온디맨드 재검증 (F010)**
  - 관련 기능: F010 · 의존성: Task 009 · 병렬 가능: 예
  - 시간 기반 `revalidate` 정책 정리(전 페이지 일관성)
  - `/api/revalidate` Route Handler — `NOTION_REVALIDATE_SECRET` 검증 + `revalidatePath`/`revalidateTag`
  - Notion 발행 변경 → 수동/웹훅 트리거 동기화 흐름 정의
  - **테스트 체크리스트**: 시크릿 없는 요청 거부(401), 유효 요청 시 대상 경로 재검증, 발행 변경 반영 확인

- **Task 014: 핵심 기능 통합 E2E 테스트**
  - 관련 기능: F001~F008, F010 · 의존성: Task 009~013 · 병렬 가능: 아니오
  - Playwright MCP로 전체 사용자 여정 검증: 홈 → 글 상세 → 태그/카테고리 → 목록 → 다른 글 / 검색 → 결과 → 글 상세 / 소개
  - 엣지 케이스: 빈 목록, 없는 slug 404, Notion 미설정 시 안전 렌더, 이미지 만료 대응
  - 에러 핸들링(`error.tsx`/`not-found.tsx`) 동작 검증

### Phase 4: SEO·최적화·배포

검색 유입 최적화와 성능, 배포 파이프라인을 마무리합니다.

- **Task 015: SEO 메타데이터 완성 (F011)**
  - 관련 기능: F011 · 의존성: Task 009, Task 010 · 병렬 가능: 예
  - 글별 canonical, OG/Twitter 카드, 동적 OG 이미지(`opengraph-image`) 생성
  - `app/sitemap.ts`(발행 글·태그·카테고리 포함), `app/robots.ts`
  - 목록·소개 페이지 메타데이터 보강, `NEXT_PUBLIC_SITE_URL` 기반 절대 URL
  - **테스트 체크리스트**: 메타 태그 렌더 확인, sitemap/robots 응답, OG 이미지 생성

- **Task 016: 성능 최적화 및 접근성 (F014)**
  - 관련 기능: F014 · 의존성: Task 014 · 병렬 가능: 예
  - 이미지 sizes/우선순위 점검, 폰트·번들 최적화, `optimizePackageImports` 검증
  - 반응형·접근성(시맨틱 마크업, 키보드 내비, 대비) 점검
  - Lighthouse/Core Web Vitals 기준 확인

- **Task 017: 배포 및 운영 구성**
  - 관련 기능: F010, 전역 · 의존성: Task 013, Task 015 · 병렬 가능: 아니오
  - Vercel 프로젝트 연결, 환경변수(`NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID`/`NOTION_DATABASE_ID`, `NOTION_REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL`) 설정
  - 프로덕션 빌드/SSG+ISR 동작 검증, 도메인 연결
  - 온디맨드 재검증 웹훅 운영 연결, 기본 모니터링/로깅 확인
  - **테스트 체크리스트**: 프로덕션 배포 후 전체 플로우 스모크 테스트, 재검증 트리거 동작

---

## Task 의존성·병렬화 요약

```
Phase 1 (골격)
  001 ✅ ─┐
  002 ✅ ─┼─→ 003 (우선순위, 누락 라우트 골격)
         │
Phase 2 (UI / 병렬 진행 가능)
  004 ✅(보완) ─┬─→ 005 ┐
               ├─→ 006 ┤  (003 + 004 이후 005·006·007·008 병렬)
  003 ─────────┼─→ 007 ┤
               └─→ 008 ┘
Phase 3 (실데이터 / 대부분 병렬, 014에서 합류)
  005 → 009 (우선순위) ┐
  001 → 010 (우선순위) ┤
  006,009 → 011        ┼─→ 014 (통합 E2E, 직렬)
  007 → 012            ┤
  009 → 013            ┘
Phase 4 (마무리)
  009,010 → 015 ┐
  014 → 016     ┼─→ 017 (배포, 직렬)
  013,015 ──────┘
```

- **즉시 착수(우선순위)**: Task 003 → 이후 Task 009, Task 010
- **병렬 묶음**: (005·006·007·008), (009·010·012·013) 은 서로 독립적으로 동시 진행 가능
- **직렬 합류 지점**: Task 014(통합 E2E) → Task 017(배포)는 선행 작업 완료 필수
