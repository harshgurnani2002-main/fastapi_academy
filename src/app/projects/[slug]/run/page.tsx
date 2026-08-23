import { notFound } from 'next/navigation';
import { curriculum } from '@/lib/content/curriculum';
import { projectsCatalog } from '@/lib/content/projectsData';
import { WebProjectRunner } from '@/components/projects/WebProjectRunner';

export async function generateStaticParams() {
  const projects = curriculum.map(c => c.project).filter(Boolean);
  return projects.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = curriculum.find(c => c.project?.slug === slug)?.project;
  return {
    title: `${project?.title || 'Project'} — Web Runner & FastAPI Docs | FastAPI Academy`,
    description: `Run ${project?.title || 'FastAPI project'} live in browser with interactive Swagger UI and API tester.`,
  };
}

export default async function ProjectRunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const chapter = curriculum.find(c => c.project?.slug === slug);
  const project = chapter?.project;

  if (!project) return notFound();

  const studioData = projectsCatalog[slug];
  if (!studioData) return notFound();

  const zipDownloadUrl = `/projects-dist/${project.slug}.zip`;

  return (
    <WebProjectRunner projectData={studioData} zipUrl={zipDownloadUrl} />
  );
}
