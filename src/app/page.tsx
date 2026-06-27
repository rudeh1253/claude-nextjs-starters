import { PostCard } from '@/components/content/post-card'
import { Container } from '@/components/layout/container'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getPublishedPosts } from '@/lib/notion/posts'

// ISR: 1시간마다 재검증 (F010)
export const revalidate = 3600

export default async function Home() {
  const posts = await getPublishedPosts()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Container className="py-10">
          <h1 className="mb-8 text-3xl font-bold tracking-tight">최신 글</h1>

          {posts.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
              <p className="font-medium">아직 표시할 글이 없습니다.</p>
              <p className="mt-1">
                Notion 연동을 설정하려면 <code>.env.local</code> 에{' '}
                <code>NOTION_TOKEN</code> 과 <code>NOTION_DATA_SOURCE_ID</code>
                (또는 <code>NOTION_DATABASE_ID</code>)를 추가하세요.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  )
}
