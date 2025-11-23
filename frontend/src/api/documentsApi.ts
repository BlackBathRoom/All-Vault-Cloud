import { apiClient } from './client'
import { Document } from '../types/document'

type ApiDocument = {
  id: string
  type: "fax" | "email_body" | "email_attachment"
  subject: string | null
  from: string | null
  createdAt: string
}

// API のデータ → UI 用データに変換
const mapToDocument = (item: ApiDocument): Document => {
  let mappedType: Document["type"]

  switch (item.type) {
    case "fax":
      mappedType = "fax"
      break
    case "email_body":
      mappedType = "email"
      break
    case "email_attachment":
      mappedType = "document"
      break
    default:
      mappedType = "document"
  }

  return {
    id: item.id,
    type: mappedType,
    subject: item.subject ?? "(件名なし)",
    sender: item.from ?? "(送信者不明)",
    receivedAt: new Date(item.createdAt).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    }),
  }
}

export const getDocuments = async (type?: string): Promise<Document[]> => {
  const query = type ? `?type=${type}` : ''
  const apiData: ApiDocument[] = await apiClient.get(`/documents${query}`)
  return apiData.map(mapToDocument)
}

export const getDocumentById = async (id: string): Promise<Document> => {
  const apiData: ApiDocument = await apiClient.get(`/documents/${id}`)
  return mapToDocument(apiData)
}
