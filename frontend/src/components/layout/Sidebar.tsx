import { useState } from 'react'
import { LayoutDashboard, FileText, Upload, X, Type } from 'lucide-react'
import { cn } from '../ui/utils'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ currentView, onViewChange, isOpen, onClose }: SidebarProps) => {
  const [fontSize, setFontSize] = useState(100);

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    const root = document.documentElement;
    root.style.fontSize = `${newSize}%`;
  };

  const fontSizeOptions = [75, 100, 125, 150, 175, 200];

  const menuItems = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: LayoutDashboard,
      to: '/',
    },
    {
      id: 'documents',
      label: '文書一覧',
      icon: FileText,
      to: '/documents',
    },
    {
      id: 'fax-upload',
      label: 'FAXアップロード',
      icon: Upload,
      to: '/fax-upload',
    },
  ];

    return (
        <>
            {/* オーバーレイ */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
            )}
      
      {/* サイドバー */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col",
        "w-64 min-w-[16rem]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* ロゴエリア */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-[rgb(23,24,25)] text-base md:text-lg whitespace-nowrap overflow-hidden text-ellipsis">All Vault Cloud</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="bg-white hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5 text-black" />
          </Button>
        </div>

        {/* メニュー */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors cursor-pointer',
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", currentView === item.id ? "text-blue-500" : "text-gray-600")} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 文字サイズ調整 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Type className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">文字サイズ</span>
              </span>
              <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{fontSize}%</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {fontSizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  className={cn(
                    "py-2 px-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap",
                    fontSize === size
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  )}
                >
                  {size}%
                </button>
              ))}
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              クリックして文字サイズを選択
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar
