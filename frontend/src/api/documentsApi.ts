import { apiClient } from './client.ts'
import { Document } from '../types/document.ts'

export const getDocuments = async (type?: string): Promise<Document[]> => {
    const query = type ? `?type=${type}` : ''
    return apiClient.get(`/documents${query}`)
}

export const getDocumentById = async (id: string): Promise<Document> => {
    return apiClient.get(`/documents/${id}`)
}
