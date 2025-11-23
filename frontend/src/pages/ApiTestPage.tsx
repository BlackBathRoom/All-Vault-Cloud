import { useState } from 'react'
import { getDocuments } from '../api/documentsApi'
import { Document } from '../types/document'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

/**
 * API接続テストページ
 * DynamoDBからドキュメントを取得できるか確認するための診断ページ
 */
export function ApiTestPage() {
    const [loading, setLoading] = useState(false)
    const [documents, setDocuments] = useState<Document[]>([])
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({ total: 0, fax: 0, email: 0 })

    const testGetDocuments = async () => {
        setLoading(true)
        setError(null)
        
        try {
            const data = await getDocuments()
            setDocuments(data)
            
            // 統計情報を計算
            const faxCount = data.filter(d => d.type === 'fax').length
            const emailCount = data.filter(d => d.type === 'email_body').length
            
            setStats({
                total: data.length,
                fax: faxCount,
                email: emailCount
            })
            
            console.log('✅ API Test Success:', data)
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラー')
            console.error('❌ API Test Failed:', err)
        } finally {
            setLoading(false)
        }
    }

    const testGetFaxOnly = async () => {
        setLoading(true)
        setError(null)
        
        try {
            const data = await getDocuments('fax')
            setDocuments(data)
            setStats({ ...stats, fax: data.length })
            console.log('✅ FAX Test Success:', data)
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラー')
            console.error('❌ FAX Test Failed:', err)
        } finally {
            setLoading(false)
        }
    }

    const testGetEmailOnly = async () => {
        setLoading(true)
        setError(null)
        
        try {
            const data = await getDocuments('email_body')
            setDocuments(data)
            setStats({ ...stats, email: data.length })
            console.log('✅ Email Test Success:', data)
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラー')
            console.error('❌ Email Test Failed:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">🔍 API 接続テスト</h1>
                <p className="text-muted-foreground">
                    DynamoDB から実際にデータを取得できるか確認します
                </p>
            </div>

            {/* 統計カード */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">全ドキュメント</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">📠 FAX</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.fax}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">📧 メール</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.email}</div>
                    </CardContent>
                </Card>
            </div>

            {/* テストボタン */}
            <Card>
                <CardHeader>
                    <CardTitle>テストを実行</CardTitle>
                    <CardDescription>
                        各ボタンをクリックしてAPIエンドポイントをテストします
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-3 flex-wrap">
                        <Button 
                            onClick={testGetDocuments}
                            disabled={loading}
                        >
                            {loading ? '読み込み中...' : '全ドキュメント取得'}
                        </Button>
                        
                        <Button 
                            onClick={testGetFaxOnly}
                            disabled={loading}
                            variant="outline"
                        >
                            FAXのみ取得
                        </Button>
                        
                        <Button 
                            onClick={testGetEmailOnly}
                            disabled={loading}
                            variant="outline"
                        >
                            メールのみ取得
                        </Button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 font-semibold">❌ エラーが発生しました</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 結果表示 */}
            {documents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>取得結果 ({documents.length}件)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div 
                                    key={doc.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-gray-500">
                                                    {doc.id}
                                                </span>
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                    {doc.type}
                                                </span>
                                            </div>
                                            
                                            {doc.subject && (
                                                <p className="font-medium">{doc.subject}</p>
                                            )}
                                            
                                            {doc.from && (
                                                <p className="text-sm text-gray-600">
                                                    From: {doc.from}
                                                </p>
                                            )}
                                            
                                            <p className="text-xs text-gray-500">
                                                {new Date(doc.createdAt).toLocaleString('ja-JP')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* デバッグ情報 */}
            <Card>
                <CardHeader>
                    <CardTitle>🔧 デバッグ情報</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
{`API Base URL: ${import.meta.env.VITE_API_URL || 'https://24bdzijg8k.execute-api.ap-northeast-1.amazonaws.com'}
Status: ${loading ? 'Loading...' : error ? 'Error' : documents.length > 0 ? 'Success' : 'Ready'}
Documents Count: ${documents.length}
Error: ${error || 'None'}`}
                    </pre>
                </CardContent>
            </Card>
        </div>
    )
}
