'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import type { Department } from '@/types'

export default function DepartmentsPage() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isManagement: false
  })

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

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data || [])
      }
    } catch (error) {
      console.error('部署一覧の取得に失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingDepartment 
        ? `/api/departments/${editingDepartment.id}` 
        : '/api/departments'
      const method = editingDepartment ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchDepartments()
        resetForm()
        setShowAddModal(false)
        setEditingDepartment(null)
      } else {
        alert('保存に失敗しました')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この部署を削除しますか？')) return

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchDepartments()
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      isManagement: false
    })
  }

  const openEditModal = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      code: department.code,
      isManagement: department.isManagement
    })
    setShowAddModal(true)
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
        <h1 className="text-2xl font-bold text-gray-900">部署管理</h1>
        <Button
          onClick={() => {
            resetForm()
            setEditingDepartment(null)
            setShowAddModal(true)
          }}
        >
          新しい部署を追加
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>部署一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              部署が登録されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">部署名</th>
                    <th className="text-left py-3 px-4">部署コード</th>
                    <th className="text-left py-3 px-4">管理部署</th>
                    <th className="text-left py-3 px-4">作成日</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{dept.name}</td>
                      <td className="py-3 px-4">{dept.code}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          dept.isManagement 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {dept.isManagement ? '管理部署' : '一般部署'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(dept.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 追加/編集モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-200/60">
              <div className="flex items-center justify-between px-6 py-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {editingDepartment ? '部署を編集' : '新しい部署を追加'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {editingDepartment ? '部署情報を更新します' : '組織に新しい部署を作成します'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingDepartment(null)
                    resetForm()
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors duration-150"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* フォーム */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]" style={{padding: '32px'}}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {/* 基本情報カード */}
                  <div className="form-group">
                    <label className="form-label">
                      部署名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="form-input"
                      placeholder="例: 営業部"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      部署コード <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="form-input"
                      placeholder="例: SALES"
                    />
                  </div>

                  {/* 管理権限設定 */}
                  <div className="bg-blue-50/50 border-2 border-blue-200/60 rounded-xl p-6">
                    <label className="flex items-start space-x-5 cursor-pointer group">
                      <div className="relative flex-shrink-0 mt-2">
                        <input
                          type="checkbox"
                          checked={formData.isManagement}
                          onChange={(e) => setFormData({...formData, isManagement: e.target.checked})}
                          className="w-7 h-7 text-blue-600 border-2 border-slate-300 rounded-lg focus:ring-3 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <svg className="w-7 h-7 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="text-xl font-semibold text-slate-900">管理部署として設定</span>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed">
                          管理部署は全ての機能にアクセスでき、システム全体の管理権限を持ちます
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

              </form>
            </div>
            {/* フッター */}
            <div className="flex justify-end space-x-4 px-6 py-4 border-t border-slate-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingDepartment(null)
                      resetForm()
                    }}
                    className="btn btn-secondary min-w-[120px]"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary min-w-[120px]"
                  >
                    {editingDepartment ? (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>更新する</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>追加する</span>
                      </span>
                    )}
                  </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}