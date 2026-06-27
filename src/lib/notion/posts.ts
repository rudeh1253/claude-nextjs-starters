import 'server-only'

import { isFullPage } from '@notionhq/client'
import type {
  PageObjectResponse,
  QueryDataSourceResponse,
} from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'

import { getDataSourceId, getNotionClient, isNotionConfigured } from './client'
import { markdownToHtml } from './markdown'
import type { Post, PostMeta } from './types'

/**
 * Notion 데이터베이스의 속성(컬럼) 이름.
 * 실제 Notion DB 의 컬럼명에 맞춰 수정하세요. (PRD 데이터 모델 기준 기본값)
 */
const PROPERTY = {
  title: 'Title',
  slug: 'Slug',
  status: 'Status',
  publishedAt: 'PublishedAt',
  tags: 'Tags',
  category: 'Category',
  excerpt: 'Excerpt',
  author: 'Author',
} as const

const PUBLISHED_STATUS = 'Published'

type Properties = PageObjectResponse['properties']
type PropertyValue = Properties[string]

function richTextToPlain(
  value: Extract<PropertyValue, { type: 'rich_text' }> | undefined
): string | null {
  if (!value) return null
  const text = value.rich_text
    .map(part => part.plain_text)
    .join('')
    .trim()
  return text.length > 0 ? text : null
}

function getProperty<T extends PropertyValue['type']>(
  properties: Properties,
  name: string,
  type: T
): Extract<PropertyValue, { type: T }> | undefined {
  const value = properties[name]
  if (value?.type === type) {
    return value as Extract<PropertyValue, { type: T }>
  }
  return undefined
}

function getCoverUrl(page: PageObjectResponse): string | null {
  const cover = page.cover
  if (!cover) return null
  return cover.type === 'external' ? cover.external.url : cover.file.url
}

/** Notion 페이지 객체를 PostMeta 로 매핑 */
function mapPageToMeta(page: PageObjectResponse): PostMeta {
  const props = page.properties

  const titleProp = getProperty(props, PROPERTY.title, 'title')
  const title =
    titleProp?.title
      .map(part => part.plain_text)
      .join('')
      .trim() ?? ''

  const statusProp = getProperty(props, PROPERTY.status, 'status')
  const dateProp = getProperty(props, PROPERTY.publishedAt, 'date')
  const tagsProp = getProperty(props, PROPERTY.tags, 'multi_select')
  const categoryProp = getProperty(props, PROPERTY.category, 'select')

  // 작성자: rich_text 또는 people 속성 모두 허용
  const authorRichText = getProperty(props, PROPERTY.author, 'rich_text')
  const authorPeople = getProperty(props, PROPERTY.author, 'people')
  const author =
    richTextToPlain(authorRichText) ??
    authorPeople?.people
      .map(person => ('name' in person ? person.name : null))
      .filter((name): name is string => Boolean(name))
      .join(', ') ??
    null

  return {
    id: page.id,
    title,
    slug: richTextToPlain(getProperty(props, PROPERTY.slug, 'rich_text')) ?? '',
    status: statusProp?.status?.name ?? 'Draft',
    publishedAt: dateProp?.date?.start ?? null,
    tags: tagsProp?.multi_select.map(tag => tag.name) ?? [],
    category: categoryProp?.select?.name ?? null,
    excerpt: richTextToPlain(getProperty(props, PROPERTY.excerpt, 'rich_text')),
    cover: getCoverUrl(page),
    author,
  }
}

/**
 * 발행(Published)된 글 목록을 발행일 내림차순으로 반환합니다. (F001)
 * Notion 미설정 시 빈 배열을 반환해 빌드가 실패하지 않도록 합니다.
 */
export async function getPublishedPosts(): Promise<PostMeta[]> {
  if (!isNotionConfigured) return []

  const notion = getNotionClient()
  const dataSourceId = await getDataSourceId()

  const results: QueryDataSourceResponse['results'] = []
  let cursor: string | undefined

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      filter: {
        property: PROPERTY.status,
        status: { equals: PUBLISHED_STATUS },
      },
      sorts: [{ property: PROPERTY.publishedAt, direction: 'descending' }],
    })
    results.push(...response.results)
    cursor = response.next_cursor ?? undefined
  } while (cursor)

  return results.filter(isFullPage).map(mapPageToMeta)
}

/** generateStaticParams 용 — 발행 글의 slug 목록 */
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts()
  return posts.map(post => post.slug).filter(slug => slug.length > 0)
}

/**
 * slug 로 단일 발행 글의 본문(마크다운/HTML)까지 포함해 반환합니다. (F002, F003)
 * 없으면 null.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isNotionConfigured) return null

  const notion = getNotionClient()
  const dataSourceId = await getDataSourceId()

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    filter: {
      and: [
        { property: PROPERTY.slug, rich_text: { equals: slug } },
        { property: PROPERTY.status, status: { equals: PUBLISHED_STATUS } },
      ],
    },
  })

  const page = response.results.find(isFullPage)
  if (!page) return null

  const meta = mapPageToMeta(page)

  const n2m = new NotionToMarkdown({ notionClient: notion })
  const mdBlocks = await n2m.pageToMarkdown(page.id)
  const markdown = n2m.toMarkdownString(mdBlocks).parent ?? ''
  const html = await markdownToHtml(markdown)

  return { ...meta, markdown, html }
}
