'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import CurriculumSidebar from './CurriculumSidebar';

export default function MobileSidebar() {
  const isOpen = useUIStore((state: any) => state.isMobileSidebarOpen);
  const closeSidebar = useUIStore((state: any) => state.closeMobileSidebar);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSidebar();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSidebar]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] lg:hidden"
          />
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl z-[101] lg:hidden flex flex-col focus:outline-none"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <Zap size={20} className="text-orange-500" />
                </div>
                <span className="font-bold text-lg text-slate-900">
                  FastAPI<span className="text-orange-500">Mastery</span>
                </span>
              </div>
              <button 
                ref={closeBtnRef}
                onClick={closeSidebar}
                aria-label="Close navigation menu"
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <CurriculumSidebar className="flex w-full h-full border-none" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

