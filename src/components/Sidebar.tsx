import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Settings,
  Menu,
  User,
  LogOut,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout?: () => void;
  userEmail: string | null;
  userName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, collapsed, setCollapsed, onLogout, userEmail, userName }) => {
  const { theme, toggleTheme } = useTheme();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', label: 'Trade Journal', icon: BookOpen },
    // { id: 'analysis', label: 'Analysis', icon: TrendingUp },
    // { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
    // { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className={
        `fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 flex flex-col overflow-y-auto no-scrollbar ` +
        `${collapsed ? '-translate-x-full w-20' : 'translate-x-0 w-64'} ` +
        `${collapsed ? 'md:translate-x-0 md:w-20' : 'md:translate-x-0 md:w-64'}`
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">TradeFlow</span>
          </div>
        )}
        <div className="flex items-center gap-2">
        <div className="flex justify-end items-center gap-2">
        <div className="flex justify-between items-center">
  {/* Menu Toggle Button on Left */}
  <button
    onClick={() => setCollapsed(!collapsed)}
    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    aria-label="Toggle sidebar"
  >
    <Menu className="h-5 w-5" />
  </button>

  {/* Theme Toggle Button on Right */}
  <button
    onClick={toggleTheme}
    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    aria-label="Toggle theme"
    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
  </button>
</div>

</div>

        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-secondary-600 to-primary-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{userName || userEmail || "Guest"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation (scrollable) */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="text-2xl" />
                  {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout button (sticky at bottom) */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-start space-x-3 p-3 rounded-xl text-danger-700 hover:text-white hover:bg-danger-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Footer />
        </div>
      )}
    </div>
  );
};

export default Sidebar;