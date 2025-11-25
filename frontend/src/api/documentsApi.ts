// frontend/src/api/documentsApi.ts
import { apiClient } from './client'
import { Document } from '../types/document'

// ----------------------
// API から返ってくる形
// ----------------------
type ApiDocument = {
  id: string
  type: 'fax' | 'email' | 'document'
  subject: string
  sender: string
  receivedAt: string
  s3Key: string
  fileUrl: string | null
  fileSize: number | null
}


// メモ1件分
export type DocumentMemo = {
  memoId: string
  text: string
  page: number | null
  createdAt: string
  updatedAt: string
}

// ----------------------
// 文書一覧 GET /documents
// ----------------------
// ----------------------
// 文書一覧 GET /documents
// ----------------------
// GET /documents → DynamoDB の Documents を取得
export const getDocuments = async (): Promise<Document[]> => {
    try {
        console.log('📡 Documents API 呼び出し開始...')
  
        const raw = await apiClient.get('/documents')
        
        console.log('📥 生レスポンス:', raw)
  
        // 配列でも、{ documents: [...] } でも OK にする
        const apiDocs = Array.isArray(raw) ? raw : raw.documents ?? []
  
        console.log('📊 取得件数:', apiDocs.length)
  
        return apiDocs.map((d: ApiDocument): Document => ({
            id: d.id,
            type: d.type,
            subject: d.subject,
            sender: d.sender,
            receivedAt: d.receivedAt,
            s3Key: d.s3Key,
            fileUrl: d.fileUrl ?? undefined,
            fileSize: d.fileSize ?? undefined,
        }))
    } catch (error) {
        console.error('❌ Documents API エラー:', error)
        throw new Error(`文書一覧の取得に失敗しました: ${error}`)
    }
}
  
  

// ----------------------
// 単一取得（一覧から絞り込み）
// ----------------------
export const getDocumentById = async (id: string): Promise<Document> => {
    const documents = await getDocuments()
    const doc = documents.find((d) => d.id === id)

    if (!doc) {
        throw new Error(`Document not found for id: ${id}`)
    }

    return doc
}

// ----------------------
// メモ一覧 GET /documents/{id}/memos
// ----------------------
export const getDocumentMemos = async (
    documentId: string
): Promise<DocumentMemo[]> => {
    try {
        const response = (await apiClient.get(
            `/documents/${documentId}/memos`
        )) as DocumentMemo[]

        return response
    } catch (error) {
        console.error('❌ メモ一覧取得エラー:', error)
        throw new Error('メモ一覧の取得に失敗しました')
    }
}

// ----------------------
// メモ作成 POST /documents/{id}/memos
// ----------------------
export const createDocumentMemo = async (
    documentId: string,
    input: { text: string; page?: number | null }
): Promise<DocumentMemo> => {
    try {
        const payload = {
            text: input.text,
            page: input.page ?? null,
        }

        const response = (await apiClient.post(
            `/documents/${documentId}/memos`,
            payload
        )) as DocumentMemo

        return response
    } catch (error) {
        console.error('❌ メモ作成エラー詳細:', error)
        throw new Error('メモの作成に失敗しました')
    }
}
