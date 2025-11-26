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
} from 'lucide-react'
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
import {
  Document,
  TAG_LABELS,
  PREDEFINED_TAGS,
  type PredefinedTag,
} from '../../types/document'

// ✅ UUID_ファイル名（やパス付き）から表示用のファイル名だけを取り出す関数
const getDisplaySubject = (subject?: string): string => {
  if (!subject) return ''

  // もし "uploads/raw/UUID_サンプルtest" のようにパスが付いていたら最後の "/" 以降だけにする
  const lastSlashIndex = subject.lastIndexOf('/')
  const filenamePart =
    lastSlashIndex >= 0 ? subject.slice(lastSlashIndex + 1) : subject

  // 先頭の "UUID_" を取り除く
  const underscoreIndex = filenamePart.indexOf('_')
  if (underscoreIndex === -1) {
    // "_" がなければそのまま件名として扱う
    return filenamePart
  }

  const prefix = filenamePart.slice(0, underscoreIndex)
  const rest = filenamePart.slice(underscoreIndex + 1)

  // UUID 形式かどうかチェック（8-4-4-4-12 の16進数）
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (uuidRegex.test(prefix)) {
    // "UUID_..." 形式なら "_" 以降だけを表示用件名として返す
    return rest
  }

  // それ以外（普通の件名）はそのまま
  return filenamePart
}

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
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
    setCurrentPage(1) // フィルター変更時はページをリセット
  }

  // 受信日時のソート切り替え
  const toggleSortOrder = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'desc' // 最初は降順（新しい順）
      if (prev === 'desc') return 'asc' // 次は昇順（古い順）
      return 'none' // 最後はソート解除
    })
    setCurrentPage(1) // ソート変更時はページをリセット
  }

  // フィルタ＆検索
  let filteredDocuments = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.type === filterType

    // ✅ 検索対象も UUID を削った「表示用件名」で行う
    const displaySubject = getDisplaySubject(doc.subject)
    const matchesSearch =
      searchQuery === '' ||
      displaySubject.toLowerCase().includes(searchQuery.toLowerCase())

    // タグフィルター
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

    const result = matchesType && matchesSearch && matchesTags

    // デバッグ: フィルター対象の最初の文書をログ出力
    if (selectedTags.length > 0 && doc.tags && doc.tags.length > 0) {
      console.log('🔍 Checking doc:', {
        subject: doc.subject,
        displaySubject,
        docTags: doc.tags,
        selectedTags,
        matchesTags,
        result,
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
    documentsWithTags: documents.filter(d => d.tags && d.tags.length > 0)
      .length,
    sampleDocTags: documents
      .filter(d => d.tags && d.tags.length > 0)
      .map(d => ({
        subject: d.subject,
        tags: d.tags,
      })),
    filterType,
    searchQuery,
    filteredDocuments: filteredDocuments.length,
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
    return (
      `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}` ??
      '-'
    )
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

  // ローディング表示
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
              <col style={{ width: '10rem' }} />
              <col style={{ width: '5rem' }} />
            </colgroup>
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
                      {/* ✅ ファイル名だけ表示 */}
                      {getDisplaySubject(doc.subject)}
                    </TableCell>
                    <TableCell className="text-slate-600 py-2 px-3 text-xs">
                      {doc.receivedAt}
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
              {/* ✅ モバイルの件名表示もファイル名だけ */}
              <h3 className="text-slate-900 mb-2">
                {getDisplaySubject(doc.subject)}
              </h3>
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
    </div>
  )
}
