import { useEffect, useState } from "react";
import { FileText, Printer, Mail, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { getDocuments } from "../../api/documentsApi";
import type { Document } from "../../types/document";

interface DashboardContentProps {
  currentView: string;
}

 * UUID_ファイル名 → ファイル名 に変換
 * 例: "550e8400-e29b-41d4-a716-446655440000_社内通知.pdf"
 *     → "社内通知.pdf"
 */
const getDisplaySubject = (subject: string): string => {
  const [maybeUuid, ...rest] = subject.split("_");

  // UUIDかどうか判定
  const uuidLike =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  if (uuidLike.test(maybeUuid) && rest.length > 0) {
    return rest.join("_");
  }

  return subject;
};

export function DashboardContent({ currentView }: DashboardContentProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (e) {
        console.error("文書一覧の取得に失敗しました", e);
        setError("文書情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (currentView !== "dashboard") return null;

  // --- 集計 ---
  const totalCount = documents.length;
  const faxCount = documents.filter((d) => d.type === "fax").length;
  const emailCount = documents.filter((d) => d.type === "email").length;

  const stats = [
    {
      title: "総文書数",
      value: loading ? "…" : totalCount.toString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "FAX・メールを含む全ての文書",
    },
    {
      title: "FAX",
      value: loading ? "…" : faxCount.toString(),
      icon: Printer,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "受信したFAX文書の件数",
    },
    {
      title: "メール",
      value: loading ? "…" : emailCount.toString(),
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "メール由来の文書件数",
    },
  ];

  // --- 最近の文書 5 件 ---
  const recentDocuments = [...documents]
    .sort((a, b) => {
      const timeA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
      const timeB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  const getTypeBadgeClass = (type: Document["type"]) => {
    if (type === "fax") return "bg-green-50 text-green-700 hover:bg-green-100";
    if (type === "email")
      return "bg-purple-50 text-purple-700 hover:bg-purple-100";
    return "bg-blue-50 text-blue-700 hover:bg-blue-100";
  };

  const getTypeLabel = (type: Document["type"]) => {
    if (type === "fax") return "FAX";
    if (type === "email") return "メール";
    return "アップロード";
  };

  return (
    <div className="p-4 md:p-8">
      {/* タイトル */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-gray-900 mb-1 text-xl md:text-2xl font-semibold">
          ダッシュボード
        </h2>
        <p className="text-gray-500 text-sm">文書管理システムの概要</p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${stat.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  {!loading && " 件"}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 最近の文書 */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">
            最近の文書
          </CardTitle>
          <Clock className="h-4 w-4 text-gray-400" />
        </CardHeader>

        <CardContent>
          {loading && (
            <p className="text-sm text-gray-500">最新の文書を読み込み中です…</p>
          )}

          {!loading && recentDocuments.length === 0 && (
            <p className="text-sm text-gray-500">まだ文書がありません。</p>
          )}

          {!loading && recentDocuments.length > 0 && (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.subject
                        ? getDisplaySubject(doc.subject)
                        : "(件名なし)"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.receivedAt || "-"}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={`mt-1 w-fit self-start text-xs sm:self-center ${getTypeBadgeClass(
                      doc.type
                    )}`}
                  >
                    {getTypeLabel(doc.type)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
