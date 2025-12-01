import { useState, useEffect } from 'react'
import {
    Search,
    Filter,
    FileText,
    Mail,
    Printer,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MessageSquare,
    Edit3,
    Trash2,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
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
import {
    getDocuments,
    createDocumentMemo,
    getDocumentMemos,
    deleteDocumentMemo,
    updateDocumentMemo,
} from '../../api/documentsApi'
import {
    Document,
    TAG_LABELS,
    PREDEFINED_TAGS,
    type PredefinedTag,
} from '../../types/document'

// DynamoDB の memos に合わせた型
type DocumentMemo = {
    memoId: string
    text: string
    page?: number | null
    createdAt: string
    updatedAt: string
}

// ✅ UUID_ファイル名（やパス付き）から表示用のファイル名だけを取り出す関数
const getDisplaySubject = (subject?: string): string => {
    if (!subject) return ''

    const lastSlashIndex = subject.lastIndexOf('/')
    const filenamePart =
        lastSlashIndex >= 0 ? subject.slice(lastSlashIndex + 1) : subject

    const underscoreIndex = filenamePart.indexOf('_')
    if (underscoreIndex === -1) {
        return filenamePart
    }

    const prefix = filenamePart.slice(0, underscoreIndex)
    const rest = filenamePart.slice(underscoreIndex + 1)

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (uuidRegex.test(prefix)) {
        return rest
    }

    return filenamePart
}

// 日時フォーマット関数（YYYY/MM/DD HH:mm形式）
const formatDateTime = (dateString: string): string => {
    if (!dateString) return ''

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}/${month}/${day} ${hours}:${minutes}`
}

// メモ更新日時表示用（末尾に「 更新」をつける）
const formatMemoUpdatedAt = (isoString: string): string => {
    if (!isoString) return ''

    // 基本のフォーマットは共通関数を利用
    const base = formatDateTime(isoString)
    if (!base) return ''

    return `${base} 更新`
}

export function DocumentList() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(false)

    const [filterType, setFilterType] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none')
    const itemsPerPage = 20

    // メモダイアログ用
    const [memoDialogOpen, setMemoDialogOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    const [memoText, setMemoText] = useState<string>('')
    const [savingMemo, setSavingMemo] = useState(false)
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null)

    // テーブルビュー用：メモ一覧ホバー表示
    const [hoveredDocId, setHoveredDocId] = useState<string | null>(null)
    const [hoverMemos, setHoverMemos] = useState<Record<string, DocumentMemo[]>>(
        {},
    )
    const [hoverLoadingId, setHoverLoadingId] = useState<string | null>(null)
    const [hoverErrorId, setHoverErrorId] = useState<string | null>(null)

    // ダイアログ内で使う読み込み状態（共通で使い回し）
    const [dialogLoading, setDialogLoading] = useState(false)
    const [dialogError, setDialogError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                console.log('📡 API読み込み開始...')
                setLoading(true)
                const data = await getDocuments()
                console.log('📥 取得したデータ:', data)
                console.log('📊 データ件数:', data.length)
                data.forEach((doc, idx) => {
                    if (doc.tags) {
                        console.log(
                            `📌 Doc ${idx}: ${doc.subject} has tags:`,
                            doc.tags,
                        )
                    }
                })
                setDocuments(data)
                console.log('✅ データセット完了. documents.length:', data.length)
                setLoading(false)
            } catch (error) {
                console.error('❌ API読み込みエラー:', error)
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
        } as const

        const { label, className } = config[type]
        return (
            <Badge variant="outline" className={`gap-1 ${className}`}>
                {getTypeIcon(type)}
                {label}
            </Badge>
        )
    }

    // タグフィルターのトグル
    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
        )
        setCurrentPage(1)
    }

    // 受信日時のソート切り替え
    const toggleSortOrder = () => {
        setSortOrder(prev => {
            if (prev === 'none') return 'desc'
            if (prev === 'desc') return 'asc'
            return 'none'
        })
        setCurrentPage(1)
    }

    // フィルタ＆検索
    let filteredDocuments = documents.filter(doc => {
        const matchesType = filterType === 'all' || doc.type === filterType
        const displaySubject = getDisplaySubject(doc.subject)
        const matchesSearch =
            searchQuery === '' ||
            displaySubject.toLowerCase().includes(searchQuery.toLowerCase())

        let matchesTags = true
        if (selectedTags.length > 0) {
            if (!doc.tags || !Array.isArray(doc.tags) || doc.tags.length === 0) {
                matchesTags = false
            } else {
                matchesTags = selectedTags.some(selectedTag =>
                    (doc.tags?.some(docTag => docTag === selectedTag)) ?? false,
                )
            }
        }

        return matchesType && matchesSearch && matchesTags
    })

    // 受信日時でソート
    if (sortOrder !== 'none') {
        filteredDocuments = [...filteredDocuments].sort((a, b) => {
            const dateA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0
            const dateB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })
    }

    console.log('📊 フィルタ状況:', {
        documents: documents.length,
        selectedTags,
        documentsWithTags: documents.filter(d => d.tags && d.tags.length > 0)
            .length,
        filterType,
        searchQuery,
        filteredDocuments: filteredDocuments.length,
    })

    // ファイルダウンロード処理
    const handleDownload = (document: Document) => {
        if (document.fileUrl) {
            console.log('📅 ファイルダウンロード:', document.subject)
            window.open(document.fileUrl, '_blank')
        } else {
            console.warn('⚠️ ダウンロードURLが見つかりません:', document)
            alert('ファイルのダウンロードURLが利用できません。')
        }
    }

    // ファイルサイズ表示
    const formatFileSize = (bytes: number | null | undefined): string => {
        if (!bytes || bytes === 0) return '-'
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
    }

    // ★ 共通：メモ一覧読み込み（ホバー・ダイアログ両方から使用）
    const loadMemos = async (docId: string, options?: { force?: boolean }) => {
        if (!options?.force && hoverMemos[docId]) return

        setHoverLoadingId(docId)
        setHoverErrorId(null)
        setDialogLoading(true)
        setDialogError(null)

        try {
            const memos = (await getDocumentMemos(docId)) as DocumentMemo[]
            setHoverMemos(prev => ({ ...prev, [docId]: memos }))

            // latestMemo もここで同期しておく
            const last = memos.length ? memos[memos.length - 1] : null
            setDocuments(prev =>
                prev.map(doc =>
                    doc.id === docId
                        ? {
                            ...doc,
                            latestMemo: last
                                ? { text: last.text, updatedAt: last.updatedAt }
                                : null,
                        }
                        : doc,
                ),
            )
        } catch (e) {
            console.error('メモ取得エラー:', e)
            setHoverErrorId(docId)
            setDialogError('メモの取得に失敗しました')
        } finally {
            setHoverLoadingId(null)
            setDialogLoading(false)
        }
    }

    // ホバー開始
    const handleMemoMouseEnter = (doc: Document) => {
        setHoveredDocId(doc.id)
        void loadMemos(doc.id)
    }

    // ホバー終了
    const handleMemoMouseLeave = () => {
        setHoveredDocId(null)
    }

    // メモダイアログを開く（クリック時）
    const openMemoDialog = (doc: Document) => {
        setSelectedDoc(doc)
        setMemoText('')
        setMemoDialogOpen(true)
        void loadMemos(doc.id, { force: true })
    }

    // メモ保存（新規 or 更新）
    const saveMemo = async () => {
        if (!selectedDoc || !memoText.trim()) return
    
        try {
            setSavingMemo(true)
    
            if (editingMemoId) {
                // 🔁 ここで更新APIを呼ぶ
                await updateDocumentMemo(selectedDoc.id, editingMemoId, {
                    text: memoText.trim(),
                })
            } else {
                // 🆕 新規作成
                await createDocumentMemo(selectedDoc.id, { text: memoText.trim() })
            }
    
            await loadMemos(selectedDoc.id, { force: true })
            setMemoText('')
            setEditingMemoId(null)
        } finally {
            setSavingMemo(false)
        }
    }
    
    const closeMemoDialog = () => {
        setMemoDialogOpen(false)
        setSelectedDoc(null)
        setMemoText('')
        setDialogError(null)
        setEditingMemoId(null)
    }

    // 過去メモの編集開始
    const startEditMemo = (memo: DocumentMemo) => {
        setEditingMemoId(memo.memoId)
        setMemoText(memo.text) // 下のテキストエリアに反映
    }


    // 一覧から個別メモ削除（ホバー／ダイアログ共通）
    const handleDeleteMemoFromList = async (docId: string, memoId: string) => {
        const ok = window.confirm('このメモを削除しますか？')
        if (!ok) return

        try {
            setSavingMemo(true)
            await deleteDocumentMemo(docId, memoId)
            // 再取得して hoverMemos と latestMemo を同期
            await loadMemos(docId, { force: true })
        } catch (error) {
            console.error('メモの削除に失敗:', error)
            alert('メモの削除に失敗しました')
        } finally {
            setSavingMemo(false)
        }
    }

    // ページネーション計算
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

    useEffect(() => {
        setCurrentPage(1)
    }, [filterType, searchQuery])

    if (loading) {
        return (
            <div className="py-10 text-center text-slate-600">
                📡 API からデータを読み込み中です…
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6 max-w-full overflow-hidden">
            {/* Page Title */}
            <div>
                <h2 className="text-base md:text-xl text-slate-900">文書一覧</h2>
                <p className="text-xs md:text-sm text-slate-600 mt-1">
                    受信した文書を管理・閲覧できます
                </p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 md:p-4">
                <div className="flex flex-col gap-3">
                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        <label className="text-slate-700 min-w-fit text-xs md:text-sm">
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
                        <Search className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        <Input
                            type="text"
                            placeholder="件名で検索..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="flex-1 text-sm"
                        />
                    </div>

                    {/* Tag Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 text-xs md:text-sm">
                            タグでフィルター:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TAGS.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className={`cursor-pointer transition-colors ${
                                        selectedTags.includes(tag)
                                            ? 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'
                                            : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                                    }`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {TAG_LABELS[tag as PredefinedTag]}
                                    {selectedTags.includes(tag) && (
                                        <X className="ml-1 size-3" />
                                    )}
                                </Badge>
                            ))}
                        </div>
                        {selectedTags.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTags([])}
                                className="self-start text-slate-600 hover:text-slate-900"
                            >
                                フィルターをクリア
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-xs md:text-sm text-slate-600 px-1">
                {filteredDocuments.length}件の文書が見つかりました
                {totalPages > 1 && (
                    <span className="ml-2">
                        (ページ {currentPage} / {totalPages})
                    </span>
                )}
            </div>

            {/* Document Table - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <colgroup>
                            <col style={{ width: '8rem' }} />
                            <col style={{ width: 'auto' }} />
                            <col style={{ width: '15rem' }} />
                            <col style={{ width: '10rem' }} />
                            <col style={{ width: '5rem' }} />
                        </colgroup>
                        <TableHeader className="sticky top-0 z-10 bg-slate-50">
                            <TableRow className="bg-slate-50 text-xs">
                                <TableHead className="bg-slate-50 py-2 px-3 text-xs">
                                    種別
                                </TableHead>
                                <TableHead className="bg-slate-50 py-2 px-3 text-xs">
                                    件名
                                </TableHead>
                                <TableHead className="bg-slate-50 py-2 px-3 text-xs">
                                    メモ
                                </TableHead>
                                <TableHead className="bg-slate-50 py-2 px-3 text-xs">
                                    <button
                                        onClick={toggleSortOrder}
                                        className="flex items-center gap-1 font-medium text-slate-700 cursor-pointer bg-transparent hover:bg-transparent border-none outline-none p-0 text-xs"
                                    >
                                        受信日時
                                        {sortOrder === 'none' && (
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        )}
                                        {sortOrder === 'asc' && (
                                            <ArrowUp className="w-3 h-3 text-blue-600" />
                                        )}
                                        {sortOrder === 'desc' && (
                                            <ArrowDown className="w-3 h-3 text-blue-600" />
                                        )}
                                    </button>
                                </TableHead>
                                <TableHead className="bg-slate-50 py-2 px-3 text-xs">
                                    操作
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                    </Table>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '30rem' }}>
                    <Table>
                        <colgroup>
                            <col style={{ width: '8rem' }} />
                            <col style={{ width: 'auto' }} />
                            <col style={{ width: '15rem' }} />
                            <col style={{ width: '10rem' }} />
                            <col style={{ width: '5rem' }} />
                        </colgroup>
                        <TableBody>
                            {currentDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-12 text-slate-500"
                                    >
                                        <FileText className="size-12 mx-auto mb-3 text-slate-300" />
                                        <p>該当する文書が見つかりませんでした</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentDocuments.map(doc => (
                                    <TableRow
                                        key={doc.id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <TableCell className="py-2 px-3">
                                            <div className="flex flex-col gap-1.5">
                                                {getTypeBadge(doc.type)}
                                                {doc.tags && doc.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.tags.map(tag => (
                                                            <Badge
                                                                key={tag}
                                                                variant="outline"
                                                                className="text-[0.65rem] py-0 px-1.5 bg-orange-50 text-orange-700 border-orange-200"
                                                            >
                                                                {TAG_LABELS[tag as PredefinedTag] || tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-900 py-2 px-3 text-xs">
                                            {getDisplaySubject(doc.subject)}
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-xs">
                                            <div
                                                className="relative inline-flex items-center"
                                                onMouseEnter={() => handleMemoMouseEnter(doc)}
                                                onMouseLeave={handleMemoMouseLeave}
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        openMemoDialog(doc)
                                                    }}
                                                    className={`
                                                        h-7 px-2 inline-flex items-center gap-1 rounded-full border text-xs
                                                        ${
                                    doc.latestMemo
                                        // ✅ メモあり：やわらかい黄色系
                                        ? 'bg-amber-100 text-amber-700 border-amber-500 hover:bg-amber-200 hover:text-amber-800'
                                        // ✅ メモなし：グレーの点線枠＋「＋メモ」
                                        : 'bg-slate-50 text-slate-500 border-dashed border-slate-300 hover:bg-slate-200'
                                    }
                                                    `}
                                                    title={doc.latestMemo ? 'メモを表示/編集' : 'メモを追加'}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    <span className="hidden lg:inline">
                                                        {doc.latestMemo ? 'メモあり' : 'メモ追加'}
                                                    </span>
                                                </Button>

                                                {/* ホバー時：メモ一覧ポップアップ（一覧） */}
                                                {hoveredDocId === doc.id && (
                                                    <div className="absolute left-full top-0 ml-10 z-20 w-72 rounded-md border border-slate-200 bg-white shadow-lg p-2 text-xs">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <span className="font-semibold text-slate-700">
                                                                メモ一覧
                                                            </span>
                                                        </div>

                                                        {hoverLoadingId === doc.id && (
                                                            <p className="text-slate-500">
                                                                読み込み中...
                                                            </p>
                                                        )}

                                                        {hoverErrorId === doc.id && (
                                                            <p className="text-red-500">
                                                                メモの取得に失敗しました
                                                            </p>
                                                        )}

                                                        {hoverMemos[doc.id] &&
                                                            hoverMemos[doc.id].length === 0 &&
                                                            hoverLoadingId !== doc.id &&
                                                            hoverErrorId !== doc.id && (
                                                            <p className="text-slate-500">
                                                                メモは登録されていません
                                                            </p>
                                                        )}

                                                        {hoverMemos[doc.id] &&
                                                            hoverMemos[doc.id].length > 0 && (
                                                            <ul className="space-y-1 max-h-60 overflow-y-auto">
                                                                {hoverMemos[doc.id].map(memo => (
                                                                    <li
                                                                        key={memo.memoId}
                                                                        className="flex items-start gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1"
                                                                    >
                                                                        <div className="flex-1">
                                                                            <p className="whitespace-pre-wrap text-slate-700">
                                                                                {memo.text}
                                                                            </p>
                                                                            <p className="mt-1">
                                                                                <span
                                                                                    className="
                                                                                        inline-flex items-center
                                                                                        rounded-full
                                                                                        bg-slate-50
                                                                                        px-2 py-0.5
                                                                                        text-[0.65rem]
                                                                                        text-slate-500
                                                                                        font-mono
                                                                                        tracking-tight
                                                                                    "
                                                                                >
                                                                                    {formatMemoUpdatedAt(memo.updatedAt)}
                                                                                </span>
                                                                            </p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 py-2 px-3 text-xs">
                                            {formatDateTime(doc.receivedAt)}
                                        </TableCell>
                                        <TableCell className="py-2 px-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownload(doc)}
                                                disabled={!doc.fileUrl}
                                                className="text-xs py-1 px-2 h-auto"
                                            >
                                                開く
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Document Cards - Mobile */}
            <div className="md:hidden space-y-3">
                {currentDocuments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                        <FileText className="size-12 mx-auto mb-3 text-slate-300" />
                        <p>該当する文書が見つかりませんでした</p>
                    </div>
                ) : (
                    currentDocuments.map(doc => (
                        <div
                            key={doc.id}
                            className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 active:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex flex-col gap-2">
                                    {getTypeBadge(doc.type)}
                                    {doc.tags && doc.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {doc.tags.map(tag => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                                >
                                                    {TAG_LABELS[tag as PredefinedTag] || tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    disabled={!doc.fileUrl}
                                >
                                    開く
                                </Button>
                            </div>
                            <h3 className="text-slate-900 mb-2">
                                {getDisplaySubject(doc.subject)}
                            </h3>
                            {doc.latestMemo ? (
                                <div className="mb-2 p-2 bg-slate-50 rounded text-xs text-slate-600 flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">{doc.latestMemo.text}</div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={e => {
                                            e.stopPropagation()
                                            openMemoDialog(doc)
                                        }}
                                        className="h-6 w-6 p-0 hover:text-slate-600 hover:bg-slate-300 text-blue-600 bg-blue-100 flex-shrink-0"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={e => {
                                        e.stopPropagation()
                                        openMemoDialog(doc)
                                    }}
                                    className="
                                            mb-2 w-full justify-start text-xs
                                            rounded-full border
                                            bg-slate-50 text-slate-600 border-dashed border-slate-300
                                            hover:bg-slate-100
                                            "
                                >
                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                    メモを追加
                                </Button>
                              
                            )}
                            <div className="space-y-1 text-sm">
                                <p className="text-slate-600">
                                    <span className="text-slate-500">受信日時:</span>{' '}
                                    {formatDateTime(doc.receivedAt)}
                                </p>
                                {doc.fileSize && (
                                    <p className="text-slate-600">
                                        <span className="text-slate-500">ファイルサイズ:</span>{' '}
                                        {formatFileSize(doc.fileSize)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 md:gap-4 mt-6">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setCurrentPage(prev => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 text-xs py-1.5 px-3"
                    >
                        ← 前へ
                    </Button>

                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                                page =>
                                    page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1,
                            )
                            .map((page, index, array) => (
                                <div key={page} className="flex items-center gap-1.5">
                                    {index > 0 && array[index - 1] !== page - 1 && (
                                        <span className="text-slate-400 text-xs">...</span>
                                    )}
                                    <Button
                                        variant={currentPage === page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[2rem] text-xs py-1.5 px-2 ${
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
                            setCurrentPage(prev => Math.min(prev + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 text-xs py-1.5 px-3"
                    >
                        次へ →
                    </Button>
                </div>
            )}

            {/* メモダイアログ（クリック時） */}
            <Dialog
                open={memoDialogOpen}
                onOpenChange={open => {
                    if (!open) {
                        closeMemoDialog()
                    } else {
                        setMemoDialogOpen(true)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[500px] bg-white">
                    <DialogHeader>
                        <DialogTitle>
                            メモ
                            {selectedDoc
                                ? ` - ${getDisplaySubject(selectedDoc.subject)}`
                                : ''}
                        </DialogTitle>
                        <DialogDescription>
                            この文書に紐づくメモを確認・追加できます
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        {/* 既存メモ一覧（履歴） */}
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {dialogLoading && (
                                <p className="text-xs text-slate-500">
                                    メモを読み込み中...
                                </p>
                            )}
                            {dialogError && (
                                <p className="text-xs text-red-500">{dialogError}</p>
                            )}
                            {selectedDoc &&
                                hoverMemos[selectedDoc.id] &&
                                !dialogLoading &&
                                hoverMemos[selectedDoc.id].length === 0 && (
                                <p className="text-xs text-slate-500">
                                    メモは登録されていません
                                </p>
                            )}
                            {selectedDoc &&
                                hoverMemos[selectedDoc.id] &&
                                hoverMemos[selectedDoc.id].length > 0 && (
                                <>
                                    {hoverMemos[selectedDoc.id].map(memo => (
                                        <div
                                            key={memo.memoId}
                                            className="border border-slate-200 rounded-md px-3 py-2 flex gap-2 items-center bg-slate-50"
                                        >
                                            <div className="flex-1 text-xs">
                                                <div className="mb-1">
                                                    <span
                                                        className="
                                                            inline-flex items-center
                                                            rounded-full
                                                            bg-slate-50
                                                            px-2 py-0.5
                                                            text-[0.65rem]
                                                            text-slate-500
                                                            font-mono
                                                            tracking-tight
                                                        "
                                                    >
                                                        {formatMemoUpdatedAt(memo.updatedAt)}
                                                        {/* ここを formatMemoUpdatedAt(memo.updatedAt) にしてもOK */}
                                                    </span>
                                                </div>
                                                <div className="whitespace-pre-wrap text-slate-800">
                                                    {memo.text}
                                                </div>
                                            </div>

                                            {/* 編集ボタン */}
                                            <Button
                                                size="icon"
                                                onClick={() => startEditMemo(memo)}
                                                disabled={savingMemo}
                                                className="
                                                    h-6 w-6 flex-shrink-0 p-0
                                                    hover:text-slate-500
                                                    hover:bg-blue-100
                                                    bg-transparent
                                                    text-blue-600
                                                    rounded-md
                                                    shadow-none
                                                    border-none
                                                "
                                                title="このメモを編集"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>

                                            {/* 削除ボタン */}
                                            <Button
                                                size="icon"
                                                onClick={() =>
                                                    selectedDoc &&
                                                    handleDeleteMemoFromList(selectedDoc.id, memo.memoId)
                                                }
                                                disabled={savingMemo}
                                                className="
                                                    h-6 w-6 flex-shrink-0 p-0
                                                    text-red-500
                                                    bg-transparent
                                                    hover:bg-red-100
                                                    hover:text-red-700
                                                    rounded-md
                                                    shadow-none
                                                    border-none
                                                "
                                                title="このメモを削除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* 新規メモ入力欄 */}
                        <div className="mt-2">
                            {editingMemoId && (
                                <p className="mb-1 text-xs text-amber-600">
                                    過去のメモを編集中です。編集後「更新」を押してください。
                                </p>
                            )}
                            <textarea
                                value={memoText}
                                onChange={e => setMemoText(e.target.value)}
                                placeholder="メモを入力してください..."
                                className="w-full min-h-[120px] p-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                            />
                        </div>

                    </div>
                    <DialogFooter className="flex gap-3">
                        {/* 閉じるボタン：ダークグレー */}
                        <Button
                            type="button"
                            onClick={closeMemoDialog}
                            disabled={savingMemo}
                            className="
                            h-9 px-5
                            rounded-lg
                            bg-slate-600 text-white
                            text-sm
                            hover:bg-slate-700
                            disabled:bg-slate-400 disabled:text-white/70
                            shadow-sm
                            "
                        >
                            閉じる
                        </Button>

                        {/* 保存ボタン：ブルー */}
                        <Button
                            type="button"
                            onClick={saveMemo}
                            disabled={savingMemo || !memoText.trim()}
                            className="
                                h-9 px-5
                                rounded-lg
                                bg-blue-500 text-white
                                text-sm
                                hover:bg-blue-600
                                disabled:bg-slate-300 disabled:text-white/70
                                shadow-sm
                            "
                        >
                            {savingMemo
                                ? editingMemoId
                                    ? '更新中...'
                                    : '保存中...'
                                : editingMemoId
                                    ? '更新'
                                    : '保存'}
                        </Button>
                    </DialogFooter>

                </DialogContent>
            </Dialog>
        </div>
    )
}
