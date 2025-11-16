import React from 'react'

interface DocumentFilterProps {
    onFilterChange: (filter: string) => void
}

const DocumentFilter: React.FC<DocumentFilterProps> = ({ onFilterChange }) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem' }}>
                種別:
                <select
                    onChange={e => onFilterChange(e.target.value)}
                    style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
                >
                    <option value="">すべて</option>
                    <option value="fax">FAX</option>
                    <option value="email">メール</option>
                </select>
            </label>
        </div>
    )
}

export default DocumentFilter
