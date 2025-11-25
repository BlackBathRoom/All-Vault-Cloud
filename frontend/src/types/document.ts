export interface Document {
    id: string
    type: 'fax' | 'email' | 'document'
    subject: string
    sender: string
    receivedAt: string
    s3Key?: string
    extractedText?: string
    metadata?: Record<string, unknown>
    // S3関連の追加フィールド
    fileUrl?: string    // 署名付きダウンロードURL
    fileSize?: number | null   // ファイルサイズ（bytes）
    
    // タグ・分類機能
    tags?: string[]              // 手動タグ ["important", "invoice", "contract"]
    folder?: string              // フォルダ名 "請求書", "注文書", "契約書"
    category?: DocumentCategory  // 自動分類カテゴリ
    classificationConfidence?: number  // AI分類の信頼度 0-1
}

// ドキュメントカテゴリの定義
export type DocumentCategory = 
    | 'invoice'      // 請求書
    | 'order'        // 注文書
    | 'contract'     // 契約書
    | 'quotation'    // 見積書
    | 'receipt'      // 領収書
    | 'notification' // 通知
    | 'internal'     // 社内文書
    | 'other'        // その他

// タグの定義（推奨タグリスト）
export const PREDEFINED_TAGS = [
    'important',     // 重要
    'urgent',        // 緊急
    'invoice',       // 請求書
    'order',         // 注文
    'contract',      // 契約
    'payment',       // 支払い
    'internal',      // 社内
    'customer',      // 顧客
    'supplier',      // 取引先
    'archived',      // アーカイブ済み
] as const

export type PredefinedTag = typeof PREDEFINED_TAGS[number]

// カテゴリの日本語表示名
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
    invoice: '請求書',
    order: '注文書',
    contract: '契約書',
    quotation: '見積書',
    receipt: '領収書',
    notification: '通知',
    internal: '社内文書',
    other: 'その他',
}

// タグの日本語表示名
export const TAG_LABELS: Record<PredefinedTag, string> = {
    important: '重要',
    urgent: '緊急',
    invoice: '請求書',
    order: '注文',
    contract: '契約',
    payment: '支払い',
    internal: '社内',
    customer: '顧客',
    supplier: '取引先',
    archived: 'アーカイブ済み',
}
