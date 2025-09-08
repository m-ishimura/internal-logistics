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
import type { Department } from '@/types'

export default function NewItemPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    departmentId: 0
  })

  useEffect(() => {
    if (user?.role === 'MANAGEMENT_USER') {
      fetchDepartments()
    }
    if (user) {
      setFormData(prev => ({ ...prev, departmentId: user.departmentId }))
    }
  }, [user])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments?limit=1000&forShipment=true&sortBy=id&sortOrder=asc', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data || [])
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
      const submitData = {
        ...formData,
        // MANAGEMENT_USERはフォームの値、DEPARTMENT_USERは強制的に自部署
        departmentId: user?.role === 'MANAGEMENT_USER' 
          ? formData.departmentId 
          : user?.departmentId || 0
      }
      
      console.log('[DEBUG] Form data being sent:', submitData)
      console.log('[DEBUG] User data:', user)
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const error = await response.json()
        console.log('[DEBUG] API error response:', error)
        throw new Error(error.error || '備品の登録に失敗しました')
      }

      router.push('/items')
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">新しい備品を登録</h1>
            <p className="mt-2 text-gray-600">
              新しい備品をシステムに登録します
            </p>
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

            {/* 部署選択 - ロールによる条件分岐 */}
            {user?.role === 'MANAGEMENT_USER' ? (
              <Select
                id="departmentId"
                label="担当部署"
                value={formData.departmentId.toString()}
                onChange={(e) => handleChange('departmentId', parseInt(e.target.value))}
                required
                help="備品を登録する部署を選択してください"
              >
                <option value="">部署を選択してください</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} {dept.code && `(${dept.code})`}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  担当部署
                </label>
                <div className="px-3 py-2 border border-gray-300 bg-gray-50 rounded-md text-gray-600">
                  {user?.department?.name || '未設定'}
                </div>
                <p className="text-sm text-gray-500">
                  備品は自部署にのみ登録できます
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button type="submit" loading={loading} disabled={loading}>
                登録する
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
          </form>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}