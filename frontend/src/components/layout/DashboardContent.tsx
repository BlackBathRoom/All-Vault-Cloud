import { FileText, Printer, Mail, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";

interface DashboardContentProps {
  currentView: string;
}

export function DashboardContent({
  currentView,
}: DashboardContentProps) {
  if (currentView !== "dashboard") {
    return (
      <div className="p-4 md:p-8">
        <h2 className="text-gray-900 mb-4">
          {currentView === "documents" && "文書管理"}
          {currentView === "fax-upload" && "FAXアップロード"}
        </h2>
        <p className="text-gray-500">
          このセクションは開発中です。
        </p>
      </div>
    );
  }

  const stats = [
    {
      title: "総文書数",
      value: "124",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "FAX",
      value: "64",
      icon: Printer,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "メール",
      value: "60",
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const recentDocuments = [
    {
      id: 1,
      name: "請求書_2024-11.pdf",
      type: "FAX",
      date: "2024-11-17 10:30",
    },
    {
      id: 2,
      name: "契約書_A社.pdf",
      type: "メール",
      date: "2024-11-17 09:15",
    },
    {
      id: 3,
      name: "見積書_B社.pdf",
      type: "FAX",
      date: "2024-11-16 16:45",
    },
    {
      id: 4,
      name: "報告書_月次.pdf",
      type: "アップロード",
      date: "2024-11-16 14:20",
    },
    {
      id: 5,
      name: "発注書_C社.pdf",
      type: "メール",
      date: "2024-11-15 11:00",
    },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* ページタイトル */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-gray-900 mb-1">ダッシュボード</h2>
        <p className="text-gray-500">文書管理システムの概要</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-gray-700">
                  {stat.title}
                </CardTitle>
                <div
                  className={`${stat.bgColor} p-3 rounded-lg`}
                >
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-gray-900 mb-2 text-3xl">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 最近の文書 */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">
            最近の文書
          </CardTitle>
          <p className="text-gray-500">
            最近アップロードされた文書がここに表示されます
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">
                        {doc.date}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    doc.type === "FAX"
                      ? "bg-green-50 text-green-700 hover:bg-green-100 self-start sm:self-center"
                      : doc.type === "メール"
                        ? "bg-purple-50 text-purple-700 hover:bg-purple-100 self-start sm:self-center"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 self-start sm:self-center"
                  }
                >
                  {doc.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}