// src/types/s3PdfFile.ts

export interface S3PdfFile {
  key: string
  url: string
  size: number | null
  lastModified: string | null
}

export interface S3PdfFileViewModel extends S3PdfFile {
  fileName: string
  sizeText: string
  lastModifiedText: string
}
