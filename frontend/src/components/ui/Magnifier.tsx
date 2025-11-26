import { useEffect } from 'react'

interface MagnifierProps {
    isActive: boolean
}

export function Magnifier({ isActive }: MagnifierProps) {
    useEffect(() => {
        if (!isActive) {
            // 拡大モードを無効化
            document.body.style.fontSize = ''
            return
        }

        // フォントサイズを150%に拡大（読みやすさ向上）
        document.body.style.fontSize = '150%'

        return () => {
            document.body.style.fontSize = ''
        }
    }, [isActive])

    if (!isActive) return null

    return (
        <>
            {/* 拡大モード有効時の通知 */}
            <div
                style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    padding: '16px 24px',
                    backgroundColor: 'rgba(37, 99, 235, 0.95)',
                    color: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    pointerEvents: 'none',
                    animation: 'slideIn 0.3s ease-out',
                }}
            >
                <span style={{ fontSize: '24px' }}>🔍</span>
                <div>
                    <div>拡大表示モード</div>
                    <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '4px', opacity: 0.9 }}>
                        文字サイズ: 150%
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    )
}
