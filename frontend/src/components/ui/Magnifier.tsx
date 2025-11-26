import { useEffect, useState } from 'react'

interface MagnifierProps {
    isActive: boolean
}

export function Magnifier({ isActive }: MagnifierProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false)
            // 拡大鏡を無効化したらページ全体の拡大もリセット
            document.body.style.transform = ''
            document.body.style.transformOrigin = ''
            return
        }

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY })
            setIsVisible(true)
        }

        const handleMouseLeave = () => {
            setIsVisible(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.body.style.transform = ''
            document.body.style.transformOrigin = ''
        }
    }, [isActive])

    if (!isActive || !isVisible) return null

    // 拡大鏡の設定
    const magnifierSize = 250
    const offset = 30
    const zoom = 2.5
    
    let left = position.x + offset
    let top = position.y + offset

    if (left + magnifierSize > window.innerWidth) {
        left = position.x - magnifierSize - offset
    }
    if (top + magnifierSize > window.innerHeight) {
        top = position.y - magnifierSize - offset
    }

    return (
        <>
            {/* シンプルな拡大鏡表示 - 軽量版 */}
            <div
                style={{
                    position: 'fixed',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${magnifierSize}px`,
                    height: `${magnifierSize}px`,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    border: '5px solid #2563eb',
                    borderRadius: '50%',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    backdropFilter: `brightness(1.2) contrast(1.1)`,
                    WebkitBackdropFilter: `brightness(1.2) contrast(1.1)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                }}
            >
                {/* 拡大表示アイコン */}
                <div
                    style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#2563eb',
                        textShadow: '0 0 8px white, 0 0 12px white, 0 0 16px white',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: '2px solid #2563eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                >
                    🔍 {zoom}x 拡大
                </div>
            </div>
            
            {/* カーソル位置の十字マーク */}
            <div
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: '30px',
                    height: '30px',
                    pointerEvents: 'none',
                    zIndex: 10000,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '0',
                        width: '2px',
                        height: '100%',
                        backgroundColor: '#ef4444',
                        transform: 'translateX(-50%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: '0',
                        top: '50%',
                        width: '100%',
                        height: '2px',
                        backgroundColor: '#ef4444',
                        transform: 'translateY(-50%)',
                    }}
                />
                {/* 中心の円 */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </div>
        </>
    )
}
