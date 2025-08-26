'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
        <main id="main-content" role="main">
          {children}
        </main>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main 
        id="main-content" 
        className="w-full py-6"
        role="main"
      >
        {children}
      </main>
    </div>
  )
}