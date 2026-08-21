import json

with open('projects_to_replace.json', 'r') as f:
    projects = json.load(f)

# Sort descending by StartLine so line numbers don't shift
projects.sort(key=lambda x: x["StartLine"], reverse=True)

import sys
batch = int(sys.argv[1]) if len(sys.argv) > 1 else 0

start_idx = batch * 5
end_idx = start_idx + 5

calls = ""
for p in projects[start_idx:end_idx]:
    call = f"""<tool_call>
{{"name": "default_api:replace_file_content", "arguments": {{"TargetFile": "/home/harsh/fastapi-academy/src/lib/content/curriculum.ts", "Instruction": "Enrich project", "Description": "Add missing project metadata", "AllowMultiple": False, "TargetContent": {json.dumps(p['TargetContent'])}, "ReplacementContent": {json.dumps(p['ReplacementContent'])}, "StartLine": {p['StartLine']}, "EndLine": {p['EndLine']}, "toolSummary": "Update project", "toolAction": "Replacing content"}}}}
</tool_call>"""
    calls += call + "\n"

print(calls)
