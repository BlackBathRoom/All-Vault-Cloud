
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { DocumentList } from '../components/documents/DocumentList.tsx';
import { Magnifier } from '../components/ui/Magnifier';


const DocumentsPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('documents');
    const [magnifierActive, setMagnifierActive] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* 拡大鏡 */}
            <Magnifier isActive={magnifierActive} />
            
            {/* ヘッダー */}
            <div className="fixed top-0 left-0 right-0 z-30">
                <Header 
                    onMenuClick={() => setSidebarOpen(true)}
                    onMagnifierToggle={() => setMagnifierActive(!magnifierActive)}
                    isMagnifierActive={magnifierActive}
                />
            </div>
            {/* サイドバー */}
            <Sidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            {/* メイン */}
            <main className="flex-1 pt-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <DocumentList />
                </div>
            </main>
        </div>
    );
}

export default DocumentsPage
