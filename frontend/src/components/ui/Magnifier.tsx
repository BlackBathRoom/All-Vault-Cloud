import { useEffect, useState, useRef } from 'react'
import html2canvas from 'html2canvas'

interface MagnifierProps {
    isActive: boolean
}

export function Magnifier({ isActive }: MagnifierProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isVisible, setIsVisible] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseMoveTimeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false)
            return
        }

        const handleMouseMove = (e: MouseEvent) => {
            // マウス移動をデバウンス（50ms）
            if (mouseMoveTimeoutRef.current) {
                clearTimeout(mouseMoveTimeoutRef.current)
            }
            
            mouseMoveTimeoutRef.current = setTimeout(() => {
                setPosition({ x: e.clientX, y: e.clientY })
                setIsVisible(true)
            }, 50)
        }

        const handleMouseLeave = () => {
            setIsVisible(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            if (mouseMoveTimeoutRef.current) {
                clearTimeout(mouseMoveTimeoutRef.current)
            }
        }
    }, [isActive])

    // 画面をキャプチャして拡大表示（軽量化版）
    useEffect(() => {
        if (!isActive || !isVisible || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const magnifierSize = 200
        const zoom = 2.5

        let isUpdating = false
        let updateTimeout: NodeJS.Timeout

        const updateMagnifier = async () => {
            if (isUpdating) return
            isUpdating = true

            try {
                // 画面全体をキャプチャ（低解像度）
                const bodyCanvas = await html2canvas(document.body, {
                    scale: 0.5, // 解像度を下げてパフォーマンス向上
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    windowWidth: window.innerWidth,
                    windowHeight: window.innerHeight,
                })

                const captureSize = magnifierSize / zoom
                
                // キャンバスをクリア
                ctx.clearRect(0, 0, magnifierSize, magnifierSize)
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, magnifierSize, magnifierSize)

                // マウス位置を中心に拡大して描画
                const sourceX = Math.max(0, (position.x * 0.5) - (captureSize * 0.5))
                const sourceY = Math.max(0, (position.y * 0.5) - (captureSize * 0.5))
                
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'
                
                ctx.drawImage(
                    bodyCanvas,
                    sourceX,
                    sourceY,
                    captureSize * 0.5,
                    captureSize * 0.5,
                    0,
                    0,
                    magnifierSize,
                    magnifierSize
                )
            } catch (error) {
                // エラーは無視
            } finally {
                isUpdating = false
            }
        }

        // 初回実行
        updateMagnifier()

        // 200ms間隔で更新（パフォーマンス考慮）
        updateTimeout = setInterval(updateMagnifier, 200)

        return () => {
            clearInterval(updateTimeout)
        }
    }, [isActive, isVisible, position.x, position.y])

    if (!isActive || !isVisible) return null

    // 拡大鏡の位置を画面内に収める
    const magnifierSize = 200
    const offset = 20
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
            {/* 拡大鏡の円形表示 */}
            <div
                style={{
                    position: 'fixed',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${magnifierSize}px`,
                    height: `${magnifierSize}px`,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    border: '4px solid #2563eb',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    backgroundColor: 'white',
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={magnifierSize}
                    height={magnifierSize}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
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
