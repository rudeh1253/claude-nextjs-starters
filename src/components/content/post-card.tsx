import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { PostMeta } from '@/lib/notion/types'

interface PostCardProps {
  post: PostMeta
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso))
}

/** 목록(홈·태그·카테고리·검색)에서 사용하는 글 카드 (F012) */
export function PostCard({ post }: PostCardProps) {
  const date = formatDate(post.publishedAt)

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <Card className="h-full overflow-hidden pt-0 transition-shadow hover:shadow-md">
        {post.cover && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader>
          {post.category && (
            <span className="text-primary text-xs font-medium">
              {post.category}
            </span>
          )}
          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
          {post.excerpt && (
            <CardDescription className="line-clamp-2">
              {post.excerpt}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {date && (
            <time className="text-muted-foreground text-xs">{date}</time>
          )}
          {post.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  )
}
