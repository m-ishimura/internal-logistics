# アイキューブ社内向け本部便発送システム

## 概要

アイキューブ社内向けの本部便発送システムです。各発送部署が備品登録・管理・発送登録を行い、本部便管理部門が全発送部署のデータを参照できるWebアプリケーションです。

## 機能

### 認証・認可機能
- Microsoft Entra ID (Azure AD) による企業シングルサインオン
- パスワード認証（フォールバック）
- JWT + Session ハイブリッド認証方式
- 役割ベースアクセス制御（発送部署 / 管理部門）

### 発送部署向け機能
- 備品マスタ登録・編集・削除
- 発送便登録・編集・削除
- 発送便一括登録（CSV/Excel インポート機能）
- 発送履歴参照
- 部署内データのみ参照可能

### 本部便管理部門向け機能
- 全発送部署のデータ参照
- 全社発送状況ダッシュボード
- レポート機能（CSV出力）
- 一括登録データの検証・修正機能

### 共通機能
- レスポンシブデザイン対応
- データ検索・フィルタリング
- ページネーション
- CSV/Excelファイルアップロード機能
- 一括登録バリデーション・エラー表示
- エラーハンドリング
- ローディング状態表示

## 技術スタック

### フロントエンド
- **フレームワーク**: React 18 + TypeScript
- **デザインシステム**: デジタル庁デザインシステム準拠
- **状態管理**: React Context（AuthContext中心）
- **フォント**: Noto Sans JP（メイン）、Noto Sans Mono（等幅）
- **スタイリング**: Tailwind CSS

### バックエンド
- **フレームワーク**: Next.js 15（App Router）
- **API**: REST API + Server Actions
- **バリデーション**: Joi validation
- **認証**: JWT + Session + Entra ID SSO

### データベース
- **開発環境**: PostgreSQL
- **本番環境**: Vercel Postgres
- **ORM**: Prisma

### インフラ・デプロイ
- **プラットフォーム**: Vercel（フルスタック統合）
- **環境変数**: `.env.local`（開発）/ Vercel Dashboard（本番）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/internal_logistics"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Session Secret
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Azure Entra ID (optional)
AZURE_CLIENT_ID=""
AZURE_CLIENT_SECRET=""
AZURE_TENANT_ID=""

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. データベースのセットアップ

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma migrate dev --name init

# サンプルデータの投入（オプション）
npx prisma db seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## サンプルデータ

シードスクリプトを実行すると、以下のサンプルユーザーが作成されます：

- **管理者**: admin@icube.co.jp (パスワード: password123)
- **IT部ユーザー**: it.user@icube.co.jp (パスワード: password123)
- **営業部ユーザー**: sales.user@icube.co.jp (パスワード: password123)

## 使用方法

### ログイン
1. ブラウザで http://localhost:3000 にアクセス
2. Microsoft Entra ID でログインするか、メールアドレスとパスワードでログイン
3. ダッシュボードが表示されます

### 備品管理
1. 「備品管理」メニューから備品一覧を表示
2. 「新しい備品を登録」ボタンから新しい備品を追加
3. 既存備品の編集・削除が可能

### 発送管理
1. 「発送管理」メニューから発送一覧を表示
2. 「新しい発送を登録」ボタンから個別発送を登録
3. 「一括登録」ボタンからCSV/Excelファイルで一括登録

### レポート機能（管理者のみ）
1. 「レポート」メニューから全社の発送状況を確認
2. 期間やフィルターを設定してデータを抽出
3. CSV形式でデータをエクスポート

## ビルドとデプロイ

### 開発ビルド
```bash
npm run build
```

### 本番環境での実行
```bash
npm run start
```

### Vercelへのデプロイ
1. Vercelアカウントを作成
2. GitHubリポジトリを連携
3. 環境変数をVercel Dashboardで設定
4. 自動デプロイが実行されます

## セキュリティ

- CSRFプロテクション実装
- XSS対策（サニタイゼーション）
- SQLインジェクション対策（Prisma使用）
- 役割ベースアクセス制御の厳格化
- JWT トークンによる認証

## アクセシビリティ

- WCAG 2.1 AA準拠
- スクリーンリーダー対応
- キーボードナビゲーション対応
- 適切なARIA属性の設定

## ライセンス

このプロジェクトは企業内部使用を目的としています。
