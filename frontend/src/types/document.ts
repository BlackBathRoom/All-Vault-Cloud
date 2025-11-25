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
    memos?: DocumentMemo[] 
}

export type DocumentMemo = {
  memoId: string
  text: string
  page: number | null
  createdAt: string
  updatedAt: string
}
