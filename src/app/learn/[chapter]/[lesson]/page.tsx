import React from 'react';
import { notFound } from 'next/navigation';
import { getLesson, getChapter } from '@/lib/services/search.service';

import LessonHeader from '@/components/lesson/LessonHeader';
import CodeBlock from '@/components/lesson/CodeBlock';
import ProductionNote from '@/components/lesson/ProductionNote';
import RealWorldScenario from '@/components/lesson/RealWorldScenario';
import InterviewQuestion from '@/components/lesson/InterviewQuestion';
import CommonMistake from '@/components/lesson/CommonMistake';
import Challenge from '@/components/lesson/Challenge';
import LessonNavigation from '@/components/lesson/LessonNavigation';
import BookmarkButton from '@/components/lesson/BookmarkButton';
import CurriculumSidebar from '@/components/layout/CurriculumSidebar';
import TableOfContents from '@/components/layout/TableOfContents';
import LabView from '@/components/lesson/LabView';
import SystemDesignView from '@/components/lesson/SystemDesignView';
import ProductionChecklist from '@/components/lesson/ProductionChecklist';
import MultiFileCodeViewer from '@/components/lesson/MultiFileCodeViewer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(chapterSlug, lessonSlug);
  const chapter = getChapter(chapterSlug);
  return {
    title: lesson
      ? `${lesson.title} | ${chapter?.title} | FastAPI Mastery`
      : 'Lesson | FastAPI Mastery',
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;

  const chapter = getChapter(chapterSlug);
  const lesson = getLesson(chapterSlug, lessonSlug);

  if (!chapter || !lesson) return notFound();

  const lessonIndex = chapter.lessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson = lessonIndex > 0 ? chapter.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < chapter.lessons.length - 1
      ? chapter.lessons[lessonIndex + 1]
      : null;

  const tocSections = [
    ...lesson.sections.map((s) => ({ id: s.id, title: s.title, level: 1 })),
    ...(lesson.codeExamples.length > 0
      ? [{ id: 'implementation', title: 'Implementation', level: 1 }]
      : []),
    ...(lesson.productionNotes.length > 0
      ? [{ id: 'production-notes', title: 'Production Notes', level: 1 }]
      : []),
    ...(lesson.realWorldScenarios.length > 0
      ? [{ id: 'real-world', title: 'Real-World Scenarios', level: 1 }]
      : []),
    ...(lesson.commonMistakes.length > 0
      ? [{ id: 'common-mistakes', title: 'Common Mistakes', level: 1 }]
      : []),
    ...(lesson.interviewQuestions.length > 0
      ? [{ id: 'interview-questions', title: 'Interview Questions', level: 1 }]
      : []),
    ...(lesson.challenges.length > 0
      ? [{ id: 'challenges', title: 'Challenges', level: 1 }]
      : []),
    ...(lesson.systemDesign
      ? [{ id: 'system-design', title: 'System Design Trade-offs', level: 1 }]
      : []),
    ...(lesson.labs && lesson.labs.length > 0
      ? [{ id: 'labs', title: 'Engineering Labs', level: 1 }]
      : []),
    ...(lesson.productionChecklist && lesson.productionChecklist.length > 0
      ? [{ id: 'production-checklist', title: 'Production Checklist', level: 1 }]
      : []),
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
        <CurriculumSidebar
          currentChapterId={chapter.id}
          currentLessonId={lesson.id}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <LessonHeader lesson={lesson} chapter={chapter} />
            <BookmarkButton lessonId={lesson.id} />
          </div>

          {/* Lesson Sections */}
          {lesson.sections.map((section) => (
            <div key={section.id} id={section.id} className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {section.title}
              </h2>
              <div className="prose prose-slate max-w-none mb-4">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
              {section.codeExample && (
                <CodeBlock
                  code={section.codeExample.code || ''}
                  language={section.codeExample.language || 'text'}
                  filename={section.codeExample.filename}
                  title={section.codeExample.title}
                  showLineNumbers
                />
              )}
            </div>
          ))}

          {/* Standalone Code Examples */}
          {lesson.codeExamples.length > 0 && (
            <section id="implementation" className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Implementation
              </h2>
              {lesson.codeExamples.map((ex) => (
                ex.files ? (
                  <MultiFileCodeViewer key={ex.id} example={ex} />
                ) : (
                  <CodeBlock
                    key={ex.id}
                    code={ex.code || ''}
                    language={ex.language || 'text'}
                    title={ex.title}
                    filename={ex.filename}
                    showLineNumbers
                  />
                )
              ))}
            </section>
          )}

          {/* Production Notes */}
          {lesson.productionNotes.length > 0 && (
            <section id="production-notes" className="mb-10">
              {lesson.productionNotes.map((note) => (
                <ProductionNote
                  key={note.id}
                  content={note.content}
                  severity={note.severity}
                />
              ))}
            </section>
          )}

          {/* Real World Scenarios */}
          {lesson.realWorldScenarios.length > 0 && (
            <section id="real-world" className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Real-World Scenarios
              </h2>
              {lesson.realWorldScenarios.map((scenario) => (
                <RealWorldScenario
                  key={scenario.id}
                  scenario={scenario.scenario}
                  problem={scenario.problem}
                  solution={scenario.solution}
                />
              ))}
            </section>
          )}

          {/* Common Mistakes (Minimal Note) */}
          {lesson.commonMistakes.length > 0 && (
            <section id="common-mistakes" className="mb-10">
              <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-5">
                <h4 className="text-amber-800 font-bold mb-2 flex items-center text-sm">
                  <span className="w-4 h-4 mr-2 inline-flex items-center justify-center bg-amber-200 text-amber-700 rounded-full text-xs font-bold">!</span>
                  Common Pitfalls
                </h4>
                <ul className="list-disc pl-8 space-y-1 text-amber-900/80 text-sm">
                  {lesson.commonMistakes.map((mistake) => (
                    <li key={mistake.id}>
                      <strong className="font-semibold text-amber-900">{mistake.title}:</strong> {mistake.description}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Interview Questions */}
          {lesson.interviewQuestions.length > 0 && (
            <section id="interview-questions" className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Interview Questions
              </h2>
              {lesson.interviewQuestions.map((q) => (
                <InterviewQuestion
                  key={q.id}
                  question={q.question}
                  answer={q.answer}
                  difficulty={q.difficulty}
                />
              ))}
            </section>
          )}

          {/* Challenges */}
          {lesson.challenges.length > 0 && (
            <section id="challenges" className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Challenges
              </h2>
              {lesson.challenges.map((challenge) => (
                <Challenge
                  key={challenge.id}
                  id={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  hint={challenge.hint}
                  solution={challenge.solution}
                  solutionCode={challenge.solutionCode}
                />
              ))}
            </section>
          )}

          {/* System Design */}
          {lesson.systemDesign && (
            <section id="system-design" className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                System Design Trade-offs
              </h2>
              <SystemDesignView design={lesson.systemDesign} />
            </section>
          )}

          {/* Labs */}
          {lesson.labs && lesson.labs.length > 0 && (
            <section id="labs" className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Engineering Labs
              </h2>
              {lesson.labs.map((lab) => (
                <LabView key={lab.id} lab={lab} />
              ))}
            </section>
          )}

          {/* Production Checklist */}
          {lesson.productionChecklist && lesson.productionChecklist.length > 0 && (
            <section id="production-checklist" className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Launch Checklist
              </h2>
              <ProductionChecklist items={lesson.productionChecklist} />
            </section>
          )}

          {/* Navigation */}
          <LessonNavigation
            prev={
              prevLesson
                ? {
                    title: prevLesson.title,
                    slug: `/learn/${chapter.slug}/${prevLesson.slug}`,
                    chapterTitle: chapter.title,
                  }
                : undefined
            }
            next={
              nextLesson
                ? {
                    title: nextLesson.title,
                    slug: `/learn/${chapter.slug}/${nextLesson.slug}`,
                    chapterTitle: chapter.title,
                  }
                : undefined
            }
            lessonId={lesson.id}
          />
        </div>
      </main>

      {/* Right TOC */}
      <aside className="hidden xl:flex flex-col w-56 flex-shrink-0 border-l border-slate-200 bg-white sticky top-0">
        <TableOfContents sections={tocSections} />
      </aside>
    </div>
  );
}
