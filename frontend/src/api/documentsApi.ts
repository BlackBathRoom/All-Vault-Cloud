import { apiClient } from './client'
// ----------------------
// APIレスポンス型
// ----------------------
export type ApiDocument = {
  id: string
  subject: string
  receivedAt: string
  fileUrl: string 
  tags?: string[]
  category: "fax" | "email"
  latestMemo?: {
    text: string
    updatedAt: string
  };
}

export type DocumentsResponse =
  | ApiDocument[]
  | { documents: ApiDocument[] }

// メモ1件
export type DocumentMemo = {
  memoId: string
  text: string
  page: number | null
  createdAt: string
  updatedAt: string
}

// -------------------------------------
// axios / fetch 両方に対応する unwrap
// -------------------------------------
function unwrapData<T>(response: unknown): T {
// axios の場合 → { data: ... }
    if (
        typeof response === 'object' &&
    response !== null &&
    'data' in response
    ) {
        return (response as { data: T }).data
    }

    // fetch ラップ or 生 JSON の場合
    return response as T
}

// -------------------------------------
// 空メモ判定（ここは必ず getDocuments より上に置く）
// -------------------------------------
const isEmptyText = (text: string | null | undefined): boolean => {
    return !text || text.trim() === ''
}

// ----------------------
// 文書一覧 GET /documents
// ----------------------
export const getDocuments = async (): Promise<ApiDocument[]> => {
    try {
        const response = await apiClient.get('/documents') as { files: ApiDocument[] }
        return response.files
    } catch (error) {
        console.error('❌ Documents API エラー:', error)
        throw new Error('文書一覧の取得に失敗しました')
    }
}

// ----------------------
// メモ一覧 GET /documents/{id}/memos
// ----------------------
export const getDocumentMemos = async (
    documentId: string
): Promise<DocumentMemo[]> => {
    const response = await apiClient.get(
        `/documents/${documentId}/memos`
    )

    const memos = unwrapData<DocumentMemo[]>(response)

    // 空メモ（一切の文字なし）は除外する
    return memos.filter((m) => !isEmptyText(m.text))
}

// ----------------------
// メモ作成 POST /documents/{id}/memos
// ----------------------
export const createDocumentMemo = async (
    documentId: string,
    input: { text: string; page?: number | null }
): Promise<DocumentMemo> => {
    const payload = {
        text: input.text,
        page: input.page ?? null,
    }

    const response = await apiClient.post(
        `/documents/${documentId}/memos`,
        payload
    )

    return unwrapData<DocumentMemo>(response)
}

// ----------------------
// メモ削除 POST /documents/{id}/memos (mode: delete)
// ----------------------
export const deleteDocumentMemo = async (
    documentId: string,
    memoId: string
): Promise<void> => {
    try {
        await apiClient.post(`/documents/${documentId}/memos`, {
            mode: 'delete',
            memoId,
        })
    } catch (error) {
        console.error('❌ メモ削除エラー:', error)
        throw new Error('メモの削除に失敗しました')
    }
}

// ----------------------
// メモ更新 POST /documents/{id}/memos (mode: update)
// ----------------------
export const updateDocumentMemo = async (
    documentId: string,
    memoId: string,
    input: { text: string; page?: number | null }
): Promise<DocumentMemo> => {
    try {
        const payload = {
            mode: 'update',
            memoId,
            text: input.text,
            page: input.page ?? null,
        }

        const response = await apiClient.post(
            `/documents/${documentId}/memos`,
            payload
        )

        return unwrapData<DocumentMemo>(response)
    } catch (error) {
        console.error('❌ メモ更新エラー:', error)
        throw new Error('メモの更新に失敗しました')
    }
}
