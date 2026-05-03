import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Key, 
  CheckSquare, 
  LogOut,
  Menu,
  ChevronLeft,
  Zap,
  Sun,
  Moon
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'General' },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare, section: 'General' },
  ];

  if (user?.role === 'admin') {
    menuItems.push(
      { path: '/users', label: 'Users', icon: UsersIcon, section: 'Administration' },
      { path: '/licenses', label: 'Licenses', icon: Key, section: 'Administration' }
    );
  }

  // Group items by section
  const sections = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const pageTitle = menuItems.find(m => m.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed && !isMobile ? 'collapsed' : ''} ${isMobile && mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Zap size={18} color="#fff" />
            </div>
            {(!collapsed || isMobile) && <span>S L O T B A S E</span>}
          </div>
          {!isMobile && (
            <button className="hamburger-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
              {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              {(!collapsed || isMobile) && (
                <div className="nav-section-title">{section}</div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon"><Icon size={20} /></span>
                    {(!collapsed || isMobile) && item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }} title={collapsed ? 'Logout' : undefined}>
            <span className="nav-icon"><LogOut size={20} /></span>
            {(!collapsed || isMobile) && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`main-content ${collapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isMobile && (
              <button className="hamburger-btn" onClick={() => setMobileOpen(true)}>
                <Menu size={20} />
              </button>
            )}
            <h1 className="page-title">{pageTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-icon" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="user-info">
              <div style={{ textAlign: 'right' }}>
                <div className="user-name">{user?.phone}</div>
                <div className="user-role">{user?.role}</div>
              </div>
              <div className="user-avatar">
                {getInitials(user?.phone)}
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
