import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import Portfolio from './components/Portfolio';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import Login from './components/Login';
import Trade from './components/Trade';
import Journal from './components/Journal';
 

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(Boolean(localStorage.getItem('auth_token')));

  const handleLogin = (email: string) => {
    // token may have been set by Login when Remember me is checked
    if (!localStorage.getItem('auth_token')) {
      // fallback token for this demo session
      localStorage.setItem('auth_token', 'demo');
    }
    sessionStorage.setItem('auth_email', email);
    setIsAuthed(true);
  };

  // Listen for app-wide navigation events (e.g., from Journal after saving a trade)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (ce.detail) {
        setActiveTab(ce.detail);
      }
    };
    window.addEventListener('navigate', handler as EventListener);
    return () => window.removeEventListener('navigate', handler as EventListener);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_email');
    setIsAuthed(false);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'journal':
        return <Journal />;
      case 'analysis':
        return <Analysis />;
      case 'portfolio':
        return <Portfolio />;
      case 'trade':
        return <Trade />;
      case 'calendar':
        return <Calendar />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthed) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-brand-50 to-white">
      <div className="flex min-w-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
        />
        {/* Mobile backdrop when sidebar is open */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/40 md:hidden z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        <main className={`flex-1 min-w-0 transition-all duration-300 ml-0 overflow-y-auto no-scrollbar max-h-screen ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <div className="container-page py-6 min-w-0">
            {/* Mobile menu button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700"
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