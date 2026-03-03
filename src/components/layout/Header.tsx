'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const pathname = usePathname()

  if (!user) return null

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const navLinkClass = (href: string) =>
    [
      'relative px-5 py-3 text-sm font-semibold rounded-md transition-all duration-200',
      isActive(href)
        ? 'text-white bg-white/20'
        : 'text-slate-200 hover:text-white hover:bg-white/10',
    ].join(' ')

  return (
    <header
      className="bg-slate-800 shadow-md sticky top-0 z-50"
      role="banner"
    >
      <div className="px-8 sm:px-12 lg:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5"
              aria-label="ホームに戻る"
            >
              <div className="w-9 h-9 flex items-center justify-center">
                <Image
                  src="/A6.png"
                  alt="i-cube logo"
                  width={36}
                  height={36}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold text-white tracking-tight">
                  アイキューブ
                </span>
                <span className="text-xs text-slate-400 hidden sm:block">
                  本部便発送システム
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation — Center (desktop) */}
          <nav
            className="hidden md:flex items-center gap-2"
            role="navigation"
            aria-label="メインナビゲーション"
          >
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              ダッシュボード
              {isActive('/dashboard') && (
                <span className="absolute inset-x-2 -bottom-[1px] h-0.5 bg-white rounded-full" />
              )}
            </Link>
            <Link href="/items" className={navLinkClass('/items')}>
              備品管理
              {isActive('/items') && (
                <span className="absolute inset-x-2 -bottom-[1px] h-0.5 bg-white rounded-full" />
              )}
            </Link>
            <Link href="/shipments" className={navLinkClass('/shipments')}>
              発送管理
              {isActive('/shipments') && (
                <span className="absolute inset-x-2 -bottom-[1px] h-0.5 bg-white rounded-full" />
              )}
            </Link>
            <a
              href="https://www.notion.so/i-cube-regulations-manuals/26393ea640b48015be95e036a6062911"
              target="_blank"
              rel="noopener noreferrer"
              className="relative px-5 py-3 text-sm font-semibold rounded-md text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-1.5"
            >
              マニュアル
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            {user.role === 'MANAGEMENT_USER' && (
              <div className="relative" onMouseLeave={() => setAdminMenuOpen(false)}>
                <button
                  onMouseEnter={() => setAdminMenuOpen(true)}
                  className={[
                    'relative px-5 py-3 text-sm font-semibold rounded-md transition-all duration-200 flex items-center gap-1',
                    (isActive('/departments') || isActive('/users'))
                      ? 'text-white bg-white/20'
                      : 'text-slate-200 hover:text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  管理者メニュー
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${adminMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {adminMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white shadow-lg rounded-xl border border-gray-200 py-1 z-50">
                    <Link
                      href="/departments"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      部署管理
                    </Link>
                    <Link
                      href="/users"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      ユーザー管理
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-5">
            {/* User Info (desktop) */}
            <div
              className="hidden sm:flex items-center gap-2.5"
              aria-label={`ログイン中: ${user.name}, 部署: ${user.department?.name}`}
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-white">{user.name}</span>
                <span className="text-xs text-slate-400">{user.department?.name}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-all duration-200 border border-slate-600 hover:border-red-500"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ログアウト
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="メニューを開く"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white border-t border-gray-200 shadow-lg"
          role="navigation"
          aria-label="モバイルナビゲーション"
        >
          <div className="px-4 py-3 space-y-1">
            {/* Mobile User Info */}
            <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-xl mb-3 sm:hidden">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.department?.name}</div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive('/dashboard') ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              ダッシュボード
            </Link>
            <Link
              href="/items"
              className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive('/items') ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              備品管理
            </Link>
            <Link
              href="/shipments"
              className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive('/shipments') ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              発送管理
            </Link>
            <a
              href="https://www.notion.so/i-cube-regulations-manuals/26393ea640b48015be95e036a6062911"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              マニュアル
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {user.role === 'MANAGEMENT_USER' && (
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  管理者メニュー
                </div>
                <Link
                  href="/departments"
                  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive('/departments') ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  部署管理
                </Link>
                <Link
                  href="/users"
                  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive('/users') ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ユーザー管理
                </Link>
              </div>
            )}

            <div className="border-t border-gray-100 pt-2 mt-2">
              <button
                onClick={() => { setMobileMenuOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
