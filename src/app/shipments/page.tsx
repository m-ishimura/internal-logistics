'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert
} from '@/components/ui'
import type { Shipment, PaginatedResponse, PaginationParams } from '@/types'

export default function ShipmentsPage() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchShipments = async (params: Partial<PaginationParams> = {}) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: String(params.page || 1),
        limit: String(params.limit || 20),
        ...(params.search && { search: params.search })
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

  useEffect(() => {
    fetchShipments()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchShipments({ search, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    fetchShipments({ search, page: newPage })
  }

  const getStatusBadge = (shipment: Shipment) => {
    if (shipment.shippedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          発送済み
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        未発送
      </span>
    )
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
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="宛先、備品名、追跡番号で検索..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                検索
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? '検索結果が見つかりません' : '登録された発送がありません'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>備品名</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>宛先</TableHead>
                    <TableHead>追跡番号</TableHead>
                    <TableHead>発送者</TableHead>
                    {user.role === 'MANAGEMENT_USER' && <TableHead>部署</TableHead>}
                    <TableHead>ステータス</TableHead>
                    <TableHead>登録日</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.item?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {shipment.quantity} {shipment.item?.unit || ''}
                      </TableCell>
                      <TableCell>{shipment.destination}</TableCell>
                      <TableCell>{shipment.trackingNumber || '-'}</TableCell>
                      <TableCell>{shipment.sender?.name}</TableCell>
                      {user.role === 'MANAGEMENT_USER' && (
                        <TableCell>{shipment.department?.name}</TableCell>
                      )}
                      <TableCell>{getStatusBadge(shipment)}</TableCell>
                      <TableCell>
                        {new Date(shipment.createdAt).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/shipments/${shipment.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              編集
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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