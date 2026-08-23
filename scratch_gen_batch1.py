import json
import os

def export_chapter_ts(ch_num, var_name, lessons_dict, out_path):
    def serialize_obj(obj, indent=2):
        ind = " " * indent
        if obj is None:
            return "undefined"
        if isinstance(obj, str):
            if "\n" in obj or '`' in obj or '"' in obj:
                escaped = obj.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
                return f"`{escaped}`"
            else:
                escaped = obj.replace('\\', '\\\\').replace('"', '\\"')
                return f'"{escaped}"'
        elif isinstance(obj, bool):
            return "true" if obj else "false"
        elif isinstance(obj, (int, float)):
            return str(obj)
        elif isinstance(obj, list):
            if not obj:
                return "[]"
            items = []
            for item in obj:
                if isinstance(item, str) and item in ["fastapi", "python", "postgresql", "sqlalchemy", "redis", "celery", "docker", "kubernetes", "nginx", "prometheus", "grafana", "opentelemetry", "github_actions", "jenkins", "pydantic", "alembic", "websockets", "jwt", "oauth2", "pytest", "rabbitmq", "starlette"]:
                    items.append(f"technologies.{item}")
                else:
                    items.append(serialize_obj(item, indent + 2))
            if len(items) <= 3 and all("\n" not in it for it in items):
                return f"[{', '.join(items)}]"
            return f"[\n{ind}  " + f",\n{ind}  ".join(items) + f"\n{ind}]"
        elif isinstance(obj, dict):
            if not obj:
                return "{}"
            lines = []
            for k, v in obj.items():
                if v is None:
                    continue  # Omit undefined keys
                val_str = serialize_obj(v, indent + 2)
                key_str = f"'{k}'" if ("-" in k or " " in k or "/" in k or "." in k or k[0].isdigit()) else k
                lines.append(f"{ind}  {key_str}: {val_str}")
            return f"{{\n" + ",\n".join(lines) + f"\n{ind}}}"
        return "undefined"

    code = "import { Lesson } from '../types';\nimport { technologies } from '../technologies';\n\n"
    code += f"export const {var_name}: Record<string, Lesson> = {{\n"
    for slug, lesson in lessons_dict.items():
        code += f"  '{slug}': {serialize_obj(lesson, 2)},\n"
    code += "};\n"

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Generated {out_path} with {len(lessons_dict)} lessons.")

print("Updated batch1 generator helper (handles None properly).")
