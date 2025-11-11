"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '홈' },
  { href: '/add', label: '+' },
  { href: '/me', label: '내 정보' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="sticky bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t">
      <div className="mx-auto max-w-md grid grid-cols-3">
        {tabs.map(t => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`py-3 text-center ${active ? 'text-token-signal-green font-semibold' : 'text-token-text-secondary'}`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

