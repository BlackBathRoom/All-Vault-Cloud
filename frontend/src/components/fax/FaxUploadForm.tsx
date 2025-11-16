import React, { useState } from 'react'
import { getPresignedUrl } from '../../api/uploadsApi.ts'

const FaxUploadForm: React.FC = () => {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!file) {
            setMessage('ファイルを選択してください')
            return
        }

        try {
            setUploading(true)
            setMessage('')

            // 署名付きURL取得
            const { url } = await getPresignedUrl(file.name, file.type)

            // S3にアップロード
            const response = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            })

            if (response.ok) {
                setMessage('アップロード成功！')
                setFile(null)
            } else {
                setMessage('アップロード失敗')
            }
        } catch (error) {
            console.error('Upload error:', error)
            setMessage('エラーが発生しました')
        } finally {
            setUploading(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '2rem',
                maxWidth: '500px',
            }}
        >
            <h2 style={{ marginBottom: '1.5rem' }}>FAXアップロード</h2>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>ファイル (PDF):</label>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </div>

            <button type="submit" disabled={uploading || !file}>
                {uploading ? 'アップロード中...' : 'アップロード'}
            </button>

            {message && (
                <div
                    style={{ marginTop: '1rem', color: message.includes('成功') ? 'green' : 'red' }}
                >
                    {message}
                </div>
            )}
        </form>
    )
}

export default FaxUploadForm
