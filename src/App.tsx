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
import Footer from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load sidebar collapsed state from localStorage (default = true after login)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? saved === 'true' : true; // Sidebar hidden by default
  });

  const [isAuthed, setIsAuthed] = useState<boolean>(
    Boolean(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))
  );
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(
    sessionStorage.getItem('auth_email')
  );
  const [loggedInUserName, setLoggedInUserName] = useState<string | null>(
    sessionStorage.getItem('auth_name')
  );

  // Handle sidebar toggle and persist the state
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  };

  const handleLogin = (email: string) => {
    // Token is set by Login.tsx in session/local depending on Remember Me
    // Keep email in session for display and data fetches
    sessionStorage.setItem('auth_email', email);
    setIsAuthed(Boolean(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')));
    setLoggedInUserEmail(email);
    setLoggedInUserName(sessionStorage.getItem('auth_name'));
    handleSidebarToggle(true); // Collapse sidebar on login and persist it
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
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_email');
    sessionStorage.removeItem('auth_name');
    setIsAuthed(false);
    setLoggedInUserEmail(null);
    setLoggedInUserName(null);
    setActiveTab('dashboard');
    handleSidebarToggle(true); // Keep sidebar hidden after logout
  };

  const renderContent = (userEmail: string | null, userName: string | null) => {
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
        return <Settings userEmail={userEmail} userName={userName} />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthed) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ThemeProvider>
      <AppContent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        handleSidebarToggle={handleSidebarToggle}
        handleLogout={handleLogout}
        loggedInUserEmail={loggedInUserEmail}
        loggedInUserName={loggedInUserName}
        renderContent={renderContent}
      />
    </ThemeProvider>
  );
}

interface AppContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  handleSidebarToggle: (collapsed: boolean) => void;
  handleLogout: () => void;
  loggedInUserEmail: string | null;
  loggedInUserName: string | null;
  renderContent: (userEmail: string | null, userName: string | null) => React.ReactNode;
}

const AppContent: React.FC<AppContentProps> = ({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  handleSidebarToggle,
  handleLogout,
  loggedInUserEmail,
  loggedInUserName,
  renderContent
}) => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-brand-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
        <div className="flex min-w-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={handleSidebarToggle}
            onLogout={handleLogout}
            userEmail={loggedInUserEmail}
            userName={loggedInUserName || undefined}
          />

          {/* Mobile backdrop when sidebar is open */}
          {!sidebarCollapsed && (
            <div
              className="fixed inset-0 bg-black/40 md:hidden z-40"
              onClick={() => handleSidebarToggle(true)}
            />
          )}

          <main
            className={`flex-1 min-w-0 transition-all duration-300 ml-0 overflow-y-auto no-scrollbar max-h-screen with-sticky-footer ${
              sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
            }`}
          >
            <div className="container-page py-6 min-w-0">
              {/* Mobile menu button */}
              <div className="md:hidden mb-4 flex justify-end">
                <button
                  onClick={() => handleSidebarToggle(false)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                  Menu
                </button>
              </div>
              {renderContent(loggedInUserEmail, loggedInUserName)}
            </div>
            <Footer />
          </main>
        </div>
      </div>
  );
};

export default App;
