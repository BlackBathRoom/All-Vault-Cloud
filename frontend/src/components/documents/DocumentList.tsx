import React, { useState, useEffect } from 'react'
import { getDocuments } from '../../api/documentsApi.ts'
import { Document } from '../../types/document.ts'

interface DocumentListProps {
    filter?: string
}

const DocumentList: React.FC<DocumentListProps> = ({ filter }) => {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true)
                const data = await getDocuments(filter)
                setDocuments(data)
            } catch (error) {
                console.error('Failed to fetch documents:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDocuments()
    }, [filter])

    if (loading) {
        return <div>読み込み中...</div>
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>種別</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>件名</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>送信者</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>受信日時</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map(doc => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.75rem' }}>
                                {doc.type === 'fax' ? 'FAX' : 'メール'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>{doc.subject}</td>
                            <td style={{ padding: '0.75rem' }}>{doc.sender}</td>
                            <td style={{ padding: '0.75rem' }}>
                                {new Date(doc.receivedAt).toLocaleString('ja-JP')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default DocumentList
