import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import SearchModal from '@/components/layout/SearchModal'
import MobileSidebar from '@/components/layout/MobileSidebar'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'FastAPI Mastery — From FastAPI Developer to Production Backend Engineer',
  description: 'Master FastAPI. Build production-grade backend systems with PostgreSQL, Redis, Celery, WebSockets, Docker, Kubernetes, CI/CD and modern backend architecture.',
  keywords: ['FastAPI', 'Python', 'backend engineering', 'production', 'PostgreSQL', 'Redis', 'Kubernetes', 'Docker', 'microservices'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header />
        <MobileSidebar />
        <SearchModal />
        {children}
      </body>
    </html>
  )
}
