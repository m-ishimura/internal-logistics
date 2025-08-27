'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
import type { Shipment, PaginatedResponse, PaginationParams, Item, Department } from '@/types'

export default function ShipmentsPage() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [destinations, setDestinations] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  // フィルター状態
  const [filters, setFilters] = useState({
    itemId: '',
    destination: '',
    sourceDepartmentId: '',
    shippedFromDate: '',
    shippedToDate: ''
  })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchShipments = async (searchFilters: any = {}, pageNum: number = 1) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: String(pageNum),
        limit: String(20),
        ...(searchFilters.itemId && { itemId: searchFilters.itemId }),
        ...(searchFilters.destination && { destination: searchFilters.destination }),
        ...(searchFilters.sourceDepartmentId && { sourceDepartmentId: searchFilters.sourceDepartmentId }),
        ...(searchFilters.shippedFromDate && { shippedFromDate: searchFilters.shippedFromDate }),
        ...(searchFilters.shippedToDate && { shippedToDate: searchFilters.shippedToDate })
      })

      const response = await fetch(`/api/shipments?${queryParams}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const data: PaginatedResponse<Shipment> = await response.json()
      setShipments(data.data)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/shipments?limit=1000', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const uniqueDestinations = [...new Set(data.data.map((s: Shipment) => s.destinationDepartment?.name))]
        setDestinations(uniqueDestinations.filter(Boolean))
      }
    } catch (err) {
      console.error('Failed to fetch destinations:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchShipments()
      fetchItems()
      fetchDestinations()
      if (user.role === 'MANAGEMENT_USER') {
        fetchDepartments()
      }
    }
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchShipments(filters, 1)
  }

  const handlePageChange = (newPage: number) => {
    fetchShipments(filters, newPage)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleClearFilters = () => {
    setFilters({
      itemId: '',
      destination: '',
      sourceDepartmentId: '',
      shippedFromDate: '',
      shippedToDate: ''
    })
    fetchShipments({}, 1)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const getDepartmentNameById = (departmentId: string | number) => {
    const dept = departments.find(d => d.id.toString() === departmentId.toString())
    return dept?.name || `部署ID: ${departmentId}`
  }

  const handleDelete = async (shipmentId: string, itemName: string) => {
    if (!confirm(`「${itemName}」の発送を削除しますか？この操作は元に戻せません。`)) {
      return
    }

    try {
      setDeleteLoading(shipmentId)
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '発送の削除に失敗しました')
      }

      // 一覧を再読み込み
      fetchShipments(filters, pagination.page)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteLoading(null)
    }
  }


  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">発送管理</h1>
          <p className="mt-2 text-gray-600">
            {user.role === 'DEPARTMENT_USER' 
              ? `${user.department?.name}の発送を管理`
              : '全部署の発送を管理'
            }
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/shipments/bulk">
            <Button variant="secondary">一括登録</Button>
          </Link>
          <Link href="/shipments/new">
            <Button>新しい発送を登録</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>発送一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 検索・フィルターセクション */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                検索・フィルター
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    適用中
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  クリア
                </Button>
              )}
            </div>

            {showFilters && (
              <form onSubmit={handleSearch} className="p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* 備品選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      備品
                    </label>
                    <Select
                      value={filters.itemId}
                      onChange={(e) => handleFilterChange('itemId', e.target.value)}
                    >
                      <option value="">すべて</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* 発送先選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      発送先
                    </label>
                    <Select
                      value={filters.destination}
                      onChange={(e) => handleFilterChange('destination', e.target.value)}
                    >
                      <option value="">すべて</option>
                      {destinations.map((destination) => (
                        <option key={destination} value={destination}>
                          {destination}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* 発送部署選択（管理者のみ） */}
                  {user?.role === 'MANAGEMENT_USER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        発送部署
                      </label>
                      <Select
                        value={filters.sourceDepartmentId}
                        onChange={(e) => handleFilterChange('sourceDepartmentId', e.target.value)}
                      >
                        <option value="">すべて</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {/* 発送日範囲 */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      発送日（開始）
                    </label>
                    <Input
                      type="date"
                      value={filters.shippedFromDate}
                      onChange={(e) => handleFilterChange('shippedFromDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className={user?.role === 'MANAGEMENT_USER' ? 'lg:col-start-4' : 'lg:col-start-3'}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      発送日（終了）
                    </label>
                    <Input
                      type="date"
                      value={filters.shippedToDate}
                      onChange={(e) => handleFilterChange('shippedToDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit">
                    検索
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleClearFilters}>
                    クリア
                  </Button>
                </div>
              </form>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {hasActiveFilters ? '検索条件に一致する発送が見つかりません' : '登録された発送がありません'}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {/* ヘッダー */}
                <div className={`grid grid-cols-1 sm:grid-cols-4 ${user.role === 'MANAGEMENT_USER' ? 'lg:grid-cols-7' : 'lg:grid-cols-6'} gap-2 px-3 py-2 border-b border-gray-200`}>
                  <div className="text-sm font-medium text-gray-700">発送日</div>
                  <div className="text-sm font-medium text-gray-700">備品名</div>
                  <div className="text-sm font-medium text-gray-700">数量</div>
                  <div className="text-sm font-medium text-gray-700">発送先</div>
                  <div className="text-sm font-medium text-gray-700">発送者</div>
                  {user.role === 'MANAGEMENT_USER' && <div className="text-sm font-medium text-gray-700">発送元部署</div>}
                  <div className="text-sm font-medium text-gray-700">操作</div>
                </div>
                
                {/* データ行 */}
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`flex-1 grid grid-cols-1 sm:grid-cols-4 ${user.role === 'MANAGEMENT_USER' ? 'lg:grid-cols-7' : 'lg:grid-cols-6'} gap-2 items-center`}>
                      <div className="text-sm text-gray-700">
                        {shipment.shippedAt 
                          ? new Date(shipment.shippedAt).toLocaleDateString('ja-JP')
                          : <span className="text-gray-400">未発送</span>
                        }
                      </div>
                      <div className="font-medium text-gray-900 truncate">
                        {shipment.item?.name || '-'}
                      </div>
                      <div className="text-sm text-gray-700">
                        {shipment.quantity} {shipment.item?.unit || ''}
                      </div>
                      <div className="text-sm text-gray-700">
                        {shipment.destinationDepartment?.name || '-'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {shipment.sender?.name}
                      </div>
                      {user.role === 'MANAGEMENT_USER' && (
                        <div className="text-sm text-gray-600">
                          {shipment.shipmentDepartment?.name}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {(() => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0) // 今日の00:00:00に設定
                          const shippedDate = shipment.shippedAt ? new Date(shipment.shippedAt) : null
                          shippedDate?.setHours(0, 0, 0, 0) // 発送日の00:00:00に設定
                          const isShippedPastOrToday = shippedDate && shippedDate <= today
                          
                          return (
                            <>
                              {isShippedPastOrToday ? (
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  disabled
                                  title="発送済みまたは当日発送分は編集できません"
                                >
                                  編集
                                </Button>
                              ) : (
                                <Link href={`/shipments/${shipment.id}/edit`}>
                                  <Button variant="secondary" size="sm">
                                    編集
                                  </Button>
                                </Link>
                              )}
                              
                              {isShippedPastOrToday ? (
                                <Button 
                                  variant="danger" 
                                  size="sm" 
                                  disabled
                                  title="発送済みまたは当日発送分は削除できません"
                                >
                                  削除
                                </Button>
                              ) : (
                                <Button 
                                  variant="danger" 
                                  size="sm"
                                  loading={deleteLoading === shipment.id}
                                  disabled={deleteLoading === shipment.id}
                                  onClick={() => handleDelete(shipment.id, shipment.item?.name || '')}
                                >
                                  削除
                                </Button>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      前へ
                    </Button>
                    <span className="px-3 py-2 text-sm">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      次へ
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}