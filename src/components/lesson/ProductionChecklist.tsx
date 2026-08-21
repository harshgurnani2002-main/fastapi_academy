'use client'

import React from 'react';
import { ClipboardCheck, CheckSquare, AlertCircle } from 'lucide-react';

interface ChecklistProps {
  items: {
    id: string;
    category: string;
    item: string;
    isRequired: boolean;
  }[];
}

export default function ProductionChecklist({ items }: ChecklistProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center">
        <ClipboardCheck className="w-5 h-5 text-purple-500 mr-3" />
        <h3 className="text-lg font-bold text-slate-900">Production Checklist</h3>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start p-3 bg-slate-50/50 border border-slate-100 rounded-lg group hover:border-slate-300 transition-colors">
              <CheckSquare className="w-5 h-5 text-slate-300 group-hover:text-purple-500 mr-3 shrink-0" />
              <div className="flex-1">
                <span className="text-slate-700 text-sm leading-relaxed block">{item.item}</span>
                <div className="flex items-center mt-1 space-x-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.category}</span>
                  {item.isRequired && (
                    <span className="flex items-center text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3 mr-1" /> Required
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
