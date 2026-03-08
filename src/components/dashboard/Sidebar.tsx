'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  LogOut,
  ChevronDown,
  Layers,
  Shield,
  Menu,
  X,
  User,
  Code,
  Home,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/conversations', icon: MessageSquare, label: 'Conversations' },
  { href: '/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings/embed', icon: Code, label: 'Embed Widget' },
  { href: '/settings/templates', icon: Layers, label: 'AI Templates' },
  { href: '/settings/ai', icon: Settings, label: 'Settings' },
  { href: '/settings/profile', icon: User, label: 'Profile' },
];

// Admin emails that can access admin panel
const ADMIN_EMAILS = ['davistejuan341@gmail.com'];

interface SidebarProps {
  workspace?: {
    name: string;
    subscription_plan: string;
  };
  userEmail?: string;
}

export default function Sidebar({ workspace, userEmail }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    // Force full page reload to clear all state
    window.location.replace('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-dark-800">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Vault AI</span>
        </Link>
      </div>

      {/* Workspace Selector */}
      {workspace && (
        <div className="p-4 border-b border-dark-800">
          <button className="w-full flex items-center justify-between px-3 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <span className="text-primary-400 font-semibold text-sm">
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">
                  {workspace.name}
                </p>
                <p className="text-xs text-dark-400 capitalize">
                  {workspace.subscription_plan}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Admin Link - Only for admins */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={closeMobileMenu}
            className={`sidebar-link mt-4 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 ${
              pathname === '/admin' ? 'bg-amber-500/10' : ''
            }`}
          >
            <Shield className="w-5 h-5" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-dark-800">
        {userEmail && (
          <p className="text-xs text-dark-500 mb-3 truncate px-3">{userEmail}</p>
        )}
        <a
          href="https://hissecretvault.net"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 mb-1"
        >
          <Home className="w-5 h-5" />
          His Secret Vault
        </a>
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-900 border-b border-dark-800 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Vault AI</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-14 left-0 bottom-0 w-64 bg-dark-900 border-r border-dark-800 flex flex-col z-40 transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-dark-900 border-r border-dark-800 flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
