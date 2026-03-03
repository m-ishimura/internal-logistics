'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui'
import type { BulkImport, BulkImportError } from '@/types'

export default function BulkShipmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadResult, setUploadResult] = useState<BulkImport | null>(null)
  const [errors, setErrors] = useState<BulkImportError[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file) return

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx?)$/i)) {
      setError('CSV または Excel ファイルを選択してください。')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('ファイルサイズは10MB以下にしてください。')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setUploadResult(null)
    setErrors([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/shipments/bulk', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アップロードに失敗しました')
      }

      const data = await response.json()
      setUploadResult(data.data)

      if (data.data.errorRecords > 0) {
        fetchErrors(data.data.id)
        setSuccess(`アップロードが完了しました。${data.data.successRecords}件が正常に処理され、${data.data.errorRecords}件にエラーがありました。`)
      } else {
        setSuccess(`アップロードが完了しました。${data.data.successRecords}件すべて正常に処理されました。`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchErrors = async (bulkImportId: string) => {
    try {
      const response = await fetch(`/api/bulk-imports/${bulkImportId}/errors`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setErrors(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch errors:', err)
    }
  }


  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">一括発送登録</h1>
            <p className="mt-2 text-gray-600">
              CSVまたはExcelファイルから複数の発送を一括で登録できます
            </p>
          </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          {success}
        </Alert>
      )}

      <Card>
          <CardHeader>
            <CardTitle>ファイルアップロード</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {loading ? (
                <div className="space-y-4">
                  <div className="loading mx-auto" />
                  <p className="text-gray-600">ファイルを処理中...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl text-gray-400">📁</div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      ファイルをドラッグ＆ドロップ
                    </p>
                    <p className="text-sm text-gray-500">
                      または
                    </p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    ファイルを選択
                  </Button>
                  <p className="text-xs text-gray-500">
                    CSV、Excel ファイル（最大10MB）
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>処理結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.successRecords}
                </div>
                <div className="text-sm text-green-700">正常に処理</div>
              </div>
              <div className="bg-red-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.errorRecords}
                </div>
                <div className="text-sm text-red-700">エラー</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-gray-600">
                  {uploadResult.totalRecords}
                </div>
                <div className="text-sm text-gray-700">合計レコード</div>
              </div>
            </div>

            {errors.length > 0 && (
              <div>
                <h3 className="font-medium mb-4 text-red-700">エラー詳細</h3>
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>行番号</TableHead>
                        <TableHead>エラー内容</TableHead>
                        <TableHead>データ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error) => (
                        <TableRow key={error.id}>
                          <TableCell>{error.rowNumber}</TableCell>
                          <TableCell className="text-red-600">
                            {error.errorMessage}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {JSON.stringify(error.rowData)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={() => router.push('/shipments')}>
                発送一覧に戻る
              </Button>
              {uploadResult.successRecords > 0 && (
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  続けて登録
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}