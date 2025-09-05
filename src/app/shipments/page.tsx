'use client'

import { useState, useEffect, useRef } from 'react'
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
import type { Shipment, PaginatedResponse, Item, Department } from '@/types'
import { isShipmentLocked, getShipmentLockMessage } from '@/lib/shipment-utils'

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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownPositions, setDropdownPositions] = useState<{[key: string]: 'top' | 'bottom'}>({})
  
  // フィルター状態
  const [filters, setFilters] = useState(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)
    
    return {
      itemId: '',
      destination: '',
      sourceDepartmentId: '',
      shippedFromDate: sevenDaysAgo.toISOString().split('T')[0],
      shippedToDate: sevenDaysLater.toISOString().split('T')[0]
    }
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
      // エラーは無視
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
      // エラーは無視
    }
  }

  const fetchDestinations = async () => {
    try {
      // 発送先フィルター用の部署一覧を取得（全ユーザーがアクセス可能）
      const response = await fetch('/api/departments?forShipment=true', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const departmentNames = data.data?.map((dept: Department) => dept.name) || []
        setDestinations(departmentNames)
      }
    } catch (err) {
      // エラーは無視
    }
  }

  useEffect(() => {
    if (user) {
      fetchShipments(filters)
      fetchItems()
      fetchDestinations()
      if (user.role === 'MANAGEMENT_USER') {
        fetchDepartments()
      }
    }
  }, [user])

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDropdownToggle = (event: React.MouseEvent, shipmentId: string) => {
    const shipmentIdString = String(shipmentId)
    const isCurrentlyOpen = openDropdown === shipmentIdString
    
    if (isCurrentlyOpen) {
      setOpenDropdown(null)
    } else {
      // クリックされたボタンの位置を取得
      const button = event.currentTarget as HTMLButtonElement
      const rect = button.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 96 // ドロップダウンの実際の高さ
      const margin = 20 // 余白
      
      const spaceBelow = windowHeight - rect.bottom - margin
      const position = spaceBelow < dropdownHeight ? 'top' : 'bottom'
      
      setDropdownPositions(prev => ({ ...prev, [shipmentIdString]: position }))
      setOpenDropdown(shipmentIdString)
    }
  }

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
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)
    
    setFilters({
      itemId: '',
      destination: '',
      sourceDepartmentId: '',
      shippedFromDate: sevenDaysAgo.toISOString().split('T')[0],
      shippedToDate: sevenDaysLater.toISOString().split('T')[0]
    })
    fetchShipments({
      shippedFromDate: sevenDaysAgo.toISOString().split('T')[0],
      shippedToDate: sevenDaysLater.toISOString().split('T')[0]
    }, 1)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  // Helper function for future use
  void ((departmentId: string | number) => {
    const dept = departments.find(d => d.id.toString() === departmentId.toString())
    return dept?.name || `部署ID: ${departmentId}`
  })

  const handleDelete = async (shipmentId: string, itemName: string, shipment: Shipment) => {
    // 発送済み（過去日）の場合は削除不可
    if (isShipmentLocked(shipment.shippedAt ?? null)) {
      setError(getShipmentLockMessage('delete'))
      return
    }

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
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-8" style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
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
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm mb-6">
                <form onSubmit={handleSearch} className="p-6 pb-3">
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${user?.role === 'MANAGEMENT_USER' ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-4 mb-6`}>
                    {/* 備品選択 */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        備品
                      </label>
                      <Select
                        value={filters.itemId}
                        onChange={(e) => handleFilterChange('itemId', e.target.value)}
                        className="h-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">すべての備品</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* 発送先選択 */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        発送先
                      </label>
                      <Select
                        value={filters.destination}
                        onChange={(e) => handleFilterChange('destination', e.target.value)}
                        className="h-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">すべての発送先</option>
                        {destinations.map((destination) => (
                          <option key={destination} value={destination}>
                            {destination}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* 発送部署選択（管理者のみ） */}
                    {user?.role === 'MANAGEMENT_USER' && (
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-semibold text-gray-700">
                          <svg className="w-4 h-4 mr-1.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          発送部署
                        </label>
                        <Select
                          value={filters.sourceDepartmentId}
                          onChange={(e) => handleFilterChange('sourceDepartmentId', e.target.value)}
                          className="h-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">すべての部署</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* 発送日範囲 - 開始 */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 mr-1.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        発送日（開始）
                      </label>
                      <Input
                        type="date"
                        value={filters.shippedFromDate}
                        onChange={(e) => handleFilterChange('shippedFromDate', e.target.value)}
                        className="h-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* 発送日範囲 - 終了 */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 mr-1.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        発送日（終了）
                      </label>
                      <Input
                        type="date"
                        value={filters.shippedToDate}
                        onChange={(e) => handleFilterChange('shippedToDate', e.target.value)}
                        className="h-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <Button 
                      type="submit"
                      className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      検索
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleClearFilters}
                      className="flex-1 sm:flex-initial bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      クリア
                    </Button>
                  </div>
                </form>
              </div>
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
            <div>
              <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 bg-white" style={{ padding: '2rem', minWidth: '800px' }}>
                  {/* ヘッダー */}
                  <div className={`grid grid-cols-1 sm:grid-cols-4 ${user.role === 'MANAGEMENT_USER' ? 'lg:grid-cols-9' : 'lg:grid-cols-8'} gap-2 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300 rounded-lg w-full`} style={{ 
                    minWidth: '800px',
                    gridTemplateColumns: user.role === 'MANAGEMENT_USER' 
                      ? '100px 2fr 80px 2fr 0.7fr 0.7fr 1fr 200px 80px'
                      : '100px 2fr 80px 2fr 0.7fr 0.7fr 200px 80px'
                  }}>
                  <div className="text-sm font-semibold text-gray-800">発送日</div>
                  <div className="text-sm font-semibold text-gray-800">備品名</div>
                  <div className="text-sm font-semibold text-gray-800">数量</div>
                  <div className="text-sm font-semibold text-gray-800">発送先</div>
                  <div className="text-sm font-semibold text-gray-800">担当者</div>
                  <div className="text-sm font-semibold text-gray-800">発送者</div>
                  {user.role === 'MANAGEMENT_USER' && <div className="text-sm font-semibold text-gray-800">発送元部署</div>}
                  <div className="text-sm font-semibold text-gray-800">メモ</div>
                  <div className="text-sm font-semibold text-gray-800">操作</div>
                </div>
                
                {/* データ行 */}
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between px-6 py-2 mt-1 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full" style={{ minWidth: '800px' }}>
                    <div className={`flex-1 grid grid-cols-1 sm:grid-cols-4 ${user.role === 'MANAGEMENT_USER' ? 'lg:grid-cols-9' : 'lg:grid-cols-8'} gap-2 items-center`} style={{
                      gridTemplateColumns: user.role === 'MANAGEMENT_USER' 
                        ? '100px 2fr 80px 2fr 0.7fr 0.7fr 1fr 200px 80px'
                        : '100px 2fr 80px 2fr 0.7fr 0.7fr 200px 80px'
                    }}>
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
                        {shipment.shipmentUser?.name || '-'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {shipment.sender?.name}
                      </div>
                      {user.role === 'MANAGEMENT_USER' && (
                        <div className="text-sm text-gray-600">
                          {shipment.shipmentDepartment?.name}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 truncate" title={shipment.notes || ''}>
                        {shipment.notes 
                          ? shipment.notes.length > 20 
                            ? `${shipment.notes.substring(0, 20)}...` 
                            : shipment.notes
                          : '-'
                        }
                      </div>
                      <div className="relative dropdown-container">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const shipmentIdString = String(shipment.id)
                            handleDropdownToggle(e, shipmentIdString)
                          }}
                          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors duration-200 min-h-12 px-4 py-4"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openDropdown === String(shipment.id) && (
                          (() => {
                            const shipmentIdString = String(shipment.id)
                            const position = dropdownPositions[shipmentIdString] || 'bottom'
                            const isLocked = isShipmentLocked(shipment.shippedAt ?? null)
                            return (
                              <div className={`absolute ${position === 'top' ? 'bottom-8' : 'top-8'} right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 w-24`}>
                                {isLocked ? (
                                  <div className="w-full px-4 py-2 text-xs text-gray-400 cursor-not-allowed">
                                    編集不可
                                  </div>
                                ) : (
                                  <>
                                    <Link
                                      href={`/shipments/${shipment.id}/edit`}
                                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      編集
                                    </Link>
                                    <button
                                      onClick={() => handleDelete(String(shipment.id), shipment.item?.name || '不明', shipment)}
                                      disabled={deleteLoading === String(shipment.id)}
                                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center disabled:opacity-50"
                                    >
                                      {deleteLoading === String(shipment.id) ? '削除中...' : '削除'}
                                    </button>
                                  </>
                                )}
                              </div>
                            )
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ページネーション */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600">
                  {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}～{Math.min(pagination.page * pagination.limit, pagination.total)}件
                </div>
                <div className="flex gap-2">
                  {pagination.page > 1 && (
                    <Button 
                      variant="secondary" 
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      前へ
                    </Button>
                  )}
                  {pagination.page < pagination.totalPages && (
                    <Button 
                      variant="secondary"
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      次へ
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}