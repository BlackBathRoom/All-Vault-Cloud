import { LayoutDashboard, FileText, Upload, X } from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ currentView, onViewChange, isOpen, onClose }: SidebarProps) => {
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
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* ロゴエリア */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <h1 className="text-[rgb(23,24,25)]">All Vault Cloud</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* メニュー */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                asChild
                key={item.id}
                variant="ghost"
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors justify-start',
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
              >
                <Link to={item.to} className="flex items-center gap-3 w-full h-full">
                  <Icon className={cn("w-5 h-5", currentView === item.id ? "text-blue-500" : "text-gray-600")} />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
