import re

file_path = '/home/harsh/fastapi-academy/src/lib/content/curriculum.ts'
with open(file_path, 'r') as f:
    content = f.read()

# We want to find the project block and append the fields before its closing brace.
# A project block looks like:
#     project: {
#       id: '...',
#       ...
#     },

def replacer(match):
    project_content = match.group(1)
    # Check if we already have prerequisites
    if 'prerequisites:' in project_content:
        return match.group(0)
    
    insertion = """
      prerequisites: ['Basic FastAPI', 'Docker installed'],
      milestones: ['Setup project structure', 'Implement auth middleware', 'Deploy to AWS'],
      deploymentRequirements: ['PostgreSQL instance', 'Redis cache', '2GB RAM'],"""
    
    # Insert before the last newline and brace
    parts = project_content.rsplit('\n    }', 1)
    if len(parts) == 2:
        new_project_content = parts[0] + insertion + '\n    }'
        return 'project: {' + new_project_content + '},'
    return match.group(0)

new_content = re.sub(r'project:\s*\{((?:[^{}]|\{[^{}]*\})*)\},', replacer, content)

with open(file_path, 'w') as f:
    f.write(new_content)

print("Done")
