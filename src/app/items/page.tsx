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
import type { Item, PaginatedResponse, PaginationParams } from '@/types'

export default function ItemsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchItems = async (params: Partial<PaginationParams> = {}) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: String(params.page || 1),
        limit: String(params.limit || 20),
        ...(params.search && { search: params.search })
      })

      const response = await fetch(`/api/items?${queryParams}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const data: PaginatedResponse<Item> = await response.json()
      setItems(data.data)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems({ search, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    fetchItems({ search, page: newPage })
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">備品管理</h1>
          <p className="mt-2 text-gray-600">
            {user.role === 'DEPARTMENT_USER' 
              ? `${user.department?.name}の備品を管理`
              : '全部署の備品を管理'
            }
          </p>
        </div>
        <Link href="/items/new">
          <Button>新しい備品を登録</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>備品一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="備品名またはカテゴリで検索..."
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
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? '検索結果が見つかりません' : '登録された備品がありません'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>備品名</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>単位</TableHead>
                    {user.role === 'MANAGEMENT_USER' && <TableHead>部署</TableHead>}
                    <TableHead>登録日</TableHead>
                    <TableHead>発送数</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      {user.role === 'MANAGEMENT_USER' && (
                        <TableCell>{item.department?.name}</TableCell>
                      )}
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/items/${item.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              編集
                            </Button>
                          </Link>
                          <Link href={`/shipments/new?itemId=${item.id}`}>
                            <Button size="sm">
                              発送
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