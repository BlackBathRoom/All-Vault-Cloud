
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import DocumentList from '../components/documents/DocumentList.tsx';
import DocumentFilter from '../components/documents/DocumentFilter.tsx';


const DocumentsPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('documents');
    const [filter, setFilter] = useState('');

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* ヘッダー */}
            <div className="fixed top-0 left-0 right-0 z-30">
                <Header onMenuClick={() => setSidebarOpen(true)} />
            </div>
            {/* サイドバー */}
            <Sidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            {/* メイン */}
            <main className="flex-1 pt-16">
                <h1 style={{ marginBottom: '2rem' }}>文書一覧</h1>
                <DocumentFilter onFilterChange={setFilter} />
                <DocumentList filter={filter} />
            </main>
        </div>
    );
}

export default DocumentsPage
