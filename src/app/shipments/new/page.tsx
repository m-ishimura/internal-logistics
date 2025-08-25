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
import type { Item } from '@/types'

export default function NewShipmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [formData, setFormData] = useState({
    itemId: searchParams?.get('itemId') || '',
    quantity: '',
    destination: '',
    trackingNumber: '',
    notes: '',
    shippedAt: ''
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items?limit=1000', {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        ...(formData.shippedAt && { shippedAt: new Date(formData.shippedAt).toISOString() })
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
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

            <Input
              id="destination"
              label="宛先"
              value={formData.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              required
              placeholder="例: 東京オフィス, 大阪支社"
              help="発送先の名称を入力してください"
            />

            <Input
              id="trackingNumber"
              label="追跡番号（任意）"
              value={formData.trackingNumber}
              onChange={(e) => handleChange('trackingNumber', e.target.value)}
              placeholder="例: 123-456-789"
              help="宅配業者の追跡番号があれば入力してください"
            />

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
              type="datetime-local"
              value={formData.shippedAt}
              onChange={(e) => handleChange('shippedAt', e.target.value)}
              help="既に発送済みの場合は発送日時を入力してください"
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
  )
}