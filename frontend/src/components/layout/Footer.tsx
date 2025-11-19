export function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-4 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between text-gray-400 gap-4">
        <p className="text-[16px] text-center md:text-left">&copy; 2024 All Vault Cloud. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a>
          <a href="#" className="hover:text-white transition-colors">利用規約</a>
          <a href="#" className="hover:text-white transition-colors">お問い合わせ</a>
        </div>
      </div>
    </footer>
  );
}