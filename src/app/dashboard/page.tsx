'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Input } from '@/components/ui'
import type { Department, Shipment } from '@/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // デフォルト日付設定（本日-7日〜本日）
  useEffect(() => {
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 7)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(weekAgo.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (user) {
      fetchRecentShipments()
      fetchDepartments()
    }
  }, [user, selectedDepartment, startDate, endDate])

  const fetchRecentShipments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedDepartment !== 'all') {
        params.append('departmentId', selectedDepartment)
      }
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/dashboard/recent-shipments?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setShipments(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch recent shipments:', error)
    } finally {
      setLoading(false)
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
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP')
  }

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP')
  }

  const getDepartmentNameById = (departmentId: string | number) => {
    const dept = departments.find(d => d.id.toString() === departmentId.toString())
    return dept?.name || `部署ID: ${departmentId}`
  }

  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-8">
          {/* クイックアクション */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                クイックアクション
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a 
                  href="/items/new" 
                  className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
                >
                  <div className="flex items-center mb-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="ml-3 text-lg font-semibold text-blue-700">備品登録</span>
                  </div>
                  <p className="text-blue-600">新しい備品をマスタに追加</p>
                </a>
                
                <a 
                  href="/shipments/new" 
                  className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200"
                >
                  <div className="flex items-center mb-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="ml-3 text-lg font-semibold text-green-700">発送登録</span>
                  </div>
                  <p className="text-green-600">新しい発送を作成</p>
                </a>
                
                <a 
                  href="/shipments/bulk" 
                  className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200"
                >
                  <div className="flex items-center mb-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="ml-3 text-lg font-semibold text-purple-700">一括登録</span>
                  </div>
                  <p className="text-purple-600">CSVファイルから登録</p>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* 最近の発送履歴 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  最近の発送履歴
                </div>
                <a href="/shipments" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  すべて表示
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* フィルターコントロール */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.role === 'MANAGEMENT_USER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        発送元フィルター
                      </label>
                      <Select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="all">すべての発送元</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      開始日
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      終了日
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="loading mx-auto mb-4" />
                  <p className="text-gray-600">発送履歴を読み込み中...</p>
                </div>
              ) : shipments.length > 0 ? (
                <div className="space-y-2">
                  {/* ヘッダー */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-3 py-2 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-700">備品名</div>
                    <div className="text-sm font-medium text-gray-700">数量</div>
                    <div className="text-sm font-medium text-gray-700">発送先</div>
                    <div className="text-sm font-medium text-gray-700">発送者</div>
                    <div className="text-sm font-medium text-gray-700">発送元部署</div>
                    <div className="text-sm font-medium text-gray-700">発送日</div>
                  </div>
                  
                  {/* データ行 */}
                  {shipments.map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-center">
                        <div className="font-medium text-gray-900 truncate">
                          {shipment.item?.name}
                        </div>
                        <div className="text-sm text-gray-700">
                          {shipment.quantity} {shipment.item?.unit}
                        </div>
                        <div className="text-sm text-gray-700">
                          {shipment.destinationDepartment?.name || (shipment.destinationDepartmentId ? getDepartmentNameById(shipment.destinationDepartmentId) : '-')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {shipment.sender?.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {shipment.shipmentDepartment?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shipment.shippedAt ? formatDate(shipment.shippedAt) : formatDate(shipment.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-600">指定期間に発送履歴がありません</p>
                </div>
              )}
            </CardContent>
          </Card>

    </div>
  )
}