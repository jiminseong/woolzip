"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '타임라인' },
  { href: '/me#meds', label: '복용약', anchor: true },
  { href: '/add', label: '+', isAction: true },
  { href: '/quiz', label: '가족문답' },
  { href: '/me#settings', label: '설정', anchor: true },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="sticky bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t">
      <div className="mx-auto max-w-md grid grid-cols-5">
        {tabs.map(t => {
          const base = t.href.split('#')[0]
          const active = pathname === base
          const isAnchor = t.anchor && pathname === base
          const activeState = active || isAnchor
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`py-3 text-center text-xs ${
                t.isAction
                  ? 'text-white'
                  : activeState
                    ? 'text-token-accent font-semibold'
                    : 'text-token-text-secondary'
              }`}
            >
              {t.isAction ? (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-token-accent shadow-md">
                  {t.label}
                </span>
              ) : (
                t.label
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
