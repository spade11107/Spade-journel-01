import { useState, ReactNode } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Calendar,
  BarChart3,
  Brain,
  AlertTriangle,
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Spade,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export type PageKey =
  | 'dashboard'
  | 'add-trade'
  | 'journal'
  | 'calendar'
  | 'analytics'
  | 'psychology'
  | 'mistakes'
  | 'accounts'
  | 'settings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'add-trade', label: 'Add Trade', icon: PlusCircle },
  { key: 'journal', label: 'Trade Journal', icon: BookOpen },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'psychology', label: 'Psychology', icon: Brain },
  { key: 'mistakes', label: 'Mistakes', icon: AlertTriangle },
  { key: 'accounts', label: 'Accounts', icon: Wallet },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

interface LayoutProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: PageKey) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
          <Spade size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">SPADE</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest -mt-0.5">Track. Analyze. Improve.</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <Icon
                size={18}
                className={`transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-400 flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-300 truncate">{user?.email}</p>
            <p className="text-[10px] text-zinc-600">Trader</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-zinc-900/95 border-r border-zinc-800/60 fixed inset-y-0 left-0 z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 z-50 lg:hidden animate-slideInLeft">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-3 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400"
            >
              <X size={18} />
            </button>
            {SidebarContent}
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-300"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Spade size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">SPADE</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
