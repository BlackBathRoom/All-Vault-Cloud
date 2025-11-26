import { useEffect, useState, useRef } from 'react'
import html2canvas from 'html2canvas'

interface MagnifierProps {
    isActive: boolean
}

export function Magnifier({ isActive }: MagnifierProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isVisible, setIsVisible] = useState(false)
    const [screenshot, setScreenshot] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const captureTimeout = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false)
            setScreenshot(null)
            return
        }

        // 初回のスクリーンショット取得
        const captureScreen = async () => {
            try {
                const canvas = await html2canvas(document.body, {
                    scale: 1,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                })
                setScreenshot(canvas.toDataURL())
            } catch (error) {
                console.error('スクリーンショット取得エラー:', error)
            }
        }

        captureScreen()

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY })
            setIsVisible(true)

            // スクリーンショットを定期的に更新（パフォーマンスのため500ms間隔）
            if (captureTimeout.current) {
                clearTimeout(captureTimeout.current)
            }
            captureTimeout.current = setTimeout(() => {
                captureScreen()
            }, 500)
        }

        const handleMouseLeave = () => {
            setIsVisible(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            if (captureTimeout.current) {
                clearTimeout(captureTimeout.current)
            }
        }
    }, [isActive])

    // スクリーンショットから拡大部分を描画
    useEffect(() => {
        if (!screenshot || !canvasRef.current || !isVisible) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.onload = () => {
            const sourceSize = 60
            const destSize = 200

            // 取得元の座標（画面座標をスクリーンショット座標に変換）
            const sourceX = Math.max(0, position.x - sourceSize / 2)
            const sourceY = Math.max(0, position.y - sourceSize / 2)

            // キャンバスをクリア
            ctx.clearRect(0, 0, destSize, destSize)

            // 拡大して描画
            ctx.drawImage(
                img,
                sourceX,
                sourceY,
                sourceSize,
                sourceSize,
                0,
                0,
                destSize,
                destSize
            )
        }
        img.src = screenshot
    }, [screenshot, position, isVisible])

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
                    width: '20px',
                    height: '20px',
                    pointerEvents: 'none',
                    zIndex: 9998,
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
                        backgroundColor: '#2563eb',
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
                        backgroundColor: '#2563eb',
                        transform: 'translateY(-50%)',
                    }}
                />
            </div>
        </>
    )
}
