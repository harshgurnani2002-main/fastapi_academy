import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TargetAudience() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Is this platform for you?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We don't teach Python basics. This curriculum is strictly engineered for developers who want to scale real-world distributed systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* For You */}
          <div className="bg-white rounded-2xl p-8 border border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">This is for you if...</h3>
            </div>
            <ul className="space-y-4">
              {[
                "You know basic FastAPI but struggle to structure large codebases.",
                "You want to understand the 'why' behind architectural tradeoffs.",
                "You need to implement robust authentication, caching, and background workers.",
                "You want to move from building 'hobby projects' to enterprise-grade systems.",
                "You want to pass senior backend engineering system design interviews."
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* NOT For You */}
          <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">This is NOT for you if...</h3>
            </div>
            <ul className="space-y-4">
              {[
                "You are completely new to programming or Python (learn basics first).",
                "You are looking for a quick 2-hour tutorial to copy-paste a web app.",
                "You don't want to learn DevOps, Docker, or database internals.",
                "You only care about frontend engineering or CSS.",
                "You want a platform that writes the code for you without explaining the underlying architecture."
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
