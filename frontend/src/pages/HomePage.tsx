

import React, { useState } from "react";
import { DashboardContent } from "../components/layout/DashboardContent";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";


const HomePage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState("dashboard");

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* ヘッダー */}
            <div className="fixed top-0 left-0 right-0 z-30">
                <Header 
                    onMenuClick={() => setSidebarOpen(true)}
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
            <main className="flex-1 pt-16">
                <DashboardContent currentView={currentView} />
            </main>
        </div>
    );
};

export default HomePage;
