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
import type { Item, Department, User } from '@/types'

export default function NewShipmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [formData, setFormData] = useState({
    itemId: searchParams?.get('itemId') || '',
    quantity: '',
    senderId: '',
    shipmentDepartmentId: '',
    destinationDepartmentId: '',
    shipmentUserId: '',
    trackingNumber: '',
    notes: '',
    shippedAt: ''
  })

  useEffect(() => {
    fetchItems()
    fetchDepartments()
    
    // ログインユーザーの部署を発送元部署に自動設定
    if (user?.departmentId) {
      setFormData(prev => ({
        ...prev,
        shipmentDepartmentId: user.departmentId.toString(),
        senderId: user.id.toString()
      }))
    }
  }, [user])

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
        shipmentUserId: formData.shipmentUserId ? parseInt(formData.shipmentUserId) : null,
        createdBy: user!.id,
        updatedBy: user!.id,
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

  const fetchUsersByDepartment = async (departmentId: string) => {
    if (!departmentId || departmentId === '') {
      setUsers([])
      setFilteredUsers([])
      return
    }

    try {
      const response = await fetch(`/api/users/by-department/${departmentId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
        setFilteredUsers(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setUsers([])
      setFilteredUsers([])
    }
  }

  const filterUsers = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const handleDestinationDepartmentChange = async (departmentId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      destinationDepartmentId: departmentId,
      shipmentUserId: ''
    }))
    setUserSearchTerm('')
    setShowUserDropdown(false)
    
    await fetchUsersByDepartment(departmentId)
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

            <div className="form-group">
              <label className="form-label">発送元部署</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-900 font-medium">
                  {user?.department?.name || '部署情報を取得中...'}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  発送元部署は自動的にあなたの所属部署に設定されます
                </p>
              </div>
            </div>

            <Select
              id="destinationDepartmentId"
              label="宛先部署"
              value={formData.destinationDepartmentId}
              onChange={(e) => handleDestinationDepartmentChange(e.target.value)}
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

            {/* 発送先担当者選択 */}
            <div className="form-group">
              <label className="form-label">
                発送先担当者（任意）
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input"
                  placeholder={formData.destinationDepartmentId ? "担当者を検索..." : "先に宛先部署を選択してください"}
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value)
                    filterUsers(e.target.value)
                  }}
                  onFocus={() => {
                    if (formData.destinationDepartmentId && users.length > 0) {
                      setShowUserDropdown(true)
                    }
                  }}
                  onBlur={() => {
                    // 少し遅延を入れてクリックイベントが処理されるようにする
                    setTimeout(() => setShowUserDropdown(false), 200)
                  }}
                  disabled={!formData.destinationDepartmentId}
                />
                {showUserDropdown && formData.destinationDepartmentId && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div 
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, shipmentUserId: '' }))
                        setUserSearchTerm('')
                        setShowUserDropdown(false)
                      }}
                    >
                      <span className="text-gray-500">担当者を指定しない</span>
                    </div>
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, shipmentUserId: user.id.toString() }))
                          setUserSearchTerm(user.name)
                          setShowUserDropdown(false)
                        }}
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && userSearchTerm && (
                      <div className="p-3 text-gray-500 text-center">
                        該当するユーザーが見つかりません
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                発送先部署の特定の担当者を指定する場合に選択してください
              </p>
            </div>

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