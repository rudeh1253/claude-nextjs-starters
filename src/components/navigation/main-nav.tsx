'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
}

/** 전역 내비게이션 항목 (PRD F013) */
export const navItems: NavItem[] = [
  { title: '홈', href: '/' },
  { title: '카테고리', href: '/categories' },
  { title: '태그', href: '/tags' },
  { title: '검색', href: '/search' },
  { title: '소개', href: '/about' },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6 lg:space-x-8">
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'hover:text-primary text-sm font-medium transition-colors',
            pathname === item.href ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
