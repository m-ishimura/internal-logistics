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
      setError(err instanceof Error ? err.message : String(err))
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

  // Helper function to check if user can edit an item
  const canEditItem = (item: Item) => {
    // Management users can edit items from any department
    if (user?.role === 'MANAGEMENT_USER') {
      return true
    }
    // Department users can only edit items from their own department
    return Number(item.departmentId) === Number(user?.departmentId)
  }

  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">備品管理</h1>
          <p className="page-subtitle">
            {user.role === 'DEPARTMENT_USER'
              ? `${user.department?.name}の備品を管理`
              : '全部署の備品を管理'}
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
          <form onSubmit={handleSearch} className="mb-5 flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="備品名・部署名で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              検索
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {search ? '検索結果が見つかりません' : '備品がまだ登録されていません'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {search ? '別のキーワードで検索してみてください' : '最初の備品を登録して始めましょう'}
                </p>
                {!search && (
                  <Link href="/items/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      備品を登録
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>備品名</TableHead>
                    <TableHead className="text-center">単位</TableHead>
                    {user.role === 'MANAGEMENT_USER' && <TableHead className="text-center">部署</TableHead>}
                    <TableHead className="text-center">登録日</TableHead>
                    <TableHead className="text-center">発送数</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="badge badge-blue">{item.unit}</span>
                      </TableCell>
                      {user.role === 'MANAGEMENT_USER' && (
                        <TableCell className="text-center">
                          <span className="badge badge-green">{item.department?.name}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-center text-gray-500 text-sm">
                        {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={(item._count?.shipments || 0) > 0 ? 'badge badge-green' : 'badge badge-gray'}>
                          {item._count?.shipments || 0}回
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          {canEditItem(item) ? (
                            <Link href={`/items/${item.id}/edit`}>
                              <Button variant="secondary" size="sm">編集</Button>
                            </Link>
                          ) : (
                            <Button variant="secondary" size="sm" disabled title="他部署の備品は編集できません">
                              編集
                            </Button>
                          )}
                          {canEditItem(item) ? (
                            <Link href={`/shipments/new?itemId=${item.id}`}>
                              <Button size="sm">発送</Button>
                            </Link>
                          ) : (
                            <Button size="sm" disabled title="他部署の備品は発送できません">
                              発送
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
          )}
        </CardContent>
      </Card>
    </div>
  )
}