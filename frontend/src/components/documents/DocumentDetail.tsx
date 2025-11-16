import React from 'react'
import { Document } from '../../types/document'

interface DocumentDetailProps {
    document: Document
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({ document }) => {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{document.subject}</h2>

            <div style={{ marginBottom: '1rem' }}>
                <strong>種別:</strong> {document.type === 'fax' ? 'FAX' : 'メール'}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <strong>送信者:</strong> {document.sender}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <strong>受信日時:</strong> {new Date(document.receivedAt).toLocaleString('ja-JP')}
            </div>

            {document.extractedText && (
                <div style={{ marginTop: '2rem' }}>
                    <strong>抽出テキスト:</strong>
                    <pre
                        style={{
                            backgroundColor: '#f5f5f5',
                            padding: '1rem',
                            borderRadius: '4px',
                            marginTop: '0.5rem',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {document.extractedText}
                    </pre>
                </div>
            )}
        </div>
    )
}

export default DocumentDetail
