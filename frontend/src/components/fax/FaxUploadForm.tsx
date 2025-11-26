import React, { useState } from 'react'
import { Upload, Camera, FileText, Info } from 'lucide-react'
import { Button } from '../ui/button'
import { uploadImage, type ImageUploadResult } from '../../api/imageUploadsApi'
import type { Document } from '../../types/document'
import CameraModal from './CameraModal'

const FaxUploadForm: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
    const [isDragging, setIsDragging] = useState(false)
    const [message, setMessage] = useState('')
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
            setSelectedFile(file)
            setMessage('')
        } else {
            setMessage('PNG または JPEG ファイルを選択してください')
        }
    }

    const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setMessage('')
        }
    }

    const handleCameraClick = () => {
        // WebRTC対応チェック
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
            setIsCameraModalOpen(true)
        } else {
            // フォールバック：ファイル選択
            const fileInput = document.getElementById('camera-capture') as HTMLInputElement
            fileInput?.click()
        }
    }

    const handleCameraModalCapture = (file: File) => {
        setSelectedFile(file)
        setMessage('')
    }

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setIsDragging(false)
        
        const files = event.dataTransfer.files
        if (files.length > 0) {
            const file = files[0]
            if (file.type === 'image/png' || file.type === 'image/jpeg') {
                setSelectedFile(file)
                setMessage('')
            } else {
                setMessage('PNG または JPEG ファイルを選択してください')
            }
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        try {
            setUploadStatus('uploading')
            setMessage('')

            console.log('🚀 FaxUploadForm: アップロード開始', {
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                fileSize: selectedFile.size
            })

            // imageUploadsApiのuploadImage関数を使用（統合フロー）
            const result: ImageUploadResult = await uploadImage(selectedFile)

            if (result.success) {
                setUploadStatus('success')
                
                // アップロード成功時に元ファイル名を表示
                const displayName = result.fileName || selectedFile.name
                setMessage(`アップロード成功！ファイル名: ${displayName}`)
                
                console.log('✅ FaxUploadForm: アップロード成功', {
                    objectKey: result.objectKey,
                    fileName: result.fileName,
                    originalFileName: selectedFile.name
                })

                // ここでDocument型のデータを作成（例：将来的にDocumentListに追加する場合）
                const newDocument: Document = {
                    id: crypto.randomUUID(), // 仮のID生成
                    type: 'fax' as const,
                    subject: result.fileName || selectedFile.name, // ★ 元ファイル名を件名に
                    sender: '画像アップロード',
                    receivedAt: new Date().toISOString(),
                    s3Key: result.objectKey, // S3オブジェクトキー
                }
                
                console.log('📄 作成されたDocument:', newDocument)
                
                setTimeout(() => {
                    setSelectedFile(null)
                    setUploadStatus('idle')
                    setMessage('')
                }, 5000) // 5秒間表示（ファイル名を確認できるよう少し長め）
            } else {
                setUploadStatus('error')
                setMessage(result.error || 'アップロードに失敗しました')
                
                console.error('❌ FaxUploadForm: アップロード失敗', {
                    error: result.error
                })
            }
        } catch (error) {
            console.error('❌ FaxUploadForm: アップロードエラー', error)
            setUploadStatus('error')
            const errorMessage = error instanceof Error ? error.message : String(error)
            setMessage(`エラー: ${errorMessage}`)
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        setUploadStatus('idle')
        setMessage('')
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    FAXアップロード
                </h1>
                <p className="text-slate-600 text-sm md:text-base px-4 md:px-0">
                    <span className="hidden md:inline">PNG・JPEGファイルをアップロードするか、カメラで直接撮影してください</span>
                    <span className="md:hidden">ファイルを選択するか、カメラで撮影してください</span>
                </p>
            </div>

            {/* メインカード */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
                {/* ドラッグ&ドロップエリア - デスクトップのみ表示 */}
                <div
                    className={`hidden md:block border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-colors ${
                        isDragging
                            ? 'border-blue-400 bg-blue-50'
                            : selectedFile
                            ? 'border-gray-300 bg-white'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {selectedFile ? (
                        /* デスクトップ用：選択されたファイルの表示 */
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <FileText className="size-12 text-blue-600" />
                                <div className="text-left">
                                    <p className="text-sm text-slate-500 mb-1">
                                        ファイル (画像)
                                    </p>
                                    <p className="font-medium text-slate-900 mb-1">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeFile}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300 px-4 py-2"
                            >
                                削除
                            </Button>
                        </div>
                    ) : (
                        /* 通常のドラッグ&ドロップ表示 */
                        <>
                            <Upload className="size-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                ファイルをドラッグ&ドロップ
                            </h3>
                            <p className="text-slate-500">
                                または下のボタンから選択してください
                            </p>
                        </>
                    )}
                </div>

                {/* モバイル用：選択されたファイル表示エリア */}
                {selectedFile && (
                    <div className="md:hidden bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FileText className="size-10 text-blue-600 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-500 mb-1">
                                        選択されたファイル
                                    </p>
                                    <p className="font-medium text-slate-900 mb-1 truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeFile}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-300 px-3 py-2 ml-2"
                            >
                                削除
                            </Button>
                        </div>
                    </div>
                )}

                {/* ファイル選択・カメラボタン - ファイルが選択されていない場合のみ表示 */}
                {!selectedFile && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ファイル選択カード */}
                        <div className="border border-slate-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                            <div className="text-center">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        id="file-upload"
                                    />
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Upload className="size-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-slate-900">
                                                ファイルを選択
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                PNG・JPEGファイルのみ対応
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* カメラ撮影カード */}
                        <div 
                            className="border border-slate-300 rounded-lg p-6 hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                            onClick={handleCameraClick}
                        >
                            <div className="text-center">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <Camera className="size-8 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-slate-900">
                                            カメラで撮影
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            写真を直接撮影
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* フォールバック用のhiddenファイル入力 */}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleCameraCapture}
                            className="hidden"
                            id="camera-capture"
                        />
                    </div>
                )}

                {/* アップロードボタン */}
                <div>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploadStatus === 'uploading'}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white disabled:bg-slate-400"
                    >
                        <Upload className="size-4 mr-2" />
                        {uploadStatus === 'uploading' ? 'アップロード中...' : 'アップロード'}
                    </Button>

                    {/* メッセージ表示 */}
                    {message && (
                        <div className={`mt-3 p-3 rounded-lg text-sm ${
                            uploadStatus === 'success' 
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : uploadStatus === 'error'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* 使い方 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                    <Info className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-blue-900 mb-2">使い方</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• PNG または JPEG ファイルを選択してアップロードしてください</li>
                            <li>• アップロード後、自動的にOCR処理が実行されます</li>
                            <li>• 処理が完了すると文書一覧に表示されます</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* カメラモーダル */}
            <CameraModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={handleCameraModalCapture}
            />
        </div>
    )
}

export default FaxUploadForm
