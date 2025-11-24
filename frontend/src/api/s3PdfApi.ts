// src/api/s3PdfApi.ts

import { apiClient } from './client'
import type { S3PdfFile, S3PdfFileViewModel } from '../types/s3PdfFile'

// Lambda の API Gateway パスに合わせて変更
const PDF_FILES_ENDPOINT = '/pdf-files' 
// 例: /files/pdf や /documents/pdf の可能性もあるので確認必要

// API → UI 用に変換
const mapToPdfViewModel = (item: S3PdfFile): S3PdfFileViewModel => {
  const fileName = item.key.split('/').pop() ?? item.key

  const sizeText =
    item.size != null ? `${(item.size / 1024).toFixed(1)} KB` : '-'

  const lastModifiedText =
    item.lastModified != null
      ? new Date(item.lastModified).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
        })
      : '-'

  return {
    ...item,
    fileName,
    sizeText,
    lastModifiedText,
  }
}

// PDF 一覧取得
export const listPdfFiles = async (): Promise<S3PdfFileViewModel[]> => {
  const apiData: S3PdfFile[] = await apiClient.get(PDF_FILES_ENDPOINT)
  return apiData.map(mapToPdfViewModel)
}
