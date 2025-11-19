
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FaxUploadForm from '../components/fax/FaxUploadForm.tsx';


const FaxUploadPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('fax-upload');

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
            </main>
        </div>
    );
}

export default FaxUploadPage
