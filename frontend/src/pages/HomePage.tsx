import React from 'react'

const HomePage: React.FC = () => {
    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>ダッシュボード</h1>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                }}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    <h3 style={{ marginBottom: '1rem', color: '#007bff' }}>📄 総文書数</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>-</p>
                </div>

                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    <h3 style={{ marginBottom: '1rem', color: '#28a745' }}>📠 FAX</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>-</p>
                </div>

                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    <h3 style={{ marginBottom: '1rem', color: '#dc3545' }}>📧 メール</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>-</p>
                </div>
            </div>

            <div
                style={{
                    marginTop: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1.5rem',
                }}
            >
                <h2 style={{ marginBottom: '1rem' }}>最近の文書</h2>
                <p>最近アップロードされた文書がここに表示されます。</p>
            </div>
        </div>
    )
}

export default HomePage
