'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

export default function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)

  if (!user) return null

  return (
    <header className="bg-white backdrop-blur-lg bg-white/95 shadow-lg sticky top-0 z-50 border-b border-gray-100" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-20">
          {/* Logo Section - Left */}
          <div className="absolute left-4 sm:left-6 lg:left-8 flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3" aria-label="ホームに戻る">
              <div className="w-12 h-12 flex items-center justify-center">
                <Image 
                  src="/A6.png"
                  alt="i-cube logo"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <div className="text-xl font-bold text-gray-900">
                  アイキューブ
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  本部便発送システム
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation - Center */}
          <nav className="hidden md:flex items-center" role="navigation" aria-label="メインナビゲーション" style={{gap: '4rem'}}>
            <Link 
              href="/dashboard" 
              className="relative px-8 py-4 text-lg font-bold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50 rounded-lg group"
            >
              ダッシュボード
              <span className="absolute inset-x-0 -bottom-1 h-1 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            <Link 
              href="/items" 
              className="relative px-8 py-4 text-lg font-bold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50 rounded-lg group"
            >
              備品管理
              <span className="absolute inset-x-0 -bottom-1 h-1 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            <Link 
              href="/shipments" 
              className="relative px-8 py-4 text-lg font-bold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50 rounded-lg group"
            >
              発送管理
              <span className="absolute inset-x-0 -bottom-1 h-1 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            {user.role === 'MANAGEMENT_USER' && (
              <div className="relative" onMouseLeave={() => setAdminMenuOpen(false)}>
                <button
                  onMouseEnter={() => setAdminMenuOpen(true)}
                  className="relative px-8 py-4 text-lg font-bold text-gray-700 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50 rounded-lg group flex items-center space-x-1"
                >
                  管理者メニュー
                  <svg className="w-4 h-4 ml-1 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: adminMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="absolute inset-x-0 -bottom-1 h-1 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </button>
                
                {adminMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-lg border border-gray-100 py-2 z-50">
                    <Link 
                      href="/departments"
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      部署管理
                    </Link>
                    <Link 
                      href="/users"
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      ユーザー管理
                    </Link>
                    <Link 
                      href="/reports"
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      レポート
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right Section */}
          <div className="absolute right-4 sm:right-6 lg:right-8 flex items-center space-x-6">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3" aria-label={`ログイン中: ${user.name}, 部署: ${user.department?.name}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">{user.department?.name}</span>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="メニューを開く"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-red-300 shadow-sm"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg" role="navigation" aria-label="モバイルナビゲーション">
          <nav className="px-6 py-4 space-y-2">
            {/* Mobile User Info */}
            <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-xl mb-4 sm:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">{user.department?.name}</span>
              </div>
            </div>

            <Link 
              href="/dashboard" 
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              ダッシュボード
            </Link>
            <Link 
              href="/items" 
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              備品管理
            </Link>
            <Link 
              href="/shipments" 
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              発送管理
            </Link>
            {user.role === 'MANAGEMENT_USER' && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  管理者メニュー
                </div>
                <Link 
                  href="/departments"
                  className="block px-6 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  部署管理
                </Link>
                <Link 
                  href="/users"
                  className="block px-6 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ユーザー管理
                </Link>
                <Link 
                  href="/reports" 
                  className="block px-6 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  レポート
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}