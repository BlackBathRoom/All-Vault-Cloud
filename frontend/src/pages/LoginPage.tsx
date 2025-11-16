

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: 認証API連携
    setTimeout(() => {
      setLoading(false);
      if (email === 'demo@example.com' && password === 'password') {
        alert('ログイン成功!');
      } else {
        alert('メールアドレスまたはパスワードが正しくありません');
      }
    }, 1000);
  };

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
          <h2 className="text-xl font-bold text-center text-gray-900">ようこそ</h2>
          <p className="text-gray-500 text-sm text-center mb-2">アカウントにログインしてください</p>
        </div>
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11Zm1.6.6 8.4 6.3 8.4-6.3M20 7.2l-7.6 5.7a1 1 0 0 1-1.2 0L4 7.2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                        <path d="M6 10V8a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Z" 
                              fill="#bdbdbd"/>
                        <path d="M8 8v2h8V8a4 4 0 1 0-8 0Z" 
                              fill="white"/>
                    </svg>
                </span>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="********"
                    className="pl-10 bg-gray-100 border-0 rounded-xl"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <label className="flex items-center gap-2 select-none cursor-pointer">
                <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={v => setRemember(!!v)}
                    className="bg-gray-300 border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white w-4 h-4 min-w-4 min-h-4 rounded-none"
                />
                <span className="text-gray-700">ログイン状態を保持</span>
            </label>
            <a href="#" className="text-gray-500 hover:underline">パスワードを忘れた場合</a>
          </div>
          {/* エラー表示はAlert UIを使いたい場合はここに追加 */}
          <Button type="submit" className="w-full mt-2 h-11 text-base font-semibold bg-black hover:bg-gray-800" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
        <div className="text-center text-sm text-gray-500 mt-2">
          アカウントをお持ちでない場合は{' '}
          <a href="/newaccount" className="font-bold text-black hover:underline">新規登録</a>
        </div>
      </div>
    </div>
  );
}
