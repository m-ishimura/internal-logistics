'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Button, 
  Select,
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
import type { Department, Shipment } from '@/types'

interface ReportData {
  totalShipments: number
  totalItems: number
  departmentStats: {
    id: string
    name: string
    itemCount: number
    shipmentCount: number
    lastShipment?: string
  }[]
  recentShipments: Shipment[]
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (user?.role === 'MANAGEMENT_USER') {
      fetchDepartments()
      fetchReportData()
    }
  }, [user])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    setError('')

    try {
      const queryParams = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(selectedDepartment !== 'all' && { departmentId: selectedDepartment })
      })

      const response = await fetch(`/api/reports?${queryParams}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('レポートデータの取得に失敗しました')
      }

      const data = await response.json()
      setReportData(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async (type: 'shipments' | 'items' | 'departments') => {
    try {
      const queryParams = new URLSearchParams({
        type,
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(selectedDepartment !== 'all' && { departmentId: selectedDepartment })
      })

      const response = await fetch(`/api/reports/export?${queryParams}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('エクスポートに失敗しました')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_report_${dateRange.start}_${dateRange.end}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!user || user.role !== 'MANAGEMENT_USER') {
    return (
      <div className="text-center py-8">
        <Alert variant="error">
          このページにアクセスする権限がありません。
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">レポート</h1>
        <p className="mt-2 text-gray-600">
          全社の発送状況と統計情報を確認できます
        </p>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>フィルター設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="部署"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">全部署</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>

            <div>
              <label className="form-label">開始日</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            <div>
              <label className="form-label">終了日</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={fetchReportData} loading={loading}>
              レポートを更新
            </Button>
            <Button variant="secondary" onClick={() => exportToCSV('shipments')}>
              発送データをCSV出力
            </Button>
            <Button variant="secondary" onClick={() => exportToCSV('items')}>
              備品データをCSV出力
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>総発送数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportData.totalShipments}
                </div>
                <p className="text-sm text-gray-600">期間中の発送数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>登録備品数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {reportData.totalItems}
                </div>
                <p className="text-sm text-gray-600">システム内の備品数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>活動部署数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {reportData.departmentStats.filter(d => d.shipmentCount > 0).length}
                </div>
                <p className="text-sm text-gray-600">発送実績のある部署</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>平均発送/部署</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {Math.round(reportData.totalShipments / Math.max(reportData.departmentStats.length, 1))}
                </div>
                <p className="text-sm text-gray-600">部署あたりの発送数</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>部署別統計</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部署名</TableHead>
                    <TableHead>登録備品数</TableHead>
                    <TableHead>発送数</TableHead>
                    <TableHead>最後の発送</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.departmentStats.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.itemCount}</TableCell>
                      <TableCell>{dept.shipmentCount}</TableCell>
                      <TableCell>
                        {dept.lastShipment 
                          ? new Date(dept.lastShipment).toLocaleDateString('ja-JP')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の発送 (直近10件)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>備品名</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>宛先</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>発送者</TableHead>
                    <TableHead>登録日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.recentShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.item?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {shipment.quantity} {shipment.item?.unit || ''}
                      </TableCell>
                      <TableCell>{shipment.destination}</TableCell>
                      <TableCell>{shipment.department?.name}</TableCell>
                      <TableCell>{shipment.sender?.name}</TableCell>
                      <TableCell>
                        {new Date(shipment.createdAt).toLocaleDateString('ja-JP')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {reportData.recentShipments.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  期間中の発送がありません
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}