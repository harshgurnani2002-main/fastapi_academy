'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import CurriculumSidebar from './CurriculumSidebar';

export default function MobileSidebar() {
  const isOpen = useUIStore((state: any) => state.isMobileSidebarOpen);
  const closeSidebar = useUIStore((state: any) => state.closeMobileSidebar);
  const pathname = usePathname();

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] lg:hidden"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl z-[101] lg:hidden flex flex-col"
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
                onClick={closeSidebar}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
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
