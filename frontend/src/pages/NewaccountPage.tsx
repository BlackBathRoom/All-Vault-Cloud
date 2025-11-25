import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function NewaccountPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        
        if (password !== confirmPassword) {
            setError('パスワードが一致しません')
            return
        }
        
        setLoading(true)
        // TODO: アカウント作成API連携
        setTimeout(() => {
            setLoading(false)
            alert('アカウントが作成されました！')
        }, 1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#181f2a] to-[#232b38]">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                <div className="flex flex-col items-center">
                    <div className="bg-[#374151] rounded-full p-4 mb-2">
                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                            <path d="M6 10V8a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Z" 
                                fill="#ffffff"/>
                            <path d="M8 8v2h8V8a4 4 0 1 0-8 0Z" 
                                fill="#374151"/>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-center text-gray-900">新規登録</h2>
                    <p className="text-gray-500 text-sm text-center mb-2">新しいアカウントを作成してください</p>
                </div>
                <form className="w-full space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                    <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11Zm1.6.6 8.4 6.3 8.4-6.3M20 7.2l-7.6 5.7a1 1 0 0 1-1.2 0L4 7.2" 
                                        stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="example@email.com"
                                className="pl-10"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">パスワード</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                    <path d="M12 17a5 5 0 0 1-5-5V9a5 5 0 0 1 10 0v3a5 5 0 0 1-5 5Zm-7 0a7 7 0 0 1 14 0"
                                        stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                placeholder="********"
                                className="pl-10 pr-10 bg-gray-100 border-0 rounded-xl"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label="パスワード表示切替"
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                                            stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="12" r="3" stroke="#bdbdbd" strokeWidth="1.5"/>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                        <path d="M3 3l18 18M10.7 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-4.3m-3.6-3.6A7.97 7.97 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.1 2.88M6.18 6.18C4.13 7.94 2 12 2 12s3.5 7 10 7a9.77 9.77 0 0 0 4.9-1.36"
                                            stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">パスワード確認</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                    <path d="M12 17a5 5 0 0 1-5-5V9a5 5 0 0 1 10 0v3a5 5 0 0 1-5 5Zm-7 0a7 7 0 0 1 14 0"
                                        stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                placeholder="********"
                                className="pl-10 pr-10 bg-gray-100 border-0 rounded-xl"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                                onClick={() => setShowConfirmPassword(v => !v)}
                                aria-label="パスワード確認表示切替"
                            >
                                {showConfirmPassword ? (
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                                            stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="12" r="3" stroke="#bdbdbd" strokeWidth="1.5"/>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                        <path d="M3 3l18 18M10.7 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-4.3m-3.6-3.6A7.97 7.97 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.1 2.88M6.18 6.18C4.13 7.94 2 12 2 12s3.5 7 10 7a9.77 9.77 0 0 0 4.9-1.36"
                                            stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                    <Button type="submit" className="w-full mt-2 h-11 text-base font-semibold bg-black hover:bg-gray-800" disabled={loading}>
                        {loading ? 'アカウント作成中...' : 'アカウント作成'}
                    </Button>
                </form>
                <div className="text-center text-sm text-gray-500 mt-2">
                    既にアカウントをお持ちですか？{' '}
                    <a href="/login" className="font-bold text-black hover:underline">ログイン</a>
                </div>
            </div>
        </div>
    )
}