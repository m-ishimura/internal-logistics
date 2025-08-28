'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import type { BulkImport, BulkImportError, BulkImportStatus } from '@/types'

export default function BulkImportsPage() {
  const { user } = useAuth()
  const [bulkImports, setBulkImports] = useState<BulkImport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImport, setSelectedImport] = useState<BulkImport | null>(null)
  const [errors, setErrors] = useState<BulkImportError[]>([])
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (user && user.role === 'MANAGEMENT_USER') {
      fetchBulkImports()
    }
  }, [user])

  if (!user || user.role !== 'MANAGEMENT_USER') {
    return (
      <div className="max-w-4xl mx-auto px-8 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">このページにアクセスする権限がありません。</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fetchBulkImports = async () => {
    try {
      const response = await fetch('/api/bulk-imports', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setBulkImports(data.data || [])
      }
    } catch (error) {
      console.error('一括インポート履歴の取得に失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchErrors = async (importId: string) => {
    try {
      const response = await fetch(`/api/bulk-imports/${importId}/errors`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setErrors(data.data || [])
      }
    } catch (error) {
      console.error('エラー詳細の取得に失敗:', error)
    }
  }

  const handleViewErrors = async (importData: BulkImport) => {
    setSelectedImport(importData)
    await fetchErrors(importData.id)
    setShowErrorModal(true)
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const response = await fetch('/api/shipments/bulk', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        await fetchBulkImports()
        setShowUploadModal(false)
        setUploadFile(null)
        alert('CSVファイルのアップロードが開始されました')
      } else {
        const error = await response.json()
        alert(error.message || 'アップロードに失敗しました')
      }
    } catch (error) {
      console.error('アップロードエラー:', error)
      alert('アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: BulkImportStatus) => {
    switch (status) {
      case 'PROCESSING':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">処理中</span>
      case 'COMPLETED':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">完了</span>
      case 'FAILED':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">失敗</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">不明</span>
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">一括登録管理</h1>
        <Button onClick={() => setShowUploadModal(true)}>
          新しいCSVをアップロード
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>CSVインポート履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {bulkImports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              CSVインポート履歴がありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">ファイル名</th>
                    <th className="text-left py-3 px-4">ステータス</th>
                    <th className="text-left py-3 px-4">総レコード数</th>
                    <th className="text-left py-3 px-4">成功</th>
                    <th className="text-left py-3 px-4">エラー</th>
                    <th className="text-left py-3 px-4">アップロード者</th>
                    <th className="text-left py-3 px-4">作成日</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkImports.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.fileName}</td>
                      <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-4 text-center">{item.totalRecords}</td>
                      <td className="py-3 px-4 text-center text-green-600">{item.successRecords}</td>
                      <td className="py-3 px-4 text-center text-red-600">{item.errorRecords}</td>
                      <td className="py-3 px-4">{item.uploader?.name || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString('ja-JP')} {new Date(item.createdAt).toLocaleTimeString('ja-JP')}
                      </td>
                      <td className="py-3 px-4">
                        {item.errorRecords > 0 && (
                          <button
                            onClick={() => handleViewErrors(item)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            エラー詳細
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* アップロードモーダル */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="relative bg-gradient-to-br from-slate-50 to-emerald-50 border-b border-slate-200/60">
              <div className="flex items-center justify-between px-6 py-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">CSVファイルをアップロード</h2>
                    <p className="text-sm text-slate-600 mt-0.5">発送データを一括登録します</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadFile(null)
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors duration-150"
                  disabled={uploading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* フォーム */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]" style={{padding: '32px'}}>
              <form onSubmit={handleFileUpload} className="space-y-8">
                {/* ファイル選択エリア */}
                <div className="form-group">
                  <label className="form-label">
                    CSVファイルを選択 <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className={`relative border-3 border-dashed rounded-2xl p-12 transition-all duration-300 ${
                      uploadFile 
                        ? 'border-emerald-400 bg-emerald-50/80' 
                        : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      required
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                    <div className="text-center">
                      {uploadFile ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-emerald-700">{uploadFile.name}</p>
                            <p className="text-base text-emerald-600 mt-1">
                              {(uploadFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <p className="text-base text-emerald-600">クリックして別のファイルを選択</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-700">ファイルをドラッグ＆ドロップ</p>
                            <p className="text-base text-slate-500 mt-2">または クリックしてファイルを選択</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 注意事項 */}
                <div className="bg-amber-50/80 border-2 border-amber-200/80 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-amber-800 mb-3">アップロード前の確認事項</h4>
                      <ul className="text-base text-amber-700 space-y-2">
                        <li className="flex items-center space-x-2">
                          <span>•</span>
                          <span>CSVファイル形式のみ対応しています</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>•</span>
                          <span>ファイルサイズは10MB以下にしてください</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span>•</span>
                          <span>必須項目が正しく入力されているか確認してください</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 進行状況 */}
                {uploading && (
                  <div className="bg-blue-50/80 border-2 border-blue-200/80 rounded-2xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="animate-spin rounded-full h-7 w-7 border-3 border-blue-600 border-t-transparent"></div>
                      <div>
                        <p className="text-lg font-semibold text-blue-800">アップロード中...</p>
                        <p className="text-base text-blue-600 mt-1">ファイルを処理しています。しばらくお待ちください。</p>
                      </div>
                    </div>
                  </div>
                )}

              </form>
            </div>
            {/* フッター */}
            <div className="flex justify-end space-x-4 px-6 py-4 border-t-2 border-slate-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false)
                      setUploadFile(null)
                    }}
                    className="btn btn-secondary min-w-[140px]"
                    disabled={uploading}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary min-w-[140px] disabled:opacity-50"
                    disabled={uploading || !uploadFile}
                  >
                    {uploading ? (
                      <span className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>アップロード中...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <span>アップロードする</span>
                      </span>
                    )}
                  </button>
            </div>
          </div>
        </div>
      )}

      {/* エラー詳細モーダル */}
      {showErrorModal && selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                エラー詳細: {selectedImport.fileName}
              </h2>
              <button
                onClick={() => {
                  setShowErrorModal(false)
                  setSelectedImport(null)
                  setErrors([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {errors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  エラーデータがありません
                </div>
              ) : (
                <div className="space-y-4">
                  {errors.map((error, index) => (
                    <div key={error.id} className="border border-red-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-red-800">
                          行 {error.rowNumber} のエラー
                        </h3>
                      </div>
                      <p className="text-red-600 mb-2">{error.errorMessage}</p>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <strong>データ:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(error.rowData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}