'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import type { User, Department, UserRole, AuthType } from '@/types'

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    departmentId: '',
    role: 'DEPARTMENT_USER' as UserRole,
    authType: 'PASSWORD' as AuthType,
    password: '',
    entraId: ''
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
    fetchUsers(1)
    fetchDepartments()
  }, [])

  const fetchUsers = async (pageNum: number = pagination.page) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users?page=${pageNum}&limit=50&sortBy=id&sortOrder=asc`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('ユーザー一覧の取得に失敗:', error)
    } finally {
      setLoading(false)
    }
  }


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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id}` 
        : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const requestData = {
        ...formData,
        departmentId: parseInt(formData.departmentId),
        ...(formData.authType === 'ENTRA_ID' ? { entraId: formData.entraId } : {}),
        ...(formData.authType === 'PASSWORD' && formData.password ? { password: formData.password } : {}),
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        await fetchUsers(pagination.page)
        resetForm()
        setShowAddModal(false)
        setEditingUser(null)
      } else {
        const error = await response.json()
        alert(error.message || '保存に失敗しました')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このユーザーを削除しますか？')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchUsers(pagination.page)
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
      email: '',
      departmentId: '',
      role: 'DEPARTMENT_USER',
      authType: 'PASSWORD',
      password: '',
      entraId: ''
    })
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      departmentId: user.departmentId ? user.departmentId.toString() : '',
      role: user.role,
      authType: user.authType,
      password: '',
      entraId: user.entraId || ''
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
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
        <Button
          onClick={() => {
            resetForm()
            setEditingUser(null)
            setShowAddModal(true)
          }}
        >
          新しいユーザーを追加
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ユーザーが登録されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">名前</th>
                    <th className="text-left py-3 px-4">メール</th>
                    <th className="text-left py-3 px-4">部署</th>
                    <th className="text-left py-3 px-4">役割</th>
                    <th className="text-left py-3 px-4">認証方式</th>
                    <th className="text-left py-3 px-4">作成日</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{u.name}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">{u.department?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.role === 'MANAGEMENT_USER'
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role === 'MANAGEMENT_USER' ? '管理者' : '一般ユーザー'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.authType === 'ENTRA_ID'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {u.authType === 'ENTRA_ID' ? 'Entra ID' : 'パスワード'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
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
          
          {/* ページネーション */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 px-4">
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
        </CardContent>
      </Card>

      {/* 追加/編集モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="relative bg-gradient-to-br from-slate-50 to-indigo-50 border-b border-slate-200/60">
              <div className="flex items-center justify-between px-6 py-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {editingUser ? 'ユーザーを編集' : '新しいユーザーを追加'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {editingUser ? 'ユーザー情報を更新します' : 'システムに新しいユーザーを追加します'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUser(null)
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
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 基本情報 */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center pb-4 border-b-2 border-slate-200">
                      <svg className="w-7 h-7 mr-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      基本情報
                    </h3>
                    <div className="form-group">
                      <label className="form-label">
                        名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input"
                        placeholder="例: 田中太郎"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="form-input"
                        placeholder="例: tanaka@example.com"
                      />
                    </div>
                  </div>

                  {/* 組織・権限情報 */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center pb-4 border-b-2 border-slate-200">
                      <svg className="w-7 h-7 mr-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      組織・権限
                    </h3>
                    <div className="form-group">
                      <label className="form-label">
                        所属部署 <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        className="form-select"
                      >
                        <option value="">部署を選択してください</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label mb-5">
                        システム権限
                      </label>
                      <div className="space-y-4">
                        {[
                          { value: 'DEPARTMENT_USER', label: '一般ユーザー', desc: '基本機能の利用', color: 'blue' },
                          { value: 'MANAGEMENT_USER', label: '管理者', desc: '全機能の利用・管理', color: 'red' }
                        ].map((option) => (
                          <label 
                            key={option.value} 
                            className={`flex items-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              formData.role === option.value 
                                ? option.color === 'red' 
                                  ? 'border-red-400 bg-red-50' 
                                  : 'border-blue-400 bg-blue-50'
                                : 'border-slate-300 bg-white hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-center space-x-5 flex-1">
                              <div className={`w-6 h-6 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
                                formData.role === option.value 
                                  ? (option.color === 'red' ? 'border-red-500 bg-red-500' : 'border-blue-500 bg-blue-500')
                                  : 'border-slate-400'
                              }`}>
                                {formData.role === option.value && (
                                  <div className="w-3 h-3 rounded-full bg-white"></div>
                                )}
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-slate-900">{option.label}</div>
                                <div className="text-base text-slate-600">{option.desc}</div>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="role"
                              value={option.value}
                              checked={formData.role === option.value}
                              onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                              className="sr-only"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 認証情報 */}
                <div className="border-t-2 border-slate-200 pt-8">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center mb-6">
                    <svg className="w-7 h-7 mr-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2h4a2 2 0 012 2v2m0 0h2a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z" />
                    </svg>
                    認証設定
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {[
                      { value: 'PASSWORD', label: 'パスワード認証', icon: '🔑', desc: '従来のメール・パスワード認証' },
                      { value: 'ENTRA_ID', label: 'Entra ID認証', icon: '🚀', desc: 'Microsoft Entra ID認証' }
                    ].map((option) => (
                      <label 
                        key={option.value} 
                        className={`flex items-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          formData.authType === option.value 
                            ? 'border-purple-400 bg-purple-50' 
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-5 flex-1">
                          <span className="text-3xl">{option.icon}</span>
                          <div>
                            <div className="text-lg font-semibold text-slate-900">{option.label}</div>
                            <div className="text-base text-slate-600">{option.desc}</div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="authType"
                          value={option.value}
                          checked={formData.authType === option.value}
                          onChange={(e) => setFormData({...formData, authType: e.target.value as AuthType})}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>

                  {formData.authType === 'PASSWORD' && (
                    <div className="form-group">
                      <label className="form-label">
                        パスワード {editingUser && '(変更する場合のみ入力)'}
                      </label>
                      <input
                        type="password"
                        required={!editingUser}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="form-input"
                        placeholder="8文字以上の安全なパスワード"
                      />
                    </div>
                  )}

                </div>

              </form>
            </div>
            {/* フッター */}
            <div className="flex justify-end space-x-4 px-6 py-4 border-t-2 border-slate-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingUser(null)
                      resetForm()
                    }}
                    className="btn btn-secondary min-w-[140px]"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-primary min-w-[140px]"
                  >
                    {editingUser ? (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>更新する</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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