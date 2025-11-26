import { Home, FileText, Upload, Menu } from 'lucide-react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="h-16 bg-black border-b border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onMenuClick}
          className="bg-black text-white hover:bg-gray-800 hover:text-white flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-white text-base md:text-lg whitespace-nowrap overflow-hidden text-ellipsis">All Vault Cloud</h2>
      </div>

      <nav className="hidden md:flex items-center gap-2 flex-shrink-0">
        <Button asChild variant="ghost" className="gap-2 bg-black text-white hover:bg-gray-800 hover:text-white whitespace-nowrap">
          <Link to="/">
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>ホーム</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-2 bg-black text-white hover:bg-gray-800 hover:text-white whitespace-nowrap">
          <Link to="/documents">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>文書一覧</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-2 bg-black text-white hover:bg-gray-800 hover:text-white whitespace-nowrap">
          <Link to="/fax-upload">
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span>FAXアップロード</span>
          </Link>
        </Button>
      </nav>
    </header>
  );
};

export default Header