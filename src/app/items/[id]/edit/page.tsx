'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Button, 
  Input, 
  Select,
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Alert
} from '@/components/ui'
import type { Item, Department } from '@/types'

interface EditItemPageProps {
  params: Promise<{ id: string }>
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [item, setItem] = useState<Item | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    departmentId: 0
  })
  const [itemId, setItemId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setItemId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (itemId && user) {
      fetchItem()
      if (user.role === 'MANAGEMENT_USER') {
        fetchDepartments()
      }
    }
  }, [itemId, user])

  const fetchItem = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/items/${itemId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '備品の取得に失敗しました')
      }

      const data = await response.json()
      setItem(data.data)
      setFormData({
        name: data.data.name,
        unit: data.data.unit,
        departmentId: data.data.departmentId
      })
    } catch (err: any) {
      setError(err.message)
      // 権限がない場合や備品が見つからない場合は一覧に戻る
      if (err.message.includes('Access denied') || err.message.includes('not found')) {
        router.push('/items')
      }
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '備品の更新に失敗しました')
      }

      router.push('/items')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDelete = async () => {
    if (!window.confirm('この備品を削除してもよろしいですか？\n※発送履歴がある備品は削除できません。')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '備品の削除に失敗しました')
      }

      router.push('/items')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">備品が見つかりません</h1>
          <Button onClick={() => router.push('/items')}>
            備品一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">備品を編集</h1>
            <p className="mt-2 text-gray-600">
              備品「{item.name}」の情報を編集します
            </p>
            {item._count && (
              <p className="mt-1 text-sm text-gray-500">
                発送履歴: {item._count.shipments}回
              </p>
            )}
          </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>備品情報</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  id="name"
                  label="備品名"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="例: オフィス用品セット"
                  help="分かりやすい備品名を入力してください"
                />

                <Input
                  id="unit"
                  label="単位"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  required
                  placeholder="例: 個, セット, 台"
                  help="数量の単位を入力してください"
                />

                {user.role === 'MANAGEMENT_USER' && (
                  <Select
                    id="departmentId"
                    label="担当部署"
                    value={formData.departmentId.toString()}
                    onChange={(e) => handleChange('departmentId', parseInt(e.target.value))}
                    required
                    help="この備品を管理する部署を選択してください"
                  >
                    <option value="">部署を選択してください</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                )}

                <div className="border-t pt-6">
                  <div className="flex justify-between">
                    <div className="flex gap-4">
                      <Button type="submit" loading={loading} disabled={loading}>
                        更新する
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => router.back()}
                        disabled={loading}
                      >
                        キャンセル
                      </Button>
                    </div>
                    <Button 
                      type="button" 
                      variant="error"
                      onClick={handleDelete}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      削除
                    </Button>
                  </div>
                  {item._count && item._count.shipments > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ※ 発送履歴がある備品は削除できません
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}