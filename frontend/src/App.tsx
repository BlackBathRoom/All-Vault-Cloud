import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'


import Header from './components/layout/Header.tsx';
import Sidebar from './components/layout/Sidebar.tsx';
import HomePage from './pages/HomePage.tsx';
import DocumentsPage from './pages/DocumentsPage.tsx';
import FaxUploadPage from './pages/FaxUploadPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import NewaccountPage from './pages/NewaccountPage.tsx';
import { useLocation } from 'react-router-dom';
import { Footer } from './components/layout/Footer';

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
        <div className="app min-h-screen flex flex-col">
            <div className="flex-1 app-container flex flex-col">
                <main className="main-content flex-1">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/documents" element={<DocumentsPage />} />
                        <Route path="/fax-upload" element={<FaxUploadPage />} />
                    </Routes>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default App
