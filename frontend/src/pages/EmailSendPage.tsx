import React, { useState } from 'react'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import { sendEmail } from '../api/emailsApi'

const EmailSendPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [currentView, setCurrentView] = useState('email-send')
    
    const [to, setTo] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!to || !subject || !body) {
            setMessage({ type: 'error', text: 'すべてのフィールドを入力してください' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            await sendEmail({ to, subject, body })
            setMessage({ type: 'success', text: 'メールが正常に送信されました' })
            
            // フォームをリセット
            setTo('')
            setSubject('')
            setBody('')
        } catch (error) {
            console.error('メール送信エラー:', error)
            setMessage({ 
                type: 'error', 
                text: 'メールの送信に失敗しました。もう一度お試しください。' 
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* ヘッダー */}
            <div className="fixed top-0 left-0 right-0 z-30">
                <Header 
                    onMenuClick={() => setSidebarOpen(true)}
                />
            </div>
            
            {/* サイドバー */}
            <Sidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            
            {/* メイン */}
            <main className="flex-1 pt-16 px-6">
                <div className="max-w-2xl mx-auto py-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">
                            メール送信
                        </h1>

                        {/* メッセージ表示 */}
                        {message && (
                            <div className={`mb-4 p-4 rounded ${
                                message.type === 'success' 
                                    ? 'bg-green-100 text-green-700 border border-green-300' 
                                    : 'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* 宛先 */}
                            <div>
                                <label 
                                    htmlFor="to" 
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    宛先
                                </label>
                                <input
                                    id="to"
                                    type="email"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="example@example.com"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            {/* 件名 */}
                            <div>
                                <label 
                                    htmlFor="subject" 
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    件名
                                </label>
                                <input
                                    id="subject"
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="件名を入力"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            {/* 本文 */}
                            <div>
                                <label 
                                    htmlFor="body" 
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    本文
                                </label>
                                <textarea
                                    id="body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={10}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                    placeholder="メール本文を入力"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            {/* 送信ボタン */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-6 py-2 rounded-md font-medium transition-colors ${
                                        loading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    {loading ? '送信中...' : 'メールを送信'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default EmailSendPage
