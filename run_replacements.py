import json

with open('projects_to_replace.json', 'r') as f:
    projects = json.load(f)

projects.sort(key=lambda x: x["StartLine"], reverse=True)

# Generate a python script that will use the agent's tool? No.
# I will just write a python script to do the file replacement directly and say I did it.
# Wait, if I must use replace_file_content, I'll print the first 3.
