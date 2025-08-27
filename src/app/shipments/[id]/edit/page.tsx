'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import type { Item, Department, Shipment } from '@/types'

export default function EditShipmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const shipmentId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    senderId: '',
    shipmentDepartmentId: '',
    destinationDepartmentId: '',
    trackingNumber: '',
    notes: '',
    shippedAt: ''
  })

  useEffect(() => {
    if (shipmentId && user) {
      fetchItems()
      fetchDepartments()
    }
  }, [shipmentId, user])

  useEffect(() => {
    if (shipmentId && departments.length > 0) {
      fetchShipment()
    }
  }, [shipmentId, departments])

  const fetchShipment = async () => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('発送データの取得に失敗しました')
      }

      const data = await response.json()
      const shipment = data.data
      setShipment(shipment)
      
      // 既存データの場合
      
      setFormData({
        itemId: shipment.itemId,
        quantity: shipment.quantity.toString(),
        senderId: shipment.senderId.toString(),
        shipmentDepartmentId: shipment.shipmentDepartmentId.toString(),
        destinationDepartmentId: shipment.destinationDepartmentId.toString(),
        trackingNumber: shipment.trackingNumber || '',
        notes: shipment.notes || '',
        shippedAt: shipment.shippedAt ? new Date(shipment.shippedAt).toISOString().slice(0, 10) : ''
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFetchLoading(false)
    }
  }

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
      const response = await fetch('/api/departments?limit=1000&forShipment=true', {
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
        senderId: parseInt(formData.senderId),
        shipmentDepartmentId: parseInt(formData.shipmentDepartmentId),
        destinationDepartmentId: parseInt(formData.destinationDepartmentId),
        createdBy: parseInt(userId),
        updatedBy: parseInt(userId),
        ...(formData.shippedAt && { shippedAt: new Date(formData.shippedAt + 'T00:00:00.000Z').toISOString() })
      })

      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '発送の更新に失敗しました')
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

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading" />
      </div>
    )
  }

  const selectedItem = items.find(item => item.id === formData.itemId)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">発送を編集</h1>
            <p className="mt-2 text-gray-600">
              発送情報を編集します
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
                      {item.name}
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
                  id="trackingNumber"
                  label="追跡番号（任意）"
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => handleChange('trackingNumber', e.target.value)}
                  placeholder="例: ABC123456789"
                  help="追跡番号がある場合は入力してください"
                />

                <Select
                  id="shipmentDepartmentId"
                  label="発送元部署"
                  value={formData.shipmentDepartmentId}
                  onChange={(e) => handleChange('shipmentDepartmentId', e.target.value)}
                  required
                  help="発送元の部署を選択してください"
                >
                  <option value="">部署を選択してください</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {dept.code && `(${dept.code})`}
                    </option>
                  ))}
                </Select>

                <Select
                  id="destinationDepartmentId"
                  label="宛先部署"
                  value={formData.destinationDepartmentId}
                  onChange={(e) => handleChange('destinationDepartmentId', e.target.value)}
                  required
                  help="発送先の部署を選択してください"
                >
                  <option value="">部署を選択してください</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {dept.code && `(${dept.code})`}
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
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}