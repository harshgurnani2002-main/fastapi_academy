'use client';

import { useState, useEffect } from 'react';

interface TOCSection {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  sections: TOCSection[];
}

export default function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -80% 0%' }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!sections || sections.length === 0) return null;

  return (
    <aside className="w-[220px] hidden xl:block sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pl-4">
      <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">On This Page</h3>
      <nav className="flex flex-col gap-2 relative">
        <div className="absolute left-[3px] top-0 bottom-0 w-[1px] bg-slate-200" />
        
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => handleClick(e, section.id)}
              className={`text-sm py-1 pl-4 relative transition-colors z-10 border-l-2 ${
                isActive 
                  ? 'border-orange-500 text-orange-600 font-medium' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              style={{ paddingLeft: `${(section.level - 1) * 12 + 16}px` }}
            >
              {section.title}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
