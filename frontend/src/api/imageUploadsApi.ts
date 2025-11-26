import { apiClient } from './client'

export interface ImageUploadResponse {
  uploadUrl: string
  objectKey: string
  fileName: string
}

export interface ImageUploadResult {
  success: boolean
  objectKey?: string
  fileName?: string
  error?: string
}

/**
 * 画像アップロード用の署名付きURLを取得
 */
export const getImageUploadUrl = async (file: File): Promise<ImageUploadResponse> => {
  try {
    // Lambda関数のエンドポイントを呼び出し
    const fileType = file.type
    const originalFileName = file.name
    
    console.log('📡 画像アップロード用URL取得開始:', {
      fileType,
      fileName: originalFileName,
      endpoint: '/uploads/presigned-url',
      method: 'POST',
      timestamp: new Date().toISOString()
    })
    
    const res = await apiClient.post(
      "/uploads/presigned-url",
      {
        fileType: file.type,
        fileName: originalFileName,
      },
    )
    
    // レスポンスの詳細チェック
    if (!res) {
      throw new Error('APIからの応答が空です')
    }
    
    // PresignResponse型のレスポンス処理
    const uploadUrl = res.uploadUrl
    const objectKey = res.objectKey
    const fileName = res.fileName
    
    if (!uploadUrl) {
      console.error('❌ uploadUrlが含まれていません:', res)
      throw new Error('署名付きURLが応答に含まれていません')
    }
    
    if (!objectKey) {
      console.error('❌ objectKeyが含まれていません:', res)
      throw new Error('オブジェクトキーが応答に含まれていません')
    }
    
    if (!fileName) {
      console.error('❌ fileNameが含まれていません:', res)
      throw new Error('ファイル名が応答に含まれていません')
    }
    
    console.log('📥 署名付きURL取得成功:', {
      objectKey,
      fileName,
      uploadUrlLength: uploadUrl?.length || 0,
      hasUploadUrl: !!uploadUrl,
      urlDomain: uploadUrl ? new URL(uploadUrl).hostname : 'N/A'
    })
    
    return {
      uploadUrl,
      objectKey,
      fileName
    }
  } catch (error) {
    console.error('❌ 署名付きURL取得エラー:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name || 'Unknown',
      fileType: file.type,
      timestamp: new Date().toISOString()
    })
    
    // より具体的なエラーメッセージを提供
    if (error instanceof Error) {
      if (error.message.includes('ネットワーク接続エラー')) {
        throw new Error('ネットワーク接続エラー: APIサーバーとの通信に失敗しました。インターネット接続とCORS設定を確認してください。')
      } else if (error.message.includes('HTTP error')) {
        throw new Error(`APIサーバーエラー: ${error.message}`)
      } else {
        throw new Error(`署名付きURLの取得に失敗しました: ${error.message}`)
      }
    } else {
      throw new Error(`署名付きURLの取得に失敗しました: ${String(error)}`)
    }
  }
}

/**
 * 画像ファイルをS3にアップロード
 */
export const uploadImageToS3 = async (
  file: File,
  uploadUrl: string
): Promise<boolean> => {
  try {
    console.log('📤 S3アップロード開始:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })
    
    if (response.ok) {
      console.log('✅ S3アップロード成功')
      return true
    } else {
      console.error('❌ S3アップロード失敗:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('❌ S3アップロードエラー:', error)
    return false
  }
}

/**
 * 画像ファイルをアップロード（完全なフロー）
 */
export const uploadImage = async (file: File): Promise<ImageUploadResult> => {
  try {
    console.log('🚀 画像アップロード開始:', file.name)
    
    // ファイル種別の検証
    if (!file.type.startsWith('image/')) {
      throw new Error('画像ファイルを選択してください')
    }
    
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      throw new Error('JPEG または PNG ファイルを選択してください')
    }
    
    // Step 1: 署名付きURL取得
    const { uploadUrl, objectKey, fileName } = await getImageUploadUrl(file)
    
    // Step 2: S3にアップロード
    const uploadSuccess = await uploadImageToS3(file, uploadUrl)
    
    if (uploadSuccess) {
      console.log('🎉 画像アップロード完了:', { objectKey, fileName })
      return {
        success: true,
        objectKey: objectKey,
        fileName: fileName
      }
    } else {
      return {
        success: false,
        error: 'S3へのアップロードに失敗しました'
      }
    }
  } catch (error) {
    console.error('❌ 画像アップロードフローエラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    }
  }
}

/**
 * 複数の画像ファイルを一括アップロード
 */
export const uploadMultipleImages = async (files: File[]): Promise<ImageUploadResult[]> => {
  console.log('📁 複数ファイルアップロード開始:', files.length, '件')
  
  const results: ImageUploadResult[] = []
  
  for (const file of files) {
    const result = await uploadImage(file)
    results.push(result)
    
    // 少し間隔を空ける（API制限を考慮）
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const successCount = results.filter(r => r.success).length
  console.log(`📊 一括アップロード完了: ${successCount}/${files.length} 成功`)
  
  return results
}