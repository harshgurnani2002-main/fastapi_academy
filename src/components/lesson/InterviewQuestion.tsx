'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DifficultyBadge from './DifficultyBadge';

interface InterviewQuestionProps {
  question: string;
  answer: string;
  difficulty: 'intermediate' | 'advanced' | 'expert' | 'production' | string;
}

export default function InterviewQuestion({
  question,
  answer,
  difficulty
}: InterviewQuestionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-6 border border-violet-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="p-5 border-b border-violet-100 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
              Interview Question
            </span>
            <DifficultyBadge difficulty={difficulty} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 leading-snug">
            {question}
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-shrink-0 mt-1 bg-violet-50 hover:bg-violet-100 text-violet-600 font-medium py-2 px-4 rounded-lg transition-colors border border-violet-200 text-sm flex items-center gap-2"
        >
          {isOpen ? 'Hide Answer' : 'Reveal Answer'}
          <svg 
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-violet-50/50">
              <h4 className="text-sm font-bold text-violet-800 mb-3 uppercase tracking-wider">Answer</h4>
              <div className="prose prose-slate max-w-none text-slate-700">
                <p className="leading-relaxed">{answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
