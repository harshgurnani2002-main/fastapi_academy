import React from 'react';
import CodeBlock from './CodeBlock';

interface CodeExample {
  code: string;
  language?: string;
  filename?: string;
}

interface CommonMistakeProps {
  title: string;
  description: string;
  badCode?: CodeExample;
  goodCode?: CodeExample;
}

export default function CommonMistake({
  title,
  description,
  badCode,
  goodCode
}: CommonMistakeProps) {
  return (
    <div className="my-8 rounded-r-xl border-l-4 border-red-500 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="text-lg font-bold text-red-900 mb-1">Common Mistake: {title}</h3>
          <p className="text-red-800 leading-relaxed text-sm">{description}</p>
        </div>
      </div>

      {(badCode || goodCode) && (
        <div className="mt-6 space-y-6">
          {badCode && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-red-700 font-semibold text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Don't do this
              </div>
              <div className="border border-red-300 rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none z-10"></div>
                <CodeBlock 
                  code={badCode.code} 
                  language={badCode.language} 
                  filename={badCode.filename} 
                />
              </div>
            </div>
          )}

          {goodCode && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-green-700 font-semibold text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Do this instead
              </div>
              <div className="border border-green-300 rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-green-500/5 pointer-events-none z-10"></div>
                <CodeBlock 
                  code={goodCode.code} 
                  language={goodCode.language} 
                  filename={goodCode.filename} 
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
