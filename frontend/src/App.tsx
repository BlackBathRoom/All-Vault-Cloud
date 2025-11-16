import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'


import Header from './components/layout/Header.tsx';
import Sidebar from './components/layout/Sidebar.tsx';
import HomePage from './pages/HomePage.tsx';
import DocumentsPage from './pages/DocumentsPage.tsx';
import FaxUploadPage from './pages/FaxUploadPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import NewaccountPage from './pages/NewaccountPage.tsx';
import { useLocation } from 'react-router-dom';

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

function AppContent() {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/newaccount';
    return isAuthPage ? (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/newaccount" element={<NewaccountPage />} />
        </Routes>
    ) : (
        <div className="app">
            <Header />
            <div className="app-container">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/documents" element={<DocumentsPage />} />
                        <Route path="/fax-upload" element={<FaxUploadPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default App
