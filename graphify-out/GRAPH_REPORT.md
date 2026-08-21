# Graph Report - fastapi-academy  (2026-08-22)

## Corpus Check
- 106 files · ~230,197 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 446 nodes · 620 edges · 51 communities (31 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bed9c5e8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `technologies` - 28 edges
2. `Lesson` - 28 edges
3. `compilerOptions` - 16 edges
4. `40. Build Strategy` - 11 edges
5. `curriculum` - 9 edges
6. `getChapter()` - 8 edges
7. `useUIStore` - 7 edges
8. `Project Instructions` - 6 edges
9. `5. Homepage Sections` - 6 edges
10. `17. Technology Explorer` - 6 edges

## Surprising Connections (you probably didn't know these)
- `FastAPI Academy` --conceptually_related_to--> `Project Goal`  [INFERRED]
  README.md → goal.md
- `Claude Guidelines` --conceptually_related_to--> `Project Agents Rules`  [INFERRED]
  CLAUDE.md → AGENTS.md
- `Project Agents Rules` --references--> `Graphify Rules`  [EXTRACTED]
  AGENTS.md → .agents/rules/graphify.md
- `generateMetadata()` --calls--> `getChapter()`  [EXTRACTED]
  src/app/learn/[chapter]/page.tsx → src/lib/services/search.service.ts
- `ChapterPage()` --calls--> `getChapter()`  [EXTRACTED]
  src/app/learn/[chapter]/page.tsx → src/lib/services/search.service.ts

## Import Cycles
- None detected.

## Communities (51 total, 20 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (47): techList, technologies, Challenge, CommonMistake, FailureScenario, InterviewQuestion, Lesson, LessonSection (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (24): ChapterPage(), generateMetadata(), CodeExample, Lab, SystemDesign, TableOfContentsProps, TOCSection, ChallengeProps (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (19): HomePage(), curriculum, getCurriculumStats(), HeroSectionProps, steps, projects, skillGroups, reasons (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (30): dependencies, framer-motion, fuse.js, lucide-react, next, next-themes, @radix-ui/react-dialog, @radix-ui/react-tooltip (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (9): inter, metadata, Header(), NAV_LINKS, MobileSidebar(), AuthState, useAuthStore, UIState (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (8): Chapter, Difficulty, ChapterCard(), CurriculumFilters(), DifficultyFilter, FiltersProps, CurriculumList(), metadata

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (57): 12. Progress System, 13. Chapter Navigation, 14. Search, 15. Roadmap Page, 16. Projects Page, 18. Difficulty System, 1. Core Product Vision, 21. "Interview Question" Component (+49 more)

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (3): colorMap, roadmapData, RoadmapNode

### Community 10 - "Community 10"
Cohesion: 0.50
Nodes (4): Project Agents Rules, Claude Guidelines, Graphify Rules, Graphify Workflows

### Community 11 - "Community 11"
Cohesion: 0.83
Nodes (3): DashboardPage(), useAuthStore(), useProgressStore()

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (11): 40. Build Strategy, Phase 1, Phase 10, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6 (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): Coding Workflow, Context Efficiency, Core Rules, graphify, Output, Project Instructions

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (6): 17. Technology Explorer, Backend, Database, DevOps, Infrastructure, Observability

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (6): 5. Homepage Sections, Curriculum Preview, Learning Philosophy, Projects, Skills You'll Gain, Why this course?

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (4): 10. Architecture Diagrams, Cache architecture, Celery architecture, OAuth flow

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (4): 23. Learning Modes, Build, Learn, Review

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): 4. Main Pages, Hero, Home

## Knowledge Gaps
- **207 isolated node(s):** `$schema`, `plugin`, `@opencode-ai/plugin`, `eslintConfig`, `nextConfig` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `curriculum` connect `Community 2` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `40. Build Strategy` connect `Community 35` to `Community 8`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `useUIStore` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `@opencode-ai/plugin` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0715950715950716 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05142857142857143 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.052244897959183675 - nodes in this community are weakly interconnected._