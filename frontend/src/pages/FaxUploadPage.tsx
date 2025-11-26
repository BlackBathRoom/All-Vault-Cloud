
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FaxUploadForm from '../components/fax/FaxUploadForm.tsx';
import { Magnifier } from '../components/ui/Magnifier';


const FaxUploadPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('fax-upload');
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
                <div className="max-w-2xl mx-auto">
                    <FaxUploadForm />
                </div>
            </main>
        </div>
    );
}

export default FaxUploadPage
