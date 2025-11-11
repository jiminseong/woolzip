import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '울집 Woolzip',
  description: '하루 10초, 우리 가족 안심'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-font="md" data-contrast="false">
      <body className="bg-token-bg-subtle text-token-text-primary min-h-dvh">
        <div className="mx-auto max-w-md min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}

