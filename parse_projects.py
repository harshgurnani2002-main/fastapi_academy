import re
import json

with open('/home/harsh/fastapi-academy/src/lib/content/curriculum.ts', 'r') as f:
    lines = f.readlines()

projects = []
in_project = False
start_line = 0
project_lines = []

for i, line in enumerate(lines):
    if 'project: {' in line:
        in_project = True
        start_line = i + 1
        project_lines = [line]
    elif in_project:
        project_lines.append(line)
        # Assuming project ends with "    }," or similar indentation
        if line.strip() == '},' and line.startswith('    }'):
            end_line = i + 1
            target_content = "".join(project_lines)
            
            # Create replacement content
            insertion = """      prerequisites: ['Basic FastAPI', 'Docker installed'],
      milestones: ['Setup project structure', 'Implement auth middleware', 'Deploy to AWS'],
      deploymentRequirements: ['PostgreSQL instance', 'Redis cache', '2GB RAM'],\n"""
            
            # insert before the last line "    },"
            replacement_content = "".join(project_lines[:-1]) + insertion + project_lines[-1]
            
            projects.append({
                "StartLine": start_line,
                "EndLine": end_line,
                "TargetContent": target_content,
                "ReplacementContent": replacement_content
            })
            in_project = False

with open('projects_to_replace.json', 'w') as f:
    json.dump(projects, f, indent=2)

print(f"Found {len(projects)} projects")
