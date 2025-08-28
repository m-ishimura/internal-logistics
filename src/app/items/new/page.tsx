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
    departmentId: ''
  })

  useEffect(() => {
    if (user) {
      if (user.role === 'DEPARTMENT_USER') {
        setFormData(prev => ({ ...prev, departmentId: String(user.departmentId) }))
      } else {
        fetchDepartments()
      }
    }
  }, [user])

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
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '備品の登録に失敗しました')
      }

      router.push('/items')
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
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

            {user.role === 'MANAGEMENT_USER' && (
              <Select
                id="departmentId"
                label="担当部署"
                value={formData.departmentId}
                onChange={(e) => handleChange('departmentId', e.target.value)}
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