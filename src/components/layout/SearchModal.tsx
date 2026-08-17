'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Folder, Terminal, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/store/ui.store';
import { searchContent } from '@/lib/services/search.service';
import { SearchResult } from '@/lib/content/types';

export default function SearchModal() {
  const isOpen = useUIStore((state) => state.isSearchOpen);
  const closeSearch = useUIStore((state) => state.closeSearch);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results: SearchResult[] = query.trim().length > 1 
    ? searchContent(query)
    : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().openSearch();
      }
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex].slug);
    }
  };

  const handleSelect = (slug: string) => {
    router.push(slug);
    closeSearch();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-start justify-center pt-[10vh] px-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center px-4 py-4 border-b border-slate-100">
                <Search size={24} className="text-orange-500 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search lessons, chapters, topics..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={closeSearch}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {query.trim().length <= 1 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Terminal size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1} />
                    <p>Start typing to search 25 chapters and 220+ lessons...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <p>No results found for &quot;{query}&quot;</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase px-3 py-2">
                      Results ({results.length})
                    </h4>
                    {results.map((result, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={`${result.type}-${result.id}-${idx}`}
                          onClick={() => handleSelect(result.slug)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-orange-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              result.type === 'chapter' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {result.type === 'chapter' ? <Folder size={18} /> : <FileText size={18} />}
                            </div>
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-orange-700' : 'text-slate-900'}`}>
                                {result.title}
                              </p>
                              {result.chapterTitle && (
                                <p className="text-xs text-slate-500 mt-0.5">{result.chapterTitle}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {result.technologies && (
                              <div className="gap-1 hidden sm:flex">
                                {result.technologies.slice(0, 2).map((tech, i) => (
                                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                    {tech.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <ArrowRight size={16} className={isSelected ? 'text-orange-500' : 'text-transparent'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-sm">↑</kbd> <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-sm">↓</kbd> to navigate</span>
                  <span className="flex items-center gap-1"><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-sm">↵</kbd> to select</span>
                  <span className="flex items-center gap-1"><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-sm">esc</kbd> to close</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
