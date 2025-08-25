# アイキューブ社内向け本部便発送システム開発プロンプト

## プロジェクト概要

アイキューブ社内向けの本部便発送システムを開発してください。各発送部署が備品登録・管理・発送登録を行い、本部便管理部門が全発送部署のデータを参照できるWebアプリケーションです。

## システム要件

### 機能要件

#### 1. 認証・認可機能
- Microsoft Entra ID (Azure AD) による企業シングルサインオン
- パスワード認証（フォールバック）
- JWT + Session ハイブリッド認証方式
- 役割ベースアクセス制御（発送部署 / 管理部門）

#### 2. 発送部署向け機能
- 備品マスタ登録・編集・削除
- 発送便登録・編集・削除
- 発送便一括登録（CSV/Excel インポート機能）
- 発送履歴参照
- 部署内データのみ参照可能

#### 3. 本部便管理部門向け機能
- 全発送部署のデータ参照
- 全社発送状況ダッシュボード
- レポート機能（CSV出力）
- 一括登録データの検証・修正機能

#### 4. 共通機能
- レスポンシブデザイン対応
- データ検索・フィルタリング
- ページネーション
- CSV/Excelファイルアップロード機能
- 一括登録バリデーション・エラー表示
- エラーハンドリング
- ローディング状態表示

### 技術仕様

#### フロントエンド
- **フレームワーク**: React 18 + TypeScript
- **デザインシステム**: デジタル庁デザインシステム準拠
- **状態管理**: React Context（AuthContext中心）
- **フォント**: Noto Sans JP（メイン）、Noto Sans Mono（等幅）
- **テスト**: Vitest + React Testing Library

#### バックエンド
- **フレームワーク**: Next.js 14（App Router）
- **API**: REST API + Server Actions
- **バリデーション**: Joi validation
- **認証**: JWT + Session + Entra ID SSO

#### データベース
- **開発環境**: PostgreSQL
- **本番環境**: Vercel Postgres
- **ORM**: Prisma（推奨）

#### インフラ・デプロイ
- **プラットフォーム**: Vercel（フルスタック統合）
- **環境変数**: `.env.local`（開発）/ Vercel Dashboard（本番）

## データベース設計案

### 主要テーブル

```sql
-- ユーザーテーブル
users (id, entra_id, email, name, password_hash, department_id, role, auth_type, created_at, updated_at)

-- 部署テーブル
departments (id, name, code, is_management, created_at, updated_at)

-- 備品マスタテーブル
items (id, name, category, unit, department_id, created_at, updated_at)

-- 発送便テーブル
shipments (id, item_id, quantity, sender_id, department_id, destination, tracking_number, notes, shipped_at, created_at, updated_at)

-- 一括登録履歴テーブル
bulk_imports (id, file_name, total_records, success_records, error_records, uploaded_by, status, created_at, updated_at)

-- 一括登録エラーテーブル  
bulk_import_errors (id, bulk_import_id, row_number, error_message, row_data, created_at)
```

## 開発プロセス（Claude Code推奨ワークフロー準拠）

### Phase 1: プロジェクト初期化
1. 現在のディレクトリにNext.js + TypeScript プロジェクトを初期化
2. 必要なパッケージのインストール
3. 基本ディレクトリ構造の構築
4. デジタル庁デザインシステムのセットアップ

### Phase 2: 認証基盤構築
1. Entra ID SSO設定
2. パスワード認証実装（bcryptハッシュ化）
3. JWT + Session認証実装
4. 複数認証方式対応
5. AuthContext + ミドルウェア作成
6. 認証テスト実装

### Phase 3: データベース・API構築
1. Prismaスキーマ定義
2. データベースマイグレーション
3. API Routes実装（CRUD操作）
4. 一括登録API実装（CSV/Excel処理）
5. バリデーション実装
6. APIテスト実装

### Phase 4: UI/UX実装
1. デジタル庁デザインシステム適用
2. 共通コンポーネント作成
3. ログイン画面実装（SSO/パスワード選択）
4. ページコンポーネント実装
5. 一括登録UI実装（ファイルアップロード・進捗表示）
6. レスポンシブ対応
7. フロントエンドテスト実装

### Phase 5: 統合・最適化
1. フロントエンド・バックエンド統合
2. エラーハンドリング強化
3. パフォーマンス最適化
4. セキュリティ監査
5. 統合テスト実装

### Phase 6: デプロイ・運用準備
1. Vercelデプロイ設定
2. 環境変数設定
3. 本番データベース接続
4. 監視・ログ設定

## 実装指針

### セキュリティ
- CSRFプロテクション実装
- XSS対策（サニタイゼーション）
- SQLインジェクション対策（Prisma使用）
- 役割ベースアクセス制御の厳格化

### パフォーマンス
- Next.js App Routerによる最適化
- 画像最適化（next/image）
- キャッシュ戦略実装
- lazy loading適用

### UX/UI
- デジタル庁デザインシステム準拠
- アクセシビリティ対応（WCAG 2.1 AA準拠）
- 直感的なナビゲーション
- 適切なローディング・エラー状態

## 開発開始コマンド

プロジェクト作成済み

## 注意事項

1. **プロジェクト初期化は不要**
2. **Claude Code推奨ワークフロー**: 段階的開発、テスト駆動開発、継続的インテグレーション
3. **デジタル庁デザインシステム**: 公式ガイドラインに厳格に準拠
4. **セキュリティ**: 企業向けシステムとして適切なセキュリティ実装
5. **テスト**: 各フェーズでの十分なテストカバレッジ確保
6. **ドキュメント**: 開発進捗に応じた適切なドキュメント作成

上記要件に基づき、現在のディレクトリにアイキューブ社内向け本部便発送システムを段階的に開発してください。