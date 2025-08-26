'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function NewShipmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    itemId: searchParams?.get('itemId') || '',
    quantity: '',
    destination: '',
    notes: '',
    shippedAt: ''
  })

  useEffect(() => {
    fetchItems()
    fetchDepartments()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items?limit=1000&forShipment=true', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setItems(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch items:', err)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
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
        quantity: parseInt(formData.quantity),
        ...(formData.shippedAt && { shippedAt: new Date(formData.shippedAt + 'T00:00:00.000Z').toISOString() })
      }

      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '発送の登録に失敗しました')
      }

      router.push('/shipments')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!user) return null

  const selectedItem = items.find(item => item.id === formData.itemId)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">新しい発送を登録</h1>
            <p className="mt-2 text-gray-600">
              新しい発送をシステムに登録します
            </p>
          </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>発送情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              id="itemId"
              label="備品"
              value={formData.itemId}
              onChange={(e) => handleChange('itemId', e.target.value)}
              required
              help="発送する備品を選択してください"
            >
              <option value="">備品を選択してください</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </Select>

            <Input
              id="quantity"
              label={`数量${selectedItem ? ` (${selectedItem.unit})` : ''}`}
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              required
              placeholder="例: 5"
              help="発送する数量を入力してください"
            />

            <Select
              id="destination"
              label="宛先部署"
              value={formData.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              required
              help="発送先の部署を選択してください"
            >
              <option value="">部署を選択してください</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </Select>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                備考（任意）
              </label>
              <textarea
                id="notes"
                className="form-textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="発送に関する特記事項があれば入力してください"
              />
            </div>

            <Input
              id="shippedAt"
              label="発送日（任意）"
              type="date"
              value={formData.shippedAt}
              onChange={(e) => handleChange('shippedAt', e.target.value)}
              help="既に発送済みの場合は発送日を入力してください"
            />

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