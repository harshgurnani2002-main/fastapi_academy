import HeroSection from '@/components/home/HeroSection'
import WhySection from '@/components/home/WhySection'
import PhilosophySection from '@/components/home/PhilosophySection'
import CurriculumPreview from '@/components/home/CurriculumPreview'
import ProjectsSection from '@/components/home/ProjectsSection'
import SkillsSection from '@/components/home/SkillsSection'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 selection:bg-orange-200 selection:text-orange-900">
      <HeroSection />
      <WhySection />
      <CurriculumPreview />
      <PhilosophySection />
      <ProjectsSection />
      <SkillsSection />
      
      {/* Simple Footer Placeholder */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} FastAPI Mastery. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
