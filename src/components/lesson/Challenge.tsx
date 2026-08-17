'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodeBlock from './CodeBlock';

interface CodeExample {
  code: string;
  language?: string;
  filename?: string;
}

interface ChallengeProps {
  id: string;
  title: string;
  description: string;
  hint?: string;
  solution: string;
  solutionCode?: CodeExample;
}

export default function Challenge({
  id,
  title,
  description,
  hint,
  solution,
  solutionCode
}: ChallengeProps) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div className="my-8 rounded-xl border border-indigo-200 overflow-hidden shadow-md bg-white">
      <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <h3 className="text-xl font-bold m-0">Challenge: {title}</h3>
        </div>
        {isCompleted && (
          <span className="bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Completed
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="prose prose-indigo max-w-none mb-6">
          <p className="text-slate-700 text-lg leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
            >
              💡 {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          )}
          
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 ml-auto"
          >
            {showSolution ? 'Hide Solution' : 'Reveal Solution'}
          </button>
        </div>

        <AnimatePresence>
          {showHint && hint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
                <span className="font-bold mr-2">Hint:</span>
                {hint}
              </div>
            </motion.div>
          )}

          {showSolution && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-indigo-100 pt-6 mt-2">
                <h4 className="text-lg font-bold text-slate-800 mb-3">Solution</h4>
                <div className="prose prose-slate max-w-none mb-4">
                  <p className="text-slate-700">{solution}</p>
                </div>
                
                {solutionCode && (
                  <CodeBlock 
                    code={solutionCode.code} 
                    language={solutionCode.language} 
                    filename={solutionCode.filename} 
                  />
                )}
                
                {!isCompleted && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setIsCompleted(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Mark as Complete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
