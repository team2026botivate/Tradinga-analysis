import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Watchlist from './components/Watchlist';
import Analysis from './components/Analysis';
import Screener from './components/Screener';
import Portfolio from './components/Portfolio';
import Calendar from './components/Calendar';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'watchlist':
        return <Watchlist />;
      case 'analysis':
        return <Analysis />;
      case 'screener':
        return <Screener />;
      case 'portfolio':
        return <Portfolio />;
      case 'calendar':
        return <Calendar />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-white to-white dark:from-slate-900 dark:to-slate-800">
      <div className="flex min-w-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        {/* Mobile backdrop when sidebar is open */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/40 md:hidden z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        <main className={`flex-1 min-w-0 transition-all duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <div className="p-6 min-w-0">
            {/* Mobile menu button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
                Menu
              </button>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;