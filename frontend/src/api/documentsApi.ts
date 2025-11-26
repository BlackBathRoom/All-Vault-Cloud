import { apiClient } from './client'
import type { Document } from '../types/document'

/**
 * バックエンド（/documents API）から返ってくる文書データの型
 * README のサンプルに合わせた最小限の定義だけを持っています。
 */
type BackendDocument = {
  id: string
  type?: 'fax' | 'email' | 'document'
  subject?: string | null
  sender?: string | null
  receivedAt?: string | null
  createdAt?: string | null
  s3Key?: string
  extractedText?: string
  metadata?: Record<string, unknown>
  tags?: string[]
  folder?: string
}

/**
 * API の生データ → フロントエンド用 Document 型 に変換
 */
const mapToDocument = (item: BackendDocument): Document => {
  const receivedAt = item.receivedAt ?? item.createdAt ?? ''

  // type が未知の場合は 'document' として扱う
  const docType: Document['type'] =
    item.type === 'fax' || item.type === 'email' ? item.type : 'document'

  return {
    id: item.id,
    type: docType,
    subject: item.subject ?? '',
    sender: item.sender ?? '',
    receivedAt,
    s3Key: item.s3Key,
    extractedText: item.extractedText,
    metadata: item.metadata,
    tags: item.tags,
    folder: item.folder,
  }
}

/**
 * 文書一覧取得
 * バックエンドの GET /documents を叩いて、必要に応じて type でフィルタします。
 *
 * @param type - 例: 'fax', 'email', 'email_body', 'email_attachment' など
 */
export const getDocuments = async (type?: string): Promise<Document[]> => {
  const endpoint = type ? `/documents?type=${encodeURIComponent(type)}` : '/documents'

  const response = await apiClient.get(endpoint)

  if (!Array.isArray(response)) {
    throw new Error('Invalid response format: documents list must be an array')
  }

  return response.map((item) => mapToDocument(item as BackendDocument))
}

/**
 * 単一文書取得
 * まだバックエンドの /documents/{id} を直接は使わず、
 * 一度一覧を取ってからフロント側で絞り込む方式にしておきます。
 */
export const getDocumentById = async (id: string): Promise<Document> => {
  const documents = await getDocuments()
  const doc = documents.find((d) => d.id === id)

  if (!doc) {
    throw new Error(`Document not found for id: ${id}`)
  }

  return doc
}
