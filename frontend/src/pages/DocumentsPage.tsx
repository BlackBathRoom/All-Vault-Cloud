import React, { useState } from 'react'
import DocumentList from '../components/documents/DocumentList.tsx'
import DocumentFilter from '../components/documents/DocumentFilter.tsx'

const DocumentsPage: React.FC = () => {
    const [filter, setFilter] = useState('')

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>文書一覧</h1>

            <DocumentFilter onFilterChange={setFilter} />

            <DocumentList filter={filter} />
        </div>
    )
}

export default DocumentsPage
