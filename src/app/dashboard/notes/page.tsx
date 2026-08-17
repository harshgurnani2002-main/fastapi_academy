'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock hook for demonstration
const useProgressStore = () => ({
  notes: [
    { id: 1, lessonTitle: 'Pydantic Models In-Depth', content: 'Always use model_validate instead of parse_obj in Pydantic v2. Field(default_factory=...) is super useful for lists and dicts to avoid mutable defaults.', updatedAt: '2 days ago' },
    { id: 2, lessonTitle: 'Dependency Injection Fundamentals', content: 'Yield dependencies are great for DB sessions. Remember that exceptions raised after yield are tricky to handle, better to handle them in exception handlers or middleware.', updatedAt: '1 week ago' }
  ],
  updateNote: (id: number, content: string) => { /* mock */ },
  deleteNote: (id: number) => { /* mock */ }
});

export default function NotesPage() {
  const { notes, updateNote, deleteNote } = useProgressStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEditClick = (id: number, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const handleSave = (id: number) => {
    updateNote(id, editContent);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-800 pb-6 gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-300 flex items-center mb-4 transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
            <p className="text-neutral-400 mt-1">Your personal knowledge base built while learning.</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg text-sm text-neutral-400">
            {notes.length} Notes Captured
          </div>
        </header>

        {notes.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/30 border border-neutral-800/50 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="text-xl font-medium text-neutral-300 mb-2">Your notebook is empty</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">Take notes during lessons to reinforce your learning. They will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {notes.map(note => (
              <div key={note.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
                <div className="px-5 py-3 bg-neutral-900/50 border-b border-neutral-800 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 className="font-medium text-neutral-200">{note.lessonTitle}</h3>
                  </div>
                  <span className="text-xs text-neutral-500">{note.updatedAt}</span>
                </div>
                
                <div className="p-5 flex-grow">
                  {editingId === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-neutral-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[100px] font-mono leading-relaxed"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSave(note.id)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleEditClick(note.id, note.content)}
                      className="cursor-pointer group relative"
                    >
                      <div className="absolute inset-0 bg-neutral-800/0 group-hover:bg-neutral-800/30 rounded transition-colors -m-2 p-2"></div>
                      <p className="text-neutral-400 text-sm whitespace-pre-wrap leading-relaxed relative z-10 font-mono">
                        {note.content}
                      </p>
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">Click to edit</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="px-5 py-3 bg-neutral-950/50 border-t border-neutral-800 flex justify-end">
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="flex items-center text-xs text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Note
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
