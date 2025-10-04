import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Tag,
  Image as ImageIcon,
  User,
  Bell,
  Megaphone,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { path: '/', label: 'Home', icon: Home },
      { path: `/${role}`, label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (role === 'customer') {
      return [
        ...baseItems,
        { path: '/customer/orders', label: 'My Orders', icon: ShoppingCart },
        { path: '/customer/profile', label: 'Profile', icon: User },
        { path: '/notifications', label: 'Notifications', icon: Bell },
      ];
    }

    if (role === 'agent') {
      return [
        ...baseItems,
        { path: '/agent/products', label: 'Products', icon: Package },
        { path: '/agent/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/agent/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/agent/settings', label: 'Settings', icon: Settings },
        { path: '/notifications', label: 'Notifications', icon: Bell },
      ];
    }

    if (role === 'admin') {
      return [
        ...baseItems,
        { path: '/admin/products', label: 'Products', icon: Package },
        { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/admin/agents', label: 'Agents', icon: Users },
        { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
        { path: '/admin/categories', label: 'Categories', icon: Tag },
        { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
        { path: '/notifications', label: 'Notifications', icon: Bell },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <Link to="/" className="text-xl font-bold text-primary-600">
            MS Special
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
