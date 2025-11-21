import React from 'react'
import { Filter, Search } from 'lucide-react'

interface DocumentFilterProps {
    onFilterChange: (filter: string) => void
    onSearchChange: (search: string) => void
    searchQuery: string
}

const DocumentFilter: React.FC<DocumentFilterProps> = ({ 
    onFilterChange, 
    onSearchChange, 
    searchQuery 
}) => {
    return (
        <div className="bg-white rounded-lg p-4 mb-6 border">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* フィルター */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">
                        種別:
                    </label>
                    <select
                        onChange={e => onFilterChange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">すべて</option>
                        <option value="fax">FAX</option>
                        <option value="email">メール</option>
                        <option value="document">文書</option>
                    </select>
                </div>
                
                {/* 検索ボックス */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="件名・送信者で検索..."
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    )
}

export default DocumentFilter
