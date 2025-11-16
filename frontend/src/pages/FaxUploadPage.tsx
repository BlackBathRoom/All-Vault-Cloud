import React from 'react'
import FaxUploadForm from '../components/fax/FaxUploadForm.tsx'

const FaxUploadPage: React.FC = () => {
    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>FAXアップロード</h1>

            <FaxUploadForm />

            <div
                style={{
                    marginTop: '2rem',
                    backgroundColor: '#e7f3ff',
                    padding: '1rem',
                    borderRadius: '8px',
                    maxWidth: '500px',
                }}
            >
                <h3 style={{ marginBottom: '0.5rem' }}>ℹ️ 使い方</h3>
                <ul style={{ marginLeft: '1.5rem' }}>
                    <li>PDFファイルを選択してアップロードしてください</li>
                    <li>アップロード後、自動的にOCR処理が実行されます</li>
                    <li>処理が完了すると文書一覧に表示されます</li>
                </ul>
            </div>
        </div>
    )
}

export default FaxUploadPage
