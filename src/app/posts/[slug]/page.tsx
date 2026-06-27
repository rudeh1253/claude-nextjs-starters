import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { PostContent } from '@/components/content/post-content'
import { Container } from '@/components/layout/container'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { getAllPostSlugs, getPostBySlug } from '@/lib/notion/posts'

// ISR: 1시간마다 재검증 (F010)
export const revalidate = 3600
// 빌드 시점에 알 수 없는 slug 는 요청 시 생성 후 캐시
export const dynamicParams = true

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getAllPostSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  }
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso))
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const date = formatDate(post.publishedAt)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Container size="md" className="py-10">
          <article>
            <header className="mb-8">
              {post.category && (
                <span className="text-primary text-sm font-medium">
                  {post.category}
                </span>
              )}
              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                {post.title}
              </h1>
              <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-3 text-sm">
                {post.author && <span>{post.author}</span>}
                {date && <time>{date}</time>}
              </div>
              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {post.cover && (
                <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-lg">
                  <Image
                    src={post.cover}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
              )}
            </header>

            <PostContent html={post.html} />
          </article>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
