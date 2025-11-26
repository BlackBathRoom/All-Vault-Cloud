import { useEffect, useState, useRef } from 'react'
import html2canvas from 'html2canvas'

interface MagnifierProps {
    isActive: boolean
}

export function Magnifier({ isActive }: MagnifierProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isVisible, setIsVisible] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number>()

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
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
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isActive])

    // リアルタイムで画面をキャプチャして拡大表示
    useEffect(() => {
        if (!isActive || !isVisible || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const magnifierSize = 200
        const zoom = 2.5
        const captureSize = magnifierSize / zoom

        const updateMagnifier = async () => {
            try {
                // マウス位置周辺の要素を取得
                const element = document.elementFromPoint(position.x, position.y)
                if (!element) return

                // その要素を含む最も近い親要素をキャプチャ
                const targetElement = element.closest('div, td, th, p, span, button, a') || document.body

                const rect = targetElement.getBoundingClientRect()
                const elementCanvas = await html2canvas(targetElement as HTMLElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    backgroundColor: null,
                    width: rect.width,
                    height: rect.height,
                    windowWidth: rect.width,
                    windowHeight: rect.height,
                })

                // マウス位置がその要素内のどこにあるかを計算
                const relativeX = position.x - rect.left
                const relativeY = position.y - rect.top
                
                // キャンバスをクリア
                ctx.clearRect(0, 0, magnifierSize, magnifierSize)
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, magnifierSize, magnifierSize)

                // 拡大して描画
                const sourceX = Math.max(0, (relativeX * 2) - captureSize)
                const sourceY = Math.max(0, (relativeY * 2) - captureSize)
                
                ctx.drawImage(
                    elementCanvas,
                    sourceX,
                    sourceY,
                    captureSize * 2,
                    captureSize * 2,
                    0,
                    0,
                    magnifierSize,
                    magnifierSize
                )
            } catch (error) {
                // エラーは無視（パフォーマンスのため）
            }

            if (isActive && isVisible) {
                animationFrameRef.current = requestAnimationFrame(updateMagnifier)
            }
        }

        // 初回実行
        updateMagnifier()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
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
