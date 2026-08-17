import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChapter } from '@/lib/services/search.service';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  return {
    title: chapter ? `${chapter.title} | FastAPI Mastery` : 'Chapter | FastAPI Mastery',
    description: chapter?.description,
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  
  if (!chapter) return notFound();

  const firstLessonSlug = chapter.lessons.length > 0 ? chapter.lessons[0].slug : '';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Chapter Header */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm">
              Chapter {String(chapter.id).padStart(2, '0')}
            </span>
            <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {chapter.estimatedHours} Hours
            </span>
            <span className={`font-bold px-3 py-1 rounded-full text-sm uppercase ${
              chapter.difficulty === 'intermediate' ? 'bg-green-100 text-green-700' :
              chapter.difficulty === 'advanced' ? 'bg-blue-100 text-blue-700' :
              chapter.difficulty === 'expert' ? 'bg-purple-100 text-purple-700' :
              'bg-red-100 text-red-700'
            }`}>
              {chapter.difficulty}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            {chapter.title}
          </h1>
          
          <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-3xl">
            {chapter.longDescription || chapter.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {chapter.technologies.map(tech => (
              <span key={tech.id} className={`px-3 py-1 rounded-md text-sm font-medium ${tech.color} ${tech.textColor}`}>
                {tech.iconEmoji ? `${tech.iconEmoji} ` : ''}{tech.name}
              </span>
            ))}
          </div>
          
          {firstLessonSlug && (
            <Link 
              href={`/learn/${chapter.slug}/${firstLessonSlug}`}
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-orange-500/20 text-lg"
            >
              Start Chapter
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
          )}
        </div>

        {/* Topics Grid */}
        {chapter.topics.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">What You'll Learn</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {chapter.topics.map((topic, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="font-medium text-slate-800">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lesson List */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Lessons ({chapter.lessons.length})
          </h2>
          <div className="space-y-4">
            {chapter.lessons.map((lesson, i) => (
              <Link 
                key={lesson.id} 
                href={`/learn/${chapter.slug}/${lesson.slug}`}
                className="group block bg-white p-6 rounded-2xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center flex-shrink-0 text-lg group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                          {lesson.duration}m
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                          lesson.difficulty === 'intermediate' ? 'bg-green-100 text-green-700' :
                          lesson.difficulty === 'advanced' ? 'bg-blue-100 text-blue-700' :
                          lesson.difficulty === 'expert' ? 'bg-purple-100 text-purple-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {lesson.difficulty.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Project Card */}
        {chapter.project && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 md:p-12 border-2 border-orange-200 relative overflow-hidden text-slate-900 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="relative z-10">
              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                Chapter Project
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {chapter.project.title}
              </h2>
              <p className="text-slate-600 text-lg mb-6 max-w-2xl">
                {chapter.project.description}
              </p>

              {chapter.project.architecture && (
                <div className="bg-slate-100 p-4 rounded-xl font-mono text-sm text-orange-700 mb-6 max-w-lg border border-slate-200">
                  <pre className="whitespace-pre-wrap">{chapter.project.architecture}</pre>
                </div>
              )}

              <Link 
                href="/projects"
                className="inline-flex items-center justify-center bg-slate-900 text-white hover:bg-orange-500 font-bold py-3 px-6 rounded-xl transition-colors"
              >
                View in Projects Gallery
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
