import { useContext } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Users, Map, Clock, LogOut, ShieldAlert } from 'lucide-react';

const BrandLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center relative">
      <div className="w-2 h-2 bg-bg rounded-full"></div>
    </div>
    <span className="font-sora font-bold text-xl text-text tracking-tight">SheAlert</span>
  </div>
);

const AppLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col">
        <header className="h-16 flex items-center px-5 border-b border-line bg-bg">
          <Link to="/"><BrandLogo /></Link>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Reports', path: '/reports', icon: Map },
    { name: 'History', path: '/history', icon: Clock },
  ];

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-bg">
      {/* Top Bar for Mobile */}
      <header className="lg:hidden h-14 flex items-center justify-between px-5 border-b border-line sticky top-0 z-30 bg-bg/90 backdrop-blur-md">
        <div className="font-sora font-bold text-lg">SheAlert</div>
        <button onClick={handleLogout} className="text-text-muted hover:text-text p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-line h-dvh sticky top-0 p-5 bg-surface">
        <Link to="/" className="mb-10"><BrandLogo /></Link>
        <nav className="flex-1 flex flex-col gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
            return (
              <Link 
                key={tab.name} 
                to={tab.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-DEFAULT font-medium transition ${isActive ? 'bg-surface-raised text-brand' : 'text-text-muted hover:text-text hover:bg-surface-raised'}`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT font-medium text-text-muted hover:text-sos hover:bg-surface-raised mt-auto">
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto lg:p-8 p-5 pb-24 lg:pb-8 flex justify-center">
        <div className="w-full max-w-[480px]">
          <Outlet />
        </div>
      </main>

      {/* Bottom Tab Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)] z-30">
        <div className="flex justify-around items-center h-16 px-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
            return (
              <Link 
                key={tab.name} 
                to={tab.path}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition ${isActive ? 'text-brand' : 'text-text-muted'}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
