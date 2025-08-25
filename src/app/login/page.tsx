'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, loginWithEntraId, loading } = useAuth()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEntraIdLogin = async () => {
    setError('')
    try {
      await loginWithEntraId()
    } catch (err: any) {
      setError(err.message || 'Azure ADログインに失敗しました。')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            アイキューブ
          </h1>
          <h2 className="text-xl font-medium text-gray-700">
            本部便発送システム
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle as="h2">ログイン</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <div className="space-y-6">
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleEntraIdLogin}
                  className="w-full"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
                    <path
                      fill="currentColor"
                      d="M1 1h10v10H1zM12 1h10v10H12zM12 12h10v10H12zM1 12h4.5v4.5H1zM6.5 12H11v4.5H6.5zM1 17.5h4.5V22H1zM6.5 17.5H11V22H6.5z"
                    />
                  </svg>
                  Microsoft Entra ID でログイン
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <Input
                  id="email"
                  label="メールアドレス"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="your.name@icube.co.jp"
                />

                <Input
                  id="password"
                  label="パスワード"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || !email || !password}
                  className="w-full"
                >
                  ログイン
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>
            本システムは、アイキューブ社内専用システムです。
            <br />
            アクセスには適切な認証が必要です。
          </p>
        </div>
      </div>
    </div>
  )
}