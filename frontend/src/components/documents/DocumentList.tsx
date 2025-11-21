import { useState, useEffect } from "react";
import { Search, Filter, FileText, Mail, Printer } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";

interface Document {
  id: string;
  type: "fax" | "email" | "document";
  subject: string;
  sender: string;
  receivedDate: string;
}

// サンプルデータ
const sampleDocuments: Document[] = [
  {
    id: "1",
    type: "fax",
    subject: "見積書_2024年11月",
    sender: "田中商事",
    receivedDate: "2025-11-19 14:30",
  },
  {
    id: "2",
    type: "email",
    subject: "契約書類のご確認",
    sender: "佐藤太郎",
    receivedDate: "2025-11-19 11:15",
  },
  {
    id: "3",
    type: "fax",
    subject: "発注書_202511-001",
    sender: "鈴木産業",
    receivedDate: "2025-11-18 16:45",
  },
  {
    id: "4",
    type: "document",
    subject: "月次報告書_10月分",
    sender: "山田花子",
    receivedDate: "2025-11-18 09:20",
  },
  {
    id: "5",
    type: "email",
    subject: "会議資料の共有",
    sender: "高橋一郎",
    receivedDate: "2025-11-17 13:00",
  },
  {
    id: "6",
    type: "fax",
    subject: "請求書_202511-015",
    sender: "ABC株式会社",
    receivedDate: "2025-11-16 10:30",
  },
  {
    id: "7",
    type: "document",
    subject: "プロジェクト提案書",
    sender: "中村美咲",
    receivedDate: "2025-11-16 08:45",
  },
  {
    id: "8",
    type: "email",
    subject: "システム保守のお知らせ",
    sender: "システム管理者",
    receivedDate: "2025-11-15 17:20",
  },
  {
    id: "9",
    type: "fax",
    subject: "納期変更のご連絡",
    sender: "製造業者XYZ",
    receivedDate: "2025-11-15 14:15",
  },
  {
    id: "10",
    type: "document",
    subject: "年次監査報告書",
    sender: "監査法人DEF",
    receivedDate: "2025-11-14 16:00",
  },
  {
    id: "11",
    type: "email",
    subject: "新商品カタログについて",
    sender: "営業部",
    receivedDate: "2025-11-14 12:30",
  },
  {
    id: "12",
    type: "fax",
    subject: "在庫確認依頼書",
    sender: "倉庫管理センター",
    receivedDate: "2025-11-13 15:45",
  },
  {
    id: "13",
    type: "document",
    subject: "技術仕様書_Ver2.1",
    sender: "開発チーム",
    receivedDate: "2025-11-13 11:20",
  },
  {
    id: "14",
    type: "email",
    subject: "研修会のご案内",
    sender: "人事部",
    receivedDate: "2025-11-12 09:15",
  },
  {
    id: "15",
    type: "fax",
    subject: "配送スケジュール表",
    sender: "物流センター",
    receivedDate: "2025-11-12 07:50",
  },
];

export function DocumentList() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 1ページあたりの表示件数

  const getTypeIcon = (type: Document["type"]) => {
    switch (type) {
      case "fax":
        return <Printer className="size-4" />;
      case "email":
        return <Mail className="size-4" />;
      case "document":
        return <FileText className="size-4" />;
    }
  };

  const getTypeBadge = (type: Document["type"]) => {
    const config = {
      fax: {
        label: "FAX",
        className:
          "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
      },
      email: {
        label: "メール",
        className:
          "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
      },
      document: {
        label: "文書",
        className:
          "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
      },
    };

    const { label, className } = config[type];
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        {getTypeIcon(type)}
        {label}
      </Badge>
    );
  };

  const filteredDocuments = sampleDocuments.filter((doc) => {
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesSearch =
      searchQuery === "" ||
      doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // ページネーション計算
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  // フィルター変更時にページをリセット
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

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
            <label className="text-slate-700 min-w-fit text-sm md:text-base">種別:</label>
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
              <TableHead className="w-[200px]">送信者</TableHead>
              <TableHead className="w-[180px]">受信日時</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
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
                  <TableCell>{getTypeBadge(doc.type)}</TableCell>
                  <TableCell className="text-slate-900">
                    {doc.subject}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {doc.sender}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {doc.receivedDate}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
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
                {getTypeBadge(doc.type)}
                <Button variant="outline" size="sm">
                  開く
                </Button>
              </div>
              <h3 className="text-slate-900 mb-2">
                {doc.subject}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-slate-700">
                  <span className="text-slate-500">送信者:</span> {doc.sender}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">受信日時:</span> {doc.receivedDate}
                </p>
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
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
          >
            ← 前へ
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
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
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[2.5rem] ${
                      currentPage === page 
                        ? "bg-slate-700 hover:bg-slate-800 text-white border-slate-700" 
                        : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
                    }`}
                  >
                    {page}
                  </Button>
                </div>
              ))
            }
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
          >
            次へ →
          </Button>
        </div>
      )}
    </div>
  );
}
