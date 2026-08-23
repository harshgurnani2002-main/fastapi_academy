import json
import os
import sys

from scratch_gen_batch1 import export_chapter_ts

# Load curriculum summary to get exact lesson metadata
with open('/tmp/curriculum_summary.json') as f:
    summary = json.load(f)

meta_by_ch = {c['id']: {l['slug']: l for l in c['lessons']} for c in summary}

# Deep technical content database for all chapters
from build_batch_1 import make_rich_lesson

# We will define comprehensive content generators for each chapter
def generate_all():
    print("Starting full curriculum compilation for 25 chapters...")

    # Load Chapter 1 specialized lessons
    import generate_batch_1
    print("Batch 1 (Ch 1-5) compiled.")

if __name__ == "__main__":
    generate_all()
