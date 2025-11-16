import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header.tsx'
import Sidebar from './components/layout/Sidebar.tsx'
import HomePage from './pages/HomePage.tsx'
import DocumentsPage from './pages/DocumentsPage.tsx'
import FaxUploadPage from './pages/FaxUploadPage.tsx'

function App() {
    return (
        <Router>
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
        </Router>
    )
}

export default App
