
import { useState, useEffect, useRef } from 'react'
import { Search, Filter, FileText, Mail, Printer, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table'
import { Badge } from '../ui/badge'
import { getDocuments, getDocumentMemos, createDocumentMemo, deleteDocumentMemo, } from '../../api/documentsApi'
import type { DocumentMemo } from '../../api/documentsApi'
import { Document } from '../../types/document'

export function DocumentList() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(false)

    const [filterType, setFilterType] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    const [memos, setMemos] = useState<DocumentMemo[]>([])
    const [memoInput, setMemoInput] = useState('')
    const longPressTimer = useRef<number | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                console.log('📡 Documents API 呼び出し開始...')
                setLoading(true)
                const data = await getDocuments()
                console.log('📥 取得したデータ:', data)
                console.log('📊 データ件数:', data.length)
                setDocuments(data)
                console.log('✅ データセット完了. documents.length:', data.length)
                setLoading(false)
            } catch (error) {
                console.error('❌ Documents API エラー:', error)
                setLoading(false)
            }
        }
        load()
    }, [])

    const getTypeIcon = (type: Document['type']) => {
        switch (type) {
        case 'fax':
            return <Printer className="size-4" />
        case 'email':
            return <Mail className="size-4" />
        case 'document':
            return <FileText className="size-4" />
        }
    }

    const getTypeBadge = (type: Document['type']) => {
        const config = {
            fax: {
                label: 'FAX',
                className:
          'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
            },
            email: {
                label: 'メール',
                className:
          'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
            },
            document: {
                label: '文書',
                className:
          'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
            },
        }

        const { label, className } = config[type as keyof typeof config]
        return (
            <Badge variant="outline" className={`gap-1 ${className}`}>
                {getTypeIcon(type)}
                {label}
            </Badge>
        )
    }

    // フィルタ＆検索
    const filteredDocuments = documents.filter((doc) => {
        const matchesType = filterType === 'all' || doc.type === filterType
        const matchesSearch =
      searchQuery === '' ||
      doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesType && matchesSearch
    })

    console.log('📊 フィルタ状況:', { 
        documents: documents.length, 
        filterType, 
        searchQuery, 
        filteredDocuments: filteredDocuments.length,
    })

    const handleDownload = (document: Document) => {
        if (document.fileUrl) {
            console.log('📅 ファイルダウンロード:', document.subject)
            window.open(document.fileUrl, '_blank')
        } else {
            console.warn('⚠️ ダウンロードURLが見つかりません:', document)
            alert('ファイルのダウンロードURLが利用できません。')
        }
    }

    const formatFileSize = (bytes: number | null | undefined): string => {
        if (!bytes || bytes === 0) return '-'
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
    }

    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

    useEffect(() => {
        setCurrentPage(1)
    }, [filterType, searchQuery])

    const openMemoModal = async (doc: Document) => {
        setSelectedDoc(doc)
        setIsMemoModalOpen(true)
        try {
            const list = await getDocumentMemos(doc.id)
            setMemos(list)
        } catch (e) {
            console.error('メモ取得エラー', e)
            setMemos([])
        }
    }

    const closeMemoModal = () => {
        setIsMemoModalOpen(false)
        setSelectedDoc(null)
        setMemos([])
        setMemoInput('')
    }

    const handleSaveMemo = async () => {
        if (!selectedDoc || !memoInput.trim()) return
        try {
            const saved = await createDocumentMemo(selectedDoc.id, {
                text: memoInput.trim(),
            })
            setMemos((prev) => [...prev, saved])
            setMemoInput('')

            // 一覧側の latestMemo も更新しておく（フロント側で即反映）
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === selectedDoc.id
                        ? {
                            ...d,
                            latestMemo: {
                                text: saved.text,
                                updatedAt: saved.updatedAt,
                            },
                        }
                        : d
                )
            )
        } catch (e) {
            console.error('メモ保存エラー', e)
            alert('メモの保存に失敗しました')
        }
    }

    const handleDeleteMemo = async (memoId: string) => {
        if (!selectedDoc) return
        const ok = window.confirm('このメモを削除しますか？')
        if (!ok) return
      
        try {
            await deleteDocumentMemo(selectedDoc.id, memoId)
        
            // モーダル内の一覧を更新
            setMemos((prev) => {
                const next = prev.filter((m) => m.memoId !== memoId)
        
                // 一覧側の latestMemo も更新
                const last = next.length > 0 ? next[next.length - 1] : null
                setDocuments((docs) =>
                    docs.map((d) =>
                        d.id === selectedDoc.id
                            ? {
                                ...d,
                                latestMemo: last
                                    ? { text: last.text, updatedAt: last.updatedAt }
                                    : null,
                            }
                            : d
                    )
                )
        
                return next
            })
        } catch (e) {
            console.error('メモ削除エラー', e)
            alert('メモの削除に失敗しました')
        }
    }
      

    const startLongPress = (doc: Document) => {
        if (longPressTimer.current) return
        longPressTimer.current = window.setTimeout(() => {
            openMemoModal(doc)
        }, 600)
    }

    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    if (loading) {
        return (
            <div className="py-10 text-center text-slate-600">
                📡 API からデータを読み込み中です…
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Page Title */}
            <div>
                <h2 className="text-xl md:text-2xl text-slate-900">文書一覧</h2>
                <p className="text-sm md:text-base text-slate-600 mt-1">
                    受信した文書を管理・閲覧できます
                </p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 md:p-6">
                <div className="flex flex-col gap-4">
                    {/* Type Filter */}
                    <div className="flex items-center gap-3">
                        <Filter className="size-5 text-slate-600 flex-shrink-0" />
                        <label className="text-slate-700 min-w-fit text-sm md:text-base">
                            種別:
                        </label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="すべて" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">すべて</SelectItem>
                                <SelectItem value="fax">FAX</SelectItem>
                                <SelectItem value="email">メール</SelectItem>
                                <SelectItem value="document">文書</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2">
                        <Search className="size-5 text-slate-600 flex-shrink-0" />
                        <Input
                            type="text"
                            placeholder="件名・送信者で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-sm md:text-base text-slate-600 px-1">
                {filteredDocuments.length}件の文書が見つかりました
                {totalPages > 1 && (
                    <span className="ml-2">
                        (ページ {currentPage} / {totalPages})
                    </span>
                )}
            </div>

            {/* Document Table - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[140px]">種別</TableHead>
                            <TableHead>件名</TableHead>
                            <TableHead className="w-[120px]">メモ</TableHead>
                            <TableHead className="w-[200px]">送信者</TableHead>
                            <TableHead className="w-[180px]">受信日時</TableHead>
                            <TableHead className="w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentDocuments.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-12 text-slate-500"
                                >
                                    <FileText className="size-12 mx-auto mb-3 text-slate-300" />
                                    <p>該当する文書が見つかりませんでした</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentDocuments.map((doc) => {
                                // 🔍 latestMemo の中身を確認するログ
                                console.log('🔍 latestMemo for:', doc.id, doc.latestMemo)

                                return (
                                    <TableRow
                                        key={doc.id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <TableCell>{getTypeBadge(doc.type)}</TableCell>
                                        <TableCell className="text-slate-900">
                                            {doc.subject}
                                        </TableCell>
                                        {/* メモボタン列（ホバープレビュー付き） */}
                                        <TableCell>
                                            <div className="relative inline-block group">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                    onClick={() => openMemoModal(doc)}
                                                    onMouseDown={() => startLongPress(doc)}
                                                    onMouseUp={cancelLongPress}
                                                    onMouseLeave={cancelLongPress}
                                                    onTouchStart={() => startLongPress(doc)}
                                                    onTouchEnd={cancelLongPress}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>

                                                {/* ホバー時の最新メモプレビュー */}
                                                <div
                                                    className="
                                                        pointer-events-none
                                                        absolute top-1/2 left-full ml-2 -translate-y-1/2
                                                        w-48 max-w-xs p-2
                                                        rounded border border-slate-200 bg-white text-xs text-slate-700 shadow-md
                                                        opacity-0 transition-opacity duration-150
                                                        group-hover:opacity-100
                                                    "
                                                >
                                                    {doc.latestMemo ? (
                                                        <div className="max-h-12 overflow-hidden break-words">
                                                            {doc.latestMemo.text}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            メモなし
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-700">
                                            {doc.sender}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {doc.receivedAt}
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDownload(doc)}
                                                disabled={!doc.fileUrl}
                                            >
                                                開く
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Document Cards - Mobile */}
            <div className="md:hidden space-y-3">
                {currentDocuments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                        <FileText className="size-12 mx-auto mb-3 text-slate-300" />
                        <p>該当する文書が見つかりませんでした</p>
                    </div>
                ) : (
                    currentDocuments.map((doc) => (
                        <div
                            key={doc.id}
                            className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 active:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                {getTypeBadge(doc.type)}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                        onClick={() => openMemoModal(doc)}
                                        onMouseDown={() => startLongPress(doc)}
                                        onMouseUp={cancelLongPress}
                                        onMouseLeave={cancelLongPress}
                                        onTouchStart={() => startLongPress(doc)}
                                        onTouchEnd={cancelLongPress}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDownload(doc)}
                                        disabled={!doc.fileUrl}
                                    >
                                        開く
                                    </Button>
                                </div>
                            </div>
                            <h3 className="text-slate-900 mb-2">{doc.subject}</h3>
                            <div className="space-y-1 text-sm">
                                <p className="text-slate-700">
                                    <span className="text-slate-500">送信者:</span> {doc.sender}
                                </p>
                                <p className="text-slate-600">
                                    <span className="text-slate-500">受信日時:</span>{' '}
                                    {doc.receivedAt}
                                </p>
                                {doc.fileSize && (
                                    <p className="text-slate-600">
                                        <span className="text-slate-500">ファイルサイズ:</span>{' '}
                                        {formatFileSize(doc.fileSize)}
                                    </p>
                                )}
                                {doc.latestMemo && (
                                    <p className="text-xs text-slate-500 pt-1">
                                        <span className="font-medium">最新メモ:</span>{' '}
                                        {doc.latestMemo.text}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        ← 前へ
                    </Button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                                (page) =>
                                    page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                            )
                            .map((page, index, array) => (
                                <div key={page} className="flex items-center gap-2">
                                    {index > 0 && array[index - 1] !== page - 1 && (
                                        <span className="text-slate-400">...</span>
                                    )}
                                    <Button
                                        variant={currentPage === page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[2.5rem] ${
                                            currentPage === page
                                                ? 'bg-slate-700 hover:bg-slate-800 text-white border-slate-700'
                                                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                                        }`}
                                    >
                                        {page}
                                    </Button>
                                </div>
                            ))}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() =>
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        次へ →
                    </Button>
                </div>
            )}

            {/* メモモーダル */}
            {isMemoModalOpen && selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
                        <h2 className="mb-2 text-lg font-semibold">
                            メモ - {selectedDoc.subject}
                        </h2>

                        {/* 既存メモ一覧 */}
                        <div className="mb-4 max-h-40 space-y-2 overflow-y-auto border rounded p-2 text-sm">
                            {memos.length === 0 && (
                                <p className="text-gray-400">まだメモはありません。</p>
                            )}
                            {memos.map((m) => (
                                <div
                                    key={m.memoId}
                                    className="flex items-start gap-2 rounded border px-2 py-1"
                                >
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500">
                                            {new Date(m.updatedAt).toLocaleString()}
                                        </div>
                                        <div>{m.text}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMemo(m.memoId)}
                                        className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                                        aria-label="メモを削除"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}

                        </div>

                        {/* 入力欄 */}
                        <textarea
                            className="mb-3 h-24 w-full rounded border px-2 py-1 text-sm"
                            placeholder="メモを入力..."
                            value={memoInput}
                            onChange={(e) => setMemoInput(e.target.value)}
                        />

                        <div className="mt-4 flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={closeMemoModal}
                                className="px-5 py-2 text-white bg-slate-600 hover:bg-slate-700"
                            >
                                閉じる
                            </Button>

                            <Button
                                onClick={handleSaveMemo}
                                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
                            >
                                保存
                            </Button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}
