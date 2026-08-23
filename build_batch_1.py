import json
import os
from scratch_gen_batch1 import export_chapter_ts

with open('/tmp/curriculum_summary.json') as f:
    summary = json.load(f)

meta_by_ch = {c['id']: {l['slug']: l for l in c['lessons']} for c in summary}

# ==============================================================================
# Helper to construct a complete, rich, production-grade Lesson object
# ==============================================================================
def make_rich_lesson(
    ch_id, slug,
    sections,
    code_examples=None,
    challenges=None,
    interview_questions=None,
    production_notes=None,
    real_world_scenarios=None,
    common_mistakes=None,
    system_design=None,
    labs=None,
    production_checklist=None,
    prerequisites=None
):
    meta = meta_by_ch[ch_id][slug]
    return {
        "id": meta["id"],
        "slug": slug,
        "chapterId": ch_id,
        "order": meta["order"],
        "title": meta["title"],
        "description": meta.get("description", f"Production deep dive into {meta['title']}"),
        "duration": 45,
        "difficulty": meta["difficulty"],
        "technologies": meta["techs"],
        "prerequisites": prerequisites or [],
        "objectives": [
            f"Understand internal mechanics and architecture of {meta['title']}",
            f"Implement production-grade patterns with full type safety and error handling",
            f"Diagnose runtime failure modes, edge cases, and performance bottlenecks",
            f"Test and validate behavior under concurrent real-world production workloads"
        ],
        "sections": sections,
        "codeExamples": code_examples or [],
        "challenges": challenges or [],
        "interviewQuestions": interview_questions or [],
        "productionNotes": production_notes or [],
        "realWorldScenarios": real_world_scenarios or [],
        "commonMistakes": common_mistakes or [],
        "systemDesign": system_design,
        "labs": labs or [],
        "productionChecklist": production_checklist or []
    }

print("Batch 1 builder framework initialized.")
