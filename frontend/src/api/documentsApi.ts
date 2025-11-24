import { apiClient } from './client'
import { Document } from '../types/document'

// Lambda（S3一覧API）から返ってくる生データの型
type S3ApiFile = {
  key: string
  url: string
  size: number | null
  lastModified: string | null
}

// API のデータ → UI 用 Document に変換
const mapToDocument = (item: S3ApiFile): Document => {
  // ファイル名だけ抜き出し
  const fileName = item.key.split('/').pop() ?? item.key

  // 日付の整形
  const receivedAt =
    item.lastModified != null
      ? new Date(item.lastModified).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
        })
      : '(日時不明)'

  return {
    id: item.key,                 // 一意なIDとして S3キーを使う
    type: 'fax',                  // PDF（FAX文書）として扱う
    subject: fileName,            // 件名代わりにファイル名
    sender: '(S3アップロード)',   // 送信者情報が無いので固定文言
    receivedAt,                   // 整形済み日付
    s3Key: item.key,              // ダウンロード等で使えるように保持
    fileUrl: item.url,            // 署名付きダウンロードURL
    fileSize: item.size,          // ファイルサイズ
  }
}

// 一覧取得：/documents は S3 の PDF一覧を返す Lambda に紐づいている
export const getDocuments = async (_type?: string): Promise<Document[]> => {
  try {
    console.log('📡 S3 Lambda API 呼び出し開始...')
    
    // 🧪 モックデータでテスト（API Gateway未デプロイ対応）
    const USE_MOCK_DATA = false // 実API有効時はfalseに変更 ✅ 実API使用中
    
    if (USE_MOCK_DATA) {
      console.log('🧪 モックデータを使用中...')
      
      // モックのS3ファイルデータ
      const mockApiData: S3ApiFile[] = [
        {
          key: 'uploads/pdf/fax-001.pdf',
          url: 'https://example.com/mock-signed-url-1',
          size: 156789,
          lastModified: '2025-11-23T10:30:00.000Z'
        },
        {
          key: 'uploads/pdf/fax-002.pdf',
          url: 'https://example.com/mock-signed-url-2',
          size: 234567,
          lastModified: '2025-11-22T14:15:00.000Z'
        },
        {
          key: 'uploads/pdf/document-003.pdf',
          url: 'https://example.com/mock-signed-url-3',
          size: 345678,
          lastModified: '2025-11-21T09:45:00.000Z'
        },
        {
          key: 'uploads/pdf/scan-004.pdf',
          url: 'https://example.com/mock-signed-url-4',
          size: 123456,
          lastModified: '2025-11-20T16:20:00.000Z'
        }
      ]
      
      console.log('📥 モックレスポンス:', mockApiData)
      console.log('📊 モックファイル数:', mockApiData.length)
      
      const documents = mockApiData.map(mapToDocument)
      
      console.log('✅ モックDocument変換完了:', documents)
      
      return documents
    }
    
    // 実際のS3 PDFファイル一覧APIを呼び出し
    const response: { files: S3ApiFile[] } = await apiClient.get('/uploads/pdf')
    const apiData: S3ApiFile[] = response.files
    
    console.log('📥 Lambda レスポンス:', apiData)
    console.log('📊 取得ファイル数:', apiData.length)
    
    const documents = apiData.map(mapToDocument)
    
    console.log('✅ Document変換完了:', documents)
    
    return documents
  } catch (error) {
    console.error('❌ S3 Lambda API エラー:', error)
    throw new Error(`S3ファイルの取得に失敗しました: ${error}`)
  }
}

// 単一取得：バックエンドに /documents/{id} が無いので、
// 一度一覧を取ってからフロント側で絞り込む方式にしておく
export const getDocumentById = async (id: string): Promise<Document> => {
  const documents = await getDocuments()
  const doc = documents.find((d) => d.id === id)

  if (!doc) {
    throw new Error(`Document not found for id: ${id}`)
  }

  return doc
}
