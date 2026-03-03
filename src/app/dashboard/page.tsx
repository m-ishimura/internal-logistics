'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Card, CardHeader, CardTitle, CardContent,
  Select, Input, Button,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui'
import type { Department, Shipment, PaginatedResponse } from '@/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedDestinationDepartment, setSelectedDestinationDepartment] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // デフォルト日付設定（本日-7日〜本日+7日）
  useEffect(() => {
    const today = new Date()
    const weekAgo = new Date()
    const weekAhead = new Date()
    weekAgo.setDate(today.getDate() - 7)
    weekAhead.setDate(today.getDate() + 7)
    setStartDate(weekAgo.toISOString().split('T')[0])
    setEndDate(weekAhead.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (user) {
      fetchRecentShipments(1, pagination.limit)
      fetchDepartments()
    }
  }, [user, selectedDepartment, selectedDestinationDepartment, startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecentShipments = async (page: number = 1, limit: number = pagination.limit) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', String(limit))
      if (selectedDepartment !== 'all') params.append('departmentId', selectedDepartment)
      if (selectedDestinationDepartment !== 'all') params.append('destinationDepartmentId', selectedDestinationDepartment)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/dashboard/recent-shipments?${params}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data: PaginatedResponse<Shipment> = await response.json()
        setShipments(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch recent shipments:', error)
    } finally {
      setLoading(false)
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
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const handleLimitChange = (newLimit: number) => {
    fetchRecentShipments(1, newLimit)
  }

  const handlePageChange = (newPage: number) => {
    fetchRecentShipments(newPage, pagination.limit)
  }

  const formatDate = (dateString: string | Date) =>
    new Date(dateString).toLocaleDateString('ja-JP')

  const getDepartmentNameById = (departmentId: string | number) => {
    const dept = departments.find(d => d.id.toString() === departmentId.toString())
    return dept?.name || `部署ID: ${departmentId}`
  }

  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-8">

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            クイックアクション
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/items/new"
              className="flex items-center gap-4 p-5 bg-white border border-gray-200 border-l-4 border-l-blue-600 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">備品登録</div>
                <div className="text-xs text-gray-500 mt-0.5">新しい備品をマスタに追加</div>
              </div>
            </a>

            <a
              href="/shipments/new"
              className="flex items-center gap-4 p-5 bg-white border border-gray-200 border-l-4 border-l-green-600 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">発送登録</div>
                <div className="text-xs text-gray-500 mt-0.5">新しい発送を作成</div>
              </div>
            </a>

            <a
              href="/shipments/bulk"
              className="flex items-center gap-4 p-5 bg-white border border-gray-200 border-l-4 border-l-purple-600 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">一括登録</div>
                <div className="text-xs text-gray-500 mt-0.5">CSVファイルから登録</div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* 最近の発送履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1">最近の発送履歴</span>
            <a
              href="/shipments"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-auto"
            >
              すべて表示
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* フィルターコントロール */}
          <div className="mb-5 p-4 bg-white border border-gray-200 rounded-xl">
            <div className={`grid grid-cols-1 md:grid-cols-2 ${user.role === 'MANAGEMENT_USER' ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-3`}>
              {user.role === 'MANAGEMENT_USER' && (
                <div>
                  <label className="form-label">発送元</label>
                  <Select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="all">すべての発送元</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              {user.role === 'MANAGEMENT_USER' && (
                <div>
                  <label className="form-label">発送先</label>
                  <Select
                    value={selectedDestinationDepartment}
                    onChange={(e) => setSelectedDestinationDepartment(e.target.value)}
                  >
                    <option value="all">すべての発送先</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <label className="form-label">開始日</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">終了日</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">表示件数</label>
                <Select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                >
                  <option value="25">25件</option>
                  <option value="50">50件</option>
                  <option value="100">100件</option>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="loading mx-auto mb-3" />
              <p className="text-sm text-gray-500">発送履歴を読み込み中...</p>
            </div>
          ) : shipments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>登録日</TableHead>
                    <TableHead>備品名</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>発送先</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>発送者</TableHead>
                    <TableHead>発送元部署</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="text-gray-500 whitespace-nowrap">
                        {shipment.shippedAt ? formatDate(shipment.shippedAt) : formatDate(shipment.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {shipment.item?.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {shipment.quantity} {shipment.item?.unit}
                      </TableCell>
                      <TableCell>
                        {shipment.destinationDepartment?.name
                          || (shipment.destinationDepartmentId ? getDepartmentNameById(shipment.destinationDepartmentId) : '-')}
                      </TableCell>
                      <TableCell className="text-gray-600">{shipment.shipmentUser?.name || '-'}</TableCell>
                      <TableCell className="text-gray-600">{shipment.sender?.name}</TableCell>
                      <TableCell className="text-gray-600">{shipment.shipmentDepartment?.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* ページネーション */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    {pagination.total}件中{' '}
                    <span className="font-medium text-gray-700">
                      {(pagination.page - 1) * pagination.limit + 1}〜{Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}件を表示
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      前へ
                    </Button>
                    <span className="text-sm text-gray-600 font-medium px-2">
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
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">指定期間に発送履歴がありません</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
