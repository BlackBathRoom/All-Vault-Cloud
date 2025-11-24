import { apiClient } from './client'
import { Document } from '../types/document'

export interface UpdateTagsRequest {
    tags?: string[]
    folder?: string
    category?: string
}

/**
 * ドキュメントのタグを更新
 */
export async function updateDocumentTags(
    documentId: string,
    data: UpdateTagsRequest
): Promise<Document> {
    return apiClient.patch(`/documents/${documentId}/tags`, data)
}

/**
 * タグでドキュメントを検索
 */
export async function searchDocumentsByTag(tag: string): Promise<Document[]> {
    return apiClient.get(`/documents?tag=${encodeURIComponent(tag)}`)
}

/**
 * フォルダでドキュメントを検索
 */
export async function searchDocumentsByFolder(folder: string): Promise<Document[]> {
    return apiClient.get(`/documents?folder=${encodeURIComponent(folder)}`)
}

/**
 * カテゴリでドキュメントを検索
 */
export async function searchDocumentsByCategory(category: string): Promise<Document[]> {
    return apiClient.get(`/documents?category=${encodeURIComponent(category)}`)
}
