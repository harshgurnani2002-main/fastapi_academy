# Project Instructions

## Core Rules

- Inspect only files relevant to the current task.
- Never read the entire repository unless explicitly requested.
- Never inspect node_modules, .venv, __pycache__, dist, build, coverage, .git, or generated files.
- Prefer targeted search with rg over reading entire files.
- Prefer targeted tests over the entire test suite.
- Make the smallest change necessary.
- Do not refactor unrelated code.
- Do not modify APIs, schemas, or database structure unless required.
- Do not repeat information already established in the conversation.

## Context Efficiency

Before using a tool:
1. Determine the smallest query that can answer the question.
2. Avoid large command outputs.
3. Pipe large output through head, tail, grep, rg, awk, or summaries.
4. Never dump entire logs into context.
5. Never dump entire files when a relevant range is sufficient.

## Coding Workflow

1. Understand the task.
2. Locate relevant files.
3. Inspect only required code.
4. Make the smallest change.
5. Run targeted validation.
6. Fix failures.
7. Report only the important result.

## Output

Be concise.
Do not explain obvious implementation details.
Do not repeat the user's request.
Do not provide long summaries unless requested.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
