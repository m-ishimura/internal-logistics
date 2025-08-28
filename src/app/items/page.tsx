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

  if (!user) return null

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-8" style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
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
                  placeholder="備品名・部署名で検索..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" className="h-10">
                検索
              </Button>
            </div>
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
              <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
                <Table className="w-full table-fixed min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                      <TableHead className="w-1/3 min-w-[200px] text-left font-semibold text-gray-700 py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>備品名</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-20 text-center font-semibold text-gray-700 py-4">単位</TableHead>
                      {user.role === 'MANAGEMENT_USER' && <TableHead className="w-32 text-center font-semibold text-gray-700 py-4">部署</TableHead>}
                      <TableHead className="w-28 text-center font-semibold text-gray-700 py-4">登録日</TableHead>
                      <TableHead className="w-24 text-center font-semibold text-gray-700 py-4">発送数</TableHead>
                      <TableHead className="w-40 text-center font-semibold text-gray-700 py-4">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow 
                        key={item.id} 
                        className={`border-b border-gray-100 transition-all duration-200 hover:bg-blue-50 hover:shadow-sm cursor-pointer ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <TableCell className="font-medium text-gray-900 p-4 truncate" title={item.name}>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="truncate">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-gray-600 p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {item.unit}
                          </span>
                        </TableCell>
                        {user.role === 'MANAGEMENT_USER' && (
                          <TableCell className="text-center text-gray-600 p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              {item.department?.name}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="text-center text-gray-600 p-4 text-sm">
                          {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-center p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-base font-medium ${
                            (item._count?.shipments || 0) > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item._count?.shipments || 0}回
                          </span>
                        </TableCell>
                        <TableCell className="text-center p-4">
                          <div className="flex justify-center gap-2">
                            <Link href={`/items/${item.id}/edit`}>
                              <Button variant="secondary" size="sm" className="text-xs px-3 py-1">
                                編集
                              </Button>
                            </Link>
                            <Link href={`/shipments/new?itemId=${item.id}`}>
                              <Button size="sm" className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700">
                                発送
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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