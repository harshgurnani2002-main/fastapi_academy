'use client';

import { useState } from 'react';
import { Chapter } from '@/lib/content/types';
import { ChapterCard } from './ChapterCard';
import { CurriculumFilters, DifficultyFilter } from './CurriculumFilters';
import { useProgressStore } from '@/store/progress.store';
import { Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export function CurriculumList({ initialData }: { initialData: Chapter[] }) {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [search, setSearch] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const completedLessons = useProgressStore((state) => state.completedLessons);
  const exportProgress = useProgressStore((state) => state.exportProgress);
  const importProgress = useProgressStore((state) => state.importProgress);

  const filteredData = initialData.filter((chapter) => {
    const matchDiff = difficulty === 'all' || chapter.difficulty === difficulty;
    const matchSearch =
      chapter.title.toLowerCase().includes(search.toLowerCase()) ||
      chapter.description.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchSearch;
  });

  const handleExport = () => {
    const jsonStr = exportProgress();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fastapi-academy-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importProgress(importText);
    if (ok) {
      setSyncStatus({ success: true, message: 'Progress imported successfully!' });
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncStatus(null);
        setImportText('');
      }, 1200);
    } else {
      setSyncStatus({ success: false, message: 'Invalid progress JSON format.' });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <CurriculumFilters
          currentDifficulty={difficulty}
          onDifficultyChange={setDifficulty}
          searchQuery={search}
          onSearchChange={setSearch}
        />
        <div className="flex items-center gap-2 self-end sm:self-auto mb-6 sm:mb-0">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            title="Export completed progress to JSON"
          >
            <Download size={14} className="text-orange-500" />
            Export Progress
          </button>
          <button
            onClick={() => setShowSyncModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            title="Import progress from JSON"
          >
            <Upload size={14} className="text-orange-500" />
            Import Progress
          </button>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Import Progress JSON</h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste your exported JSON progress backup below to restore your completed lessons.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"version": 1, "completedLessons": ["..."]}'
              rows={6}
              className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 bg-slate-50"
            />
            {syncStatus && (
              <div
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold mb-4 ${
                  syncStatus.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {syncStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {syncStatus.message}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncStatus(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm"
              >
                Apply Import
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredData.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <p className="text-xl font-medium">No chapters found matching your filters.</p>
          <button
            onClick={() => {
              setDifficulty('all');
              setSearch('');
            }}
            className="mt-4 text-orange-500 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((chapter) => {
            const completedCount = chapter.lessons.filter(
              (l) => completedLessons.includes(l.id) || completedLessons.includes(l.slug)
            ).length;
            const progress =
              chapter.lessons.length > 0
                ? Math.round((completedCount / chapter.lessons.length) * 100)
                : 0;

            return <ChapterCard key={chapter.id} chapter={chapter} progress={progress} />;
          })}
        </div>
      )}
    </div>
  );
}

