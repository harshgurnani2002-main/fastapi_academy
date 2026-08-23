import sys
import os
import json
from scratch_gen_batch1 import export_chapter_ts
from build_batch_1 import make_rich_lesson
from generate_batch_2 import build_chapter

with open('/tmp/curriculum_summary.json') as f:
    summary = json.load(f)

meta_by_ch = {c['id']: {l['slug']: l for l in c['lessons']} for c in summary}

print("Generating Chapters 11-25...")

# Batch 3: Chapters 11-15
build_chapter(11, "ch11Lessons", "src/lib/content/lessons/ch11-lessons.ts")
build_chapter(12, "ch12Lessons", "src/lib/content/lessons/ch12-lessons.ts")
build_chapter(13, "ch13Lessons", "src/lib/content/lessons/ch13-lessons.ts")
build_chapter(14, "ch14Lessons", "src/lib/content/lessons/ch14-lessons.ts")
build_chapter(15, "ch15Lessons", "src/lib/content/lessons/ch15-lessons.ts")
print("Batch 3 (Ch 11-15) generated.")

# Batch 4: Chapters 16-20
build_chapter(16, "ch16Lessons", "src/lib/content/lessons/ch16-lessons.ts")
build_chapter(17, "ch17Lessons", "src/lib/content/lessons/ch17-lessons.ts")
build_chapter(18, "ch18Lessons", "src/lib/content/lessons/ch18-lessons.ts")
build_chapter(19, "ch19Lessons", "src/lib/content/lessons/ch19-lessons.ts")
build_chapter(20, "ch20Lessons", "src/lib/content/lessons/ch20-lessons.ts")
print("Batch 4 (Ch 16-20) generated.")

# Batch 5: Chapters 21-25
build_chapter(21, "ch21Lessons", "src/lib/content/lessons/ch21-lessons.ts")
build_chapter(22, "ch22Lessons", "src/lib/content/lessons/ch22-lessons.ts")
build_chapter(23, "ch23Lessons", "src/lib/content/lessons/ch23-lessons.ts")
build_chapter(24, "ch24Lessons", "src/lib/content/lessons/ch24-lessons.ts")
build_chapter(25, "ch25Lessons", "src/lib/content/lessons/ch25-lessons.ts")
print("Batch 5 (Ch 21-25) generated.")

print("All chapters 11-25 compiled successfully.")
