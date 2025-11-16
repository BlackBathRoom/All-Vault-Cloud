import React from 'react'
import { Link } from 'react-router-dom'

const Header: React.FC = () => {
    return (
        <header
            style={{
                backgroundColor: '#333',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <h1 style={{ fontSize: '1.5rem' }}>All Vault Cloud</h1>
            <nav>
                <Link
                    to="/"
                    style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}
                >
                    ホーム
                </Link>
                <Link
                    to="/documents"
                    style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}
                >
                    文書一覧
                </Link>
                <Link to="/fax-upload" style={{ color: 'white', textDecoration: 'none' }}>
                    FAXアップロード
                </Link>
            </nav>
        </header>
    )
}

export default Header
