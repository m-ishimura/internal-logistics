'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SkipLink } from '@/components/ui/SkipLink'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <LoadingSpinner size="lg" />
        <span className="sr-only">アプリケーションを読み込み中...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <SkipLink />
        <main id="main-content" role="main">
          {children}
        </main>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SkipLink />
      <Header />
      <main 
        id="main-content" 
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
        role="main"
      >
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  )
}