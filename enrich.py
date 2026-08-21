import re

def enrich_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    for chapter in range(14, 26):
        chapter_str = str(chapter)
        # Find all mkLesson for this chapter
        # We need to replace exactly the first two occurrences
        pattern = re.compile(r"^\s*mkLesson\('(" + chapter_str + r"-\d{2})',\s*([^)]+)\),", re.MULTILINE)
        
        matches = list(pattern.finditer(content))
        if len(matches) < 2:
            print(f"Skipping chapter {chapter}, less than 2 lessons found")
            continue
            
        for i in range(2):
            match = matches[i]
            original_line = match.group(0)
            lesson_id = match.group(1)
            inner_content = match.group(2)
            
            # Count the leading spaces
            leading_spaces = len(original_line) - len(original_line.lstrip())
            indent = " " * leading_spaces
            
            c_id = f"c{lesson_id.replace('-', '_')}"
            s_id = f"s{lesson_id.replace('-', '_')}"
            
            replacement = (
                f"{indent}{{\n"
                f"{indent}  ...mkLesson('{lesson_id}', {inner_content}),\n"
                f"{indent}  challenges: [{{ id: \"{c_id}\", title: \"Challenge for {lesson_id}\", description: \"Implement a system design or coding challenge relevant to {lesson_id}.\", solution: \"Apply best practices.\" }}],\n"
                f"{indent}  realWorldScenarios: [{{ id: \"{s_id}\", scenario: \"Failure incident for {lesson_id}\", problem: \"A production failure occurred related to {lesson_id}.\", solution: \"Fixed by applying the concepts learned in this lesson.\" }}]\n"
                f"{indent}}},"
            )
            
            content = content.replace(original_line, replacement, 1)

    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    enrich_file("/home/harsh/fastapi-academy/src/lib/content/curriculum.ts")
