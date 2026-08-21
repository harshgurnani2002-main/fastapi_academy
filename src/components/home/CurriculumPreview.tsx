'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Book, ChevronRight, ArrowRight } from 'lucide-react'

import { curriculum } from '@/lib/content/curriculum'

export default function CurriculumPreview() {
  const [activeChapter, setActiveChapter] = useState<number | null>(null)

  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200 overflow-hidden" id="curriculum">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              The Complete Curriculum
            </h2>
            <p className="text-lg text-slate-600">
              A carefully structured path from advanced fundamentals to expert-level distributed systems engineering.
            </p>
          </div>
          <Link href="/curriculum" className="hidden md:inline-flex items-center text-orange-600 font-semibold hover:text-orange-700 transition-colors">
            View Full Syllabus <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Horizontal scrollable area */}
        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 gap-6 snap-x snap-mandatory hide-scrollbar">
          {curriculum.slice(0, 8).map((chapter) => (
            <div 
              key={chapter.id}
              className={`snap-start shrink-0 w-[300px] sm:w-[350px] bg-white rounded-xl border p-6 flex flex-col transition-all duration-300 cursor-pointer ${
                activeChapter === chapter.id 
                  ? 'border-orange-500 shadow-md transform -translate-y-2' 
                  : 'border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-md hover:-translate-y-1'
              }`}
              onMouseEnter={() => setActiveChapter(chapter.id)}
              onMouseLeave={() => setActiveChapter(null)}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-5xl font-bold text-orange-100 group-hover:text-orange-200">
                  {String(chapter.id).padStart(2, '0')}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  chapter.difficulty === 'expert' || chapter.difficulty === 'production' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {chapter.difficulty}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight line-clamp-2 h-14">
                {chapter.title}
              </h3>
              
              <div className="flex gap-4 mb-4 text-sm font-medium text-slate-500">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {chapter.estimatedHours}h</span>
                <span className="flex items-center"><Book className="w-4 h-4 mr-1" /> {chapter.lessons.length} lessons</span>
              </div>
              
              <p className="text-slate-600 text-sm mb-6 flex-grow line-clamp-3">
                {chapter.description}
              </p>
              
              <div className="mt-auto">
                <div className="flex flex-wrap gap-2 mb-4">
                  {chapter.technologies.slice(0, 3).map((tech) => (
                    <span key={tech.id} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {tech.name}
                    </span>
                  ))}
                  {chapter.technologies.length > 3 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-medium">
                      +{chapter.technologies.length - 3}
                    </span>
                  )}
                </div>
                <Link href={`/learn/${chapter.slug}`} className="text-orange-600 font-semibold text-sm flex items-center group">
                  Explore Chapter <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
          
          {/* View All Card */}
          {curriculum.length > 8 && (
            <div className="snap-start shrink-0 w-[300px] sm:w-[350px] bg-orange-50 rounded-xl border border-orange-200 p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{curriculum.length - 8} More Chapters</h3>
              <p className="text-slate-600 mb-6">Explore the full breadth of the curriculum.</p>
              <Link href="/curriculum" className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
                View Full Curriculum
              </Link>
            </div>
          )}
        </div>

        <div className="md:hidden mt-4 text-center">
          <Link href="/curriculum" className="inline-flex items-center text-orange-600 font-semibold hover:text-orange-700 transition-colors">
            View Full Syllabus <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      
      {/* CSS to hide scrollbar but keep functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  )
}
