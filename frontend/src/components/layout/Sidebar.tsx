import React from 'react'
import { Link } from 'react-router-dom'

const Sidebar: React.FC = () => {
    return (
        <aside
            style={{
                width: '250px',
                backgroundColor: '#f0f0f0',
                padding: '2rem 1rem',
                borderRight: '1px solid #ddd',
            }}
        >
            <nav>
                <ul style={{ listStyle: 'none' }}>
                    <li style={{ marginBottom: '1rem' }}>
                        <Link
                            to="/"
                            style={{ textDecoration: 'none', color: '#333', fontSize: '1rem' }}
                        >
                            📊 ダッシュボード
                        </Link>
                    </li>
                    <li style={{ marginBottom: '1rem' }}>
                        <Link
                            to="/documents"
                            style={{ textDecoration: 'none', color: '#333', fontSize: '1rem' }}
                        >
                            📄 文書管理
                        </Link>
                    </li>
                    <li style={{ marginBottom: '1rem' }}>
                        <Link
                            to="/fax-upload"
                            style={{ textDecoration: 'none', color: '#333', fontSize: '1rem' }}
                        >
                            📠 FAXアップロード
                        </Link>
                    </li>
                </ul>
            </nav>
        </aside>
    )
}

export default Sidebar
