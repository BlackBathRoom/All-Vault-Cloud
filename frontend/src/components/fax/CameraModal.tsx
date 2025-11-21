import React, { useRef, useEffect, useState } from 'react'
import { Camera, X, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'

interface CameraModalProps {
    isOpen: boolean
    onClose: () => void
    onCapture: (file: File) => void
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>('')
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

    useEffect(() => {
        if (isOpen) {
            startCamera()
        } else {
            stopCamera()
        }

        return () => {
            stopCamera()
        }
    }, [isOpen, facingMode])

    const startCamera = async () => {
        try {
            setIsLoading(true)
            setError('')

            // 既存のストリームを停止
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }
        } catch (err) {
            console.error('Camera access error:', err)
            setError('カメラにアクセスできませんでした。カメラの使用を許可してください。')
        } finally {
            setIsLoading(false)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
    }

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context) return

        // キャンバスのサイズをビデオに合わせる
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // ビデオフレームをキャンバスに描画
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // キャンバスからBlob（ファイル）を生成
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                })
                onCapture(file)
                onClose()
            }
        }, 'image/jpeg', 0.9)
    }

    const switchCamera = () => {
        setFacingMode(current => current === 'user' ? 'environment' : 'user')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 md:p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden">
                {/* ヘッダー */}
                <div className="flex items-center justify-between p-3 md:p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center">
                        <Camera className="size-5 mr-2" />
                        カメラで撮影
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        <X className="size-5" />
                    </Button>
                </div>

                {/* カメラビュー */}
                <div className="p-3 md:p-4">
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                    <p>カメラを起動中...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center text-white p-4">
                                <div className="text-center">
                                    <Camera className="size-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                            style={{ display: isLoading || error ? 'none' : 'block' }}
                        />

                        {/* カメラ切り替えボタン（スマートフォンのみ） */}
                        {!isLoading && !error && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={switchCamera}
                                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 sm:hidden"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                    </div>

                    {/* コントロールボタン */}
                    <div className="flex justify-center space-x-3 md:space-x-4 mt-3 md:mt-4 ">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="px-4 md:px-6 text-sm md:text-base bg-slate-500/80 hover:bg-slate-600/80 text-white border-slate-500"
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={capturePhoto}
                            disabled={isLoading || !!error}
                            className="px-4 md:px-6 text-sm md:text-base bg-pink-500 hover:bg-pink-600 text-white disabled:bg-pink-300"
                        >
                            <Camera className="size-4 mr-2" />
                            撮影
                        </Button>
                    </div>
                </div>

                {/* 隠しキャンバス（撮影用） */}
                <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    )
}

export default CameraModal