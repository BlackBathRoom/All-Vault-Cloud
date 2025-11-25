import { useState, useEffect } from 'react'
import { Search, Filter, FileText, Mail, Printer, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
import { getDocuments } from '../../api/documentsApi'
import { Document, TAG_LABELS, PREDEFINED_TAGS, type PredefinedTag } from '../../types/document'

export function DocumentList() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(false)

    const [filterType, setFilterType] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none') // 受信日時のソート順
    const itemsPerPage = 8 // 1ページあたりの表示件数

    useEffect(() => {
        const load = async () => {
            try {
                console.log('📡 API読み込み開始...')
                setLoading(true)
                const data = await getDocuments() // 全件取得
                console.log('📥 取得したデータ:', data)
                console.log('📊 データ件数:', data.length)
                // タグ情報のデバッグ
                data.forEach((doc, idx) => {
                    if (doc.tags) {
                        console.log(`📌 Doc ${idx}: ${doc.subject} has tags:`, doc.tags)
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
        }

        const { label, className } = config[type as keyof typeof config]
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
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
        setCurrentPage(1) // フィルター変更時はページをリセット
    }

    // 受信日時のソート切り替え
    const toggleSortOrder = () => {
        setSortOrder((prev) => {
            if (prev === 'none') return 'desc' // 最初は降順（新しい順）
            if (prev === 'desc') return 'asc' // 次は昇順（古い順）
            return 'none' // 最後はソート解除
        })
        setCurrentPage(1) // ソート変更時はページをリセット
    }

    // フィルタ＆検索
    let filteredDocuments = documents.filter((doc) => {
        const matchesType = filterType === 'all' || doc.type === filterType
        const matchesSearch =
      searchQuery === '' ||
      (doc.subject && doc.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    
        // タグフィルター: 選択されたタグがない場合は全て表示
        // 選択されたタグがある場合は、ドキュメントのタグに含まれるものだけ表示
        let matchesTags = true
        if (selectedTags.length > 0) {
            if (!doc.tags || !Array.isArray(doc.tags) || doc.tags.length === 0) {
                matchesTags = false
            } else {
                matchesTags = selectedTags.some(selectedTag =>
                    (doc.tags?.some(docTag => docTag === selectedTag)) ?? false
                )
            }
        }
    
        const result = matchesType && matchesSearch && matchesTags
    
        // デバッグ: フィルター対象の最初の文書をログ出力
        if (selectedTags.length > 0 && doc.tags && doc.tags.length > 0) {
            console.log('🔍 Checking doc:', {
                subject: doc.subject,
                docTags: doc.tags,
                selectedTags,
                matchesTags,
                result
            })
        }
    
        return result
    })

    // 受信日時でソート
    if (sortOrder !== 'none') {
        filteredDocuments = [...filteredDocuments].sort((a, b) => {
            const dateA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0
            const dateB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })
    }

    // デバッグ情報
    console.log('📊 フィルタ状況:', { 
        documents: documents.length,
        selectedTags,
        selectedTagsDetail: selectedTags.map(t => `"${t}"`),
        documentsWithTags: documents.filter(d => d.tags && d.tags.length > 0).length,
        sampleDocTags: documents.filter(d => d.tags && d.tags.length > 0).map(d => ({
            subject: d.subject,
            tags: d.tags
        })),
        filterType, 
        searchQuery, 
        filteredDocuments: filteredDocuments.length 
    })

    // ファイルダウンロード処理
    const handleDownload = (document: Document) => {
        if (document.fileUrl) {
            console.log('📅 ファイルダウンロード:', document.subject)
            // 署名付きURLで直接ダウンロード
            window.open(document.fileUrl, '_blank')
        } else {
            console.warn('⚠️ ダウンロードURLが見つかりません:', document)
            alert('ファイルのダウンロードURLが利用できません。')
        }
    }

    // ファイルサイズを読みやすく表示する関数
    const formatFileSize = (bytes: number | null | undefined): string => {
        if (!bytes || bytes === 0) return '-'
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
    }

    // ページネーション計算
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

    // フィルター・検索変更時にページをリセット
    useEffect(() => {
        setCurrentPage(1)
    }, [filterType, searchQuery])

    // ローディング・エラー表示
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
                            placeholder="件名で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                    </div>

                    {/* Tag Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 text-sm md:text-base">
              タグでフィルター:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TAGS.map((tag) => (
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
                            <TableHead className="w-[200px]">
                                <button
                                    onClick={toggleSortOrder}
                                    className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer bg-transparent hover:bg-transparent border-none outline-none p-0"
                                >
                                    受信日時
                                    {sortOrder === 'none' && <ArrowUpDown className="size-3.5 text-slate-400" />}
                                    {sortOrder === 'asc' && <ArrowUp className="size-3.5 text-blue-600" />}
                                    {sortOrder === 'desc' && <ArrowDown className="size-3.5 text-blue-600" />}
                                </button>
                            </TableHead>
                            <TableHead className="w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentDocuments.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center py-12 text-slate-500"
                                >
                                    <FileText className="size-12 mx-auto mb-3 text-slate-300" />
                                    <p>該当する文書が見つかりませんでした</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentDocuments.map((doc) => (
                                <TableRow
                                    key={doc.id}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            {getTypeBadge(doc.type)}
                                            {doc.tags && doc.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {doc.tags.map((tag) => (
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
                                    </TableCell>
                                    <TableCell className="text-slate-900">
                                        {doc.subject}
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
                            ))
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
                                <div className="flex flex-col gap-2">
                                    {getTypeBadge(doc.type)}
                                    {doc.tags && doc.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {doc.tags.map((tag) => (
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
                            <h3 className="text-slate-900 mb-2">{doc.subject}</h3>
                            <div className="space-y-1 text-sm">
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
        </div>
    )
}
