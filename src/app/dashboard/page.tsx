'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">
          {user.name}さん、おかえりなさい。（{user.department?.name}）
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>今月の発送数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">24</div>
            <p className="text-sm text-gray-600">前月比 +12%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>登録備品数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">158</div>
            <p className="text-sm text-gray-600">アクティブな備品</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>処理待ち</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">3</div>
            <p className="text-sm text-gray-600">未発送の注文</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近の発送</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium">オフィス用品セット</div>
                    <div className="text-sm text-gray-600">宛先: 東京オフィス</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    2024/01/15
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a 
                href="/items/new" 
                className="block p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <div className="font-medium text-blue-700">新しい備品を登録</div>
                <div className="text-sm text-blue-600">備品マスタに新しいアイテムを追加</div>
              </a>
              <a 
                href="/shipments/new" 
                className="block p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
              >
                <div className="font-medium text-green-700">発送を登録</div>
                <div className="text-sm text-green-600">新しい発送を作成</div>
              </a>
              <a 
                href="/shipments/bulk" 
                className="block p-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
              >
                <div className="font-medium text-purple-700">一括登録</div>
                <div className="text-sm text-purple-600">CSVファイルから一括登録</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {user.role === 'MANAGEMENT_USER' && (
        <Card>
          <CardHeader>
            <CardTitle>管理者メニュー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/departments" 
                className="p-4 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors text-center"
              >
                <div className="font-medium text-indigo-700">部署管理</div>
              </a>
              <a 
                href="/users" 
                className="p-4 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors text-center"
              >
                <div className="font-medium text-indigo-700">ユーザー管理</div>
              </a>
              <a 
                href="/reports" 
                className="p-4 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors text-center"
              >
                <div className="font-medium text-indigo-700">レポート出力</div>
              </a>
              <a 
                href="/bulk-imports" 
                className="p-4 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors text-center"
              >
                <div className="font-medium text-indigo-700">一括登録管理</div>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}