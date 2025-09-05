/**
 * 発送関連のユーティリティ関数
 */

/**
 * 発送が過去に完了済みかどうかをチェック
 * @param shippedAt 発送日時
 * @returns 発送済み（編集・削除不可）の場合true
 */
export function isShipmentLocked(shippedAt: Date | string | null): boolean {
  if (!shippedAt) return false // 未発送は編集可能
  
  const shippedDate = new Date(shippedAt)
  const now = new Date()
  
  // 現在時刻より過去の場合は編集・削除不可
  return shippedDate < now
}

/**
 * 発送ロック状態のメッセージを取得
 * @param action 'edit' | 'delete'
 * @returns エラーメッセージ
 */
export function getShipmentLockMessage(action: 'edit' | 'delete'): string {
  const actionText = action === 'edit' ? '編集' : '削除'
  return `発送済みのデータは${actionText}できません`
}