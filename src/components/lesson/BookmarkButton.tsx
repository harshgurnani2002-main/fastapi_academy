'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function BookmarkButton({ lessonId }: { lessonId: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <button
      onClick={() => setIsBookmarked(!isBookmarked)}
      className="p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <motion.div
        animate={isBookmarked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg 
          className={`w-6 h-6 transition-colors ${isBookmarked ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`} 
          fill={isBookmarked ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
        </svg>
      </motion.div>
    </button>
  );
}
