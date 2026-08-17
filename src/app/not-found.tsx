import React from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Glowing 404 */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-orange-600/30 blur-3xl rounded-full"></div>
          <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 relative z-10">
            404
          </h1>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-100">This endpoint doesn't exist.</h2>
          <p className="text-neutral-400">The route you requested could not be found in our router.</p>
        </div>

        {/* Code Snippet */}
        <div className="mx-auto max-w-md bg-[#161b22] rounded-xl border border-neutral-800 text-left overflow-hidden shadow-2xl">
          <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center space-x-2 text-xs text-neutral-500 font-mono">
            <span className="text-red-400">●</span>
            <span className="text-yellow-400">●</span>
            <span className="text-green-400">●</span>
            <span className="ml-2">Response</span>
          </div>
          <div className="p-4">
            <pre className="text-sm font-mono text-neutral-300">
              <span className="text-neutral-500">HTTP 404 Not Found</span><br/>
              {'{'}<br/>
              &nbsp;&nbsp;<span className="text-green-400">"detail"</span>: <span className="text-yellow-300">"Route not found"</span><br/>
              {'}'}
            </pre>
          </div>
        </div>

        <div className="pt-6">
          <Link href="/" className="inline-flex items-center justify-center px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/20">
            Return to Home
          </Link>
        </div>

        <div className="pt-12 border-t border-neutral-800">
          <p className="text-sm text-neutral-500 mb-4 uppercase tracking-widest font-medium">Suggested Endpoints</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/curriculum" className="text-neutral-400 hover:text-orange-400 transition-colors text-sm">Curriculum</Link>
            <span className="text-neutral-800">•</span>
            <Link href="/roadmap" className="text-neutral-400 hover:text-orange-400 transition-colors text-sm">Roadmap</Link>
            <span className="text-neutral-800">•</span>
            <Link href="/projects" className="text-neutral-400 hover:text-orange-400 transition-colors text-sm">Projects</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
