'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User, AuthContextType } from '@/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // ページがログインページでない場合のみ認証チェック
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      // 少し待ってからAPIを呼び出す（Cookie設定の時間を確保）
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const jsonData = await response.json()
        if (jsonData.success && jsonData.data) {
          setUser(jsonData.data)
        }
      } else if (response.status !== 401) {
        // 401以外のエラーのみログ出力
        console.error('Auth check failed with status:', response.status)
      }
      // 401エラーは未ログイン状態として想定内なので何もしない
    } catch (error) {
      // ネットワークエラーなど予期しないエラーのみログ出力
      console.error('Auth check network error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ログイン後などに明示的に呼び出す認証チェック
  const refreshAuth = async () => {
    await checkAuth()
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('[AuthContext] Starting login...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const { data } = await response.json()
      console.log('[AuthContext] Login successful, setting user:', data)
      setUser(data)
      
      console.log('[AuthContext] Navigating to dashboard...')
      // Use router.push instead of window.location.href
      router.push('/dashboard')
      
      // ナビゲーション後に認証状態を確認
      setTimeout(() => refreshAuth(), 200)
    } catch (error) {
      console.error('[AuthContext] Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithEntraId = async () => {
    setLoading(true)
    try {
      // Redirect to Entra ID auth endpoint
      window.location.href = '/api/auth/entra-id'
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithEntraId,
      logout,
      loading,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}