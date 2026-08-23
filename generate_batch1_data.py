import json
import os
import sys

# We create detailed, comprehensive lesson generators for Chapters 1-5
# Let's import our export helper
from scratch_gen_batch1 import export_chapter_ts

# Load curriculum summary to verify IDs and Slugs
with open('/tmp/curriculum_summary.json') as f:
    summary = json.load(f)

chapters_meta = {c['id']: c for c in summary}

print("Loaded curriculum meta for Batch 1.")
