"use client"

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showDropdown, setShow] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (response.ok) {
        localStorage.removeItem('pivot_preferences');
        sessionStorage.clear();
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const navItems = [
    { href: '/dashboard', icon: 'trending_up', label: 'Market', match: (p: string) => p === '/dashboard' || p.startsWith('/dashboard/market') },
    { href: '#', icon: 'newspaper', label: 'News', match: () => false },
    { href: '#', icon: 'pie_chart', label: 'Portfolio', match: () => false },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col z-50">
        <div className="px-6 py-8">
          <h1 className="text-headline-md font-headline-md font-bold text-primary">Pivot</h1>
          <p className="text-label-md text-label-md text-on-surface-variant opacity-70">Institutional Grade</p>
        </div>
        <nav className="flex-grow mt-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => { if (item.href.startsWith('/')) { e.preventDefault(); router.push(item.href); } }}
                    className={`flex items-center px-6 py-3 transition-all ${active ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low' : 'text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    <span className="material-symbols-outlined mr-4 text-[20px]">{item.icon}</span>
                    <span className="text-label-md text-label-md">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto border-t border-outline-variant pt-4 pb-8">
          <ul className="space-y-1">
            <li>
              <a className="flex items-center px-6 py-3 text-on-surface-variant hover:bg-surface-container transition-all" href="#">
                <span className="material-symbols-outlined mr-4 text-[20px]">help</span>
                <span className="text-label-md text-label-md">Support</span>
              </a>
            </li>
            <li>
              <button onClick={handleLogout} className="flex items-center w-full px-6 py-3 text-on-surface-variant hover:bg-surface-container transition-all">
                <span className="material-symbols-outlined mr-4 text-[20px]">logout</span>
                <span className="text-label-md text-label-md">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <main className="ml-64 flex-grow min-h-screen bg-background">
        <header className="flex justify-between items-center px-16 w-full h-16 bg-surface border-b border-outline-variant sticky top-0 z-40">
          <div className="flex items-center space-x-6">
            <div className="flex items-center bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant w-80">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-label-md font-label-md w-full placeholder:text-on-surface-variant/50" placeholder="Search markets..." type="text" />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="relative">
              <button onClick={() => setShow(prev => !prev)} className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold overflow-hidden border border-outline-variant cursor-pointer">
                <span className="text-label-sm">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-outline-variant rounded-lg shadow-lg z-50 py-2">
                  <div className="px-4 py-2 border-b border-outline-variant/30">
                    <p className="text-label-sm text-on-surface truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => { setShow(false); router.push('/dashboard/settings'); }} className="w-full text-left px-4 py-2 text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors">
                    Settings
                  </button>
                  <button onClick={() => { setShow(false); handleLogout(); }} className="w-full text-left px-4 py-2 text-label-md text-error hover:bg-surface-container-high transition-colors">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
