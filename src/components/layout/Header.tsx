'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, Zap, User, LayoutDashboard, Bookmark, FileText, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';

const NAV_LINKS = [
  { name: 'Learn', href: '/learn' },
  { name: 'Curriculum', href: '/curriculum' },
  { name: 'Projects', href: '/projects' },
  { name: 'Roadmap', href: '/roadmap' },
  { name: 'Labs', href: '/labs' },
  { name: 'Technologies', href: '/technologies' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const toggleMobileSidebar = useUIStore((state: any) => state.toggleMobileSidebar);
  const openSearch = useUIStore((state: any) => state.openSearch);
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-200 bg-white/80 backdrop-blur-md border-b ${
        scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-orange-100 p-1.5 rounded-lg group-hover:bg-orange-500 transition-colors">
                <Zap size={20} className="text-orange-500 group-hover:text-white transition-colors" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                FastAPI<span className="text-orange-500">Mastery</span>
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                    isActive ? 'text-orange-500' : 'text-slate-600'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={openSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <Search size={16} />
              <span>Search...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-xs font-mono bg-white border border-slate-300 rounded text-slate-500">
                ⌘K
              </kbd>
            </button>
            
            <button 
              onClick={openSearch}
              className="sm:hidden p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg"
            >
              <Search size={20} />
            </button>

            {isAuthenticated && (
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                    <User size={16} />
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 py-1">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">Developer</p>
                        <p className="text-xs text-slate-500 truncate">dev@fastapimastery.com</p>
                      </div>
                      <div className="py-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-500">
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link href="/dashboard/bookmarks" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-500">
                          <Bookmark size={16} /> Bookmarks
                        </Link>
                        <Link href="/dashboard/notes" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-500">
                          <FileText size={16} /> Notes
                        </Link>
                      </div>
                      <div className="py-1 border-t border-slate-100">
                        <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
