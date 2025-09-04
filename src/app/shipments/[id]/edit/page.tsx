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
import type { Item, Department, Shipment, User } from '@/types'

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
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [formData, setFormData] = useState({
    itemId: '',
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
    if (shipmentId && user) {
      fetchItems()
      fetchDepartments()
    }
  }, [shipmentId, user])

  useEffect(() => {
    if (shipmentId && departments.length > 0 && items.length > 0) {
      fetchShipment()
    }
  }, [shipmentId, departments, items]) // eslint-disable-line react-hooks/exhaustive-deps

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
      void shipment // Variable reserved for future validation logic
      
      
      // 既存データの場合
      
      setFormData({
        itemId: shipment.itemId.toString(),
        quantity: shipment.quantity.toString(),
        senderId: shipment.senderId.toString(),
        shipmentDepartmentId: shipment.shipmentDepartmentId.toString(),
        destinationDepartmentId: shipment.destinationDepartmentId.toString(),
        shipmentUserId: shipment.shipmentUserId ? shipment.shipmentUserId.toString() : '',
        trackingNumber: shipment.trackingNumber || '',
        notes: shipment.notes || '',
        shippedAt: shipment.shippedAt ? new Date(shipment.shippedAt).toISOString().slice(0, 10) : ''
      })

      // 発送先部署のユーザーを取得
      if (shipment.destinationDepartmentId) {
        fetchUsers(shipment.destinationDepartmentId.toString())
      }
      // 発送先担当者の検索用初期化
      if (shipment.shipmentUser) {
        setUserSearchTerm(shipment.shipmentUser.name)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      // For edit form, get all items (not just forShipment=true)
      // to ensure the current shipment's item is included
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

  const fetchUsers = async (departmentId: string) => {
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
        const userData = data.data || []
        setUsers(userData)
        setFilteredUsers(userData)
        
        // Don't auto-focus on edit form to avoid interrupting user interaction
      } else {
        setUsers([])
        setFilteredUsers([])
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setUsers([])
      setFilteredUsers([])
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

  const handleDestinationDepartmentChange = async (value: string) => {
    setFormData(prev => ({ ...prev, destinationDepartmentId: value, shipmentUserId: '' }))
    setUserSearchTerm('')
    setShowUserDropdown(false)
    if (value) {
      await fetchUsers(value)
    } else {
      setUsers([])
      setFilteredUsers([])
    }
  }

  const handleUserSearch = (searchTerm: string) => {
    setUserSearchTerm(searchTerm)
    if (searchTerm.trim()) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
      setShowUserDropdown(true)
    } else {
      setFilteredUsers(users)
      setShowUserDropdown(users.length > 0)
      setFormData(prev => ({ ...prev, shipmentUserId: '' }))
    }
  }

  const handleUserSelect = (user: User) => {
    setFormData(prev => ({ ...prev, shipmentUserId: user.id.toString() }))
    setUserSearchTerm(user.name)
    setShowUserDropdown(false)
  }

  if (!user) return null

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading" />
      </div>
    )
  }

  void items.find(item => item.id === formData.itemId) // Used for validation/debugging purposes

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
                  label="数量"
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

                {/* 発送元部署選択 - ロールによる条件分岐 */}
                {user?.role === 'MANAGEMENT_USER' ? (
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
                ) : (
                  <div className="form-group">
                    <label className="form-label">発送元部署</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-gray-900 font-medium">
                        {departments.find(dept => dept.id.toString() === formData.shipmentDepartmentId)?.name || '部署情報を取得中...'}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        発送元部署は変更できません
                      </p>
                    </div>
                  </div>
                )}

                {/* 発送者表示 - 全ユーザー共通で既存の発送者情報を表示 */}
                <div className="form-group">
                  <label className="form-label">発送者</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900 font-medium">
                      {shipment?.sender?.name || '発送者情報を読み込み中...'}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      発送者は変更できません
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
                  <label className="form-label" htmlFor="shipmentUserId">
                    発送先担当者（任意）
                  </label>
                  <div className="relative">
                    <input
                      id="shipmentUserId"
                      type="text"
                      className="form-input"
                      placeholder={formData.destinationDepartmentId ? "担当者名を入力して検索..." : "まず宛先部署を選択してください"}
                      value={userSearchTerm}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      onFocus={() => {
                        if (users.length > 0) {
                          setShowUserDropdown(true)
                        }
                      }}
                      onBlur={(e) => {
                        // Allow time for dropdown click
                        setTimeout(() => {
                          const activeElement = document.activeElement
                          const currentTarget = e.currentTarget
                          if (!activeElement || !currentTarget || !currentTarget.contains(activeElement)) {
                            setShowUserDropdown(false)
                          }
                        }, 200)
                      }}
                      disabled={!formData.destinationDepartmentId}
                    />
                    
                    {showUserDropdown && filteredUsers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-none bg-transparent"
                            onClick={() => handleUserSelect(user)}
                          >
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="form-help">
                    発送先の担当者を指定する場合は入力してください（任意）
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
                  label="発送日"
                  type="date"
                  value={formData.shippedAt}
                  onChange={(e) => handleChange('shippedAt', e.target.value)}
                  required
                  help="発送日を入力してください"
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