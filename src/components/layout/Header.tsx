'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

export default function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2" aria-label="ホームに戻る">
              <div className="text-xl font-bold text-blue-600">
                アイキューブ
              </div>
              <div className="text-sm text-gray-600">
                本部便発送システム
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="メインナビゲーション">
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-blue-600 transition-colors focus:text-blue-600"
            >
              ダッシュボード
            </Link>
            <Link 
              href="/items" 
              className="text-gray-700 hover:text-blue-600 transition-colors focus:text-blue-600"
            >
              備品管理
            </Link>
            <Link 
              href="/shipments" 
              className="text-gray-700 hover:text-blue-600 transition-colors focus:text-blue-600"
            >
              発送管理
            </Link>
            {user.role === 'MANAGEMENT_USER' && (
              <Link 
                href="/reports" 
                className="text-gray-700 hover:text-blue-600 transition-colors focus:text-blue-600"
              >
                レポート
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 hidden sm:block" aria-label={`ログイン中: ${user.name}, 部署: ${user.department?.name}`}>
              {user.name} ({user.department?.name})
            </div>
            
            <button
              className="md:hidden p-2 text-gray-400 hover:text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="メニューを開く"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Button variant="secondary" size="sm" onClick={logout}>
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-200 bg-gray-50" role="navigation" aria-label="モバイルナビゲーション">
          <nav className="px-4 py-2 space-y-1">
            <div className="px-3 py-2 text-sm text-gray-600 sm:hidden">
              {user.name} ({user.department?.name})
            </div>
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md focus:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              ダッシュボード
            </Link>
            <Link 
              href="/items" 
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md focus:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              備品管理
            </Link>
            <Link 
              href="/shipments" 
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md focus:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              発送管理
            </Link>
            {user.role === 'MANAGEMENT_USER' && (
              <Link 
                href="/reports" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md focus:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                レポート
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}