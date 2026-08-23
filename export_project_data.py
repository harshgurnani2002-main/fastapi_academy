import os
import json
import zipfile

project_root = "projects/fastapi-starter-architecture"
slug = "fastapi-starter-architecture"

# 1. Collect all project files
project_files = {}
for root, dirs, files in os.walk(project_root):
    if ".venv" in root or "__pycache__" in root or ".pytest_cache" in root:
        continue
    for file in sorted(files):
        if file.endswith(".pyc"):
            continue
        rel_path = os.path.relpath(os.path.join(root, file), project_root)
        full_path = os.path.join(root, file)
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Determine language
        ext = os.path.splitext(file)[1].lower()
        lang = "python"
        if ext in [".json"]:
            lang = "json"
        elif ext in [".yml", ".yaml"]:
            lang = "yaml"
        elif ext in [".md"]:
            lang = "markdown"
        elif ext in [".toml", ".ini"]:
            lang = "toml"
        elif file.lower() in ["dockerfile", "makefile"]:
            lang = "dockerfile"
        elif ext in [".env", ".example"]:
            lang = "shell"
            
        project_files[rel_path] = {
            "code": content,
            "language": lang,
            "path": rel_path,
            "name": file
        }

print(f"Collected {len(project_files)} files.")

# 2. Generate zip in public/projects-dist/
dist_dir = "public/projects-dist"
os.makedirs(dist_dir, exist_ok=True)
zip_path = os.path.join(dist_dir, f"{slug}.zip")

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for rel_path, info in project_files.items():
        zipf.writestr(os.path.join(slug, rel_path), info["code"])

print(f"Generated zip file: {zip_path} ({os.path.getsize(zip_path)} bytes)")

# 3. Export to TypeScript file
ts_content = f"""// Auto-generated project files catalog
export interface ProjectFileInfo {{
  name: string;
  path: string;
  language: string;
  code: string;
}}

export interface ProjectData {{
  slug: string;
  title: string;
  chapterId: number;
  description: string;
  defaultFile: string;
  files: Record<string, ProjectFileInfo>;
  endpoints: {{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
    requestBody?: any;
    responseBody: any;
    status: number;
  }}[];
  tests: {{
    name: string;
    file: string;
    description: string;
    status: 'passed' | 'failed';
    duration: string;
  }}[];
}}

export const projectsCatalog: Record<string, ProjectData> = {{
  "{slug}": {{
    slug: "{slug}",
    title: "Production-Ready FastAPI Starter Architecture",
    chapterId: 1,
    description: "Production-ready FastAPI starter featuring Clean Architecture, Repository Pattern, Dependency Injection, Pydantic v2 Settings, and Async SQLAlchemy 2.0.",
    defaultFile: "src/main.py",
    files: {json.dumps(project_files, indent=2)},
    endpoints: [
      {{
        method: 'GET',
        path: '/api/v1/health',
        description: 'Liveness probe returning application health state and version',
        responseBody: {{
          status: 'healthy',
          timestamp: '2026-08-22T01:45:00.000Z',
          version: '1.0.0',
          environment: 'development'
        }},
        status: 200
      }},
      {{
        method: 'GET',
        path: '/api/v1/health/ready',
        description: 'Readiness probe verifying database connectivity and session health',
        responseBody: {{
          status: 'ready',
          timestamp: '2026-08-22T01:45:00.000Z',
          checks: {{
            database: 'connected'
          }}
        }},
        status: 200
      }},
      {{
        method: 'POST',
        path: '/api/v1/users',
        description: 'Register and create a new system user',
        requestBody: {{
          email: 'alice@example.com',
          username: 'alice',
          full_name: 'Alice Smith',
          password: 'strongPassword123'
        }},
        responseBody: {{
          success: true,
          message: 'User created successfully',
          data: {{
            id: 1,
            email: 'alice@example.com',
            username: 'alice',
            full_name: 'Alice Smith',
            is_active: true,
            is_superuser: false,
            created_at: '2026-08-22T01:45:10.123Z',
            updated_at: '2026-08-22T01:45:10.123Z'
          }}
        }},
        status: 201
      }},
      {{
        method: 'GET',
        path: '/api/v1/users',
        description: 'Retrieve paginated list of users',
        responseBody: {{
          success: true,
          message: 'Operation successful',
          data: {{
            items: [
              {{
                id: 1,
                email: 'alice@example.com',
                username: 'alice',
                full_name: 'Alice Smith',
                is_active: true,
                is_superuser: false,
                created_at: '2026-08-22T01:45:10.123Z',
                updated_at: '2026-08-22T01:45:10.123Z'
              }}
            ],
            total: 1,
            page: 1,
            size: 20,
            total_pages: 1
          }}
        }},
        status: 200
      }},
      {{
        method: 'POST',
        path: '/api/v1/items',
        description: 'Create an item assigned to an owner user',
        requestBody: {{
          title: 'FastAPI Production Handbook',
          description: 'Comprehensive guide to scaling FastAPI',
          price: 49.99,
          owner_id: 1,
          is_published: true
        }},
        responseBody: {{
          success: true,
          message: 'Item created successfully',
          data: {{
            id: 1,
            title: 'FastAPI Production Handbook',
            description: 'Comprehensive guide to scaling FastAPI',
            price: 49.99,
            owner_id: 1,
            is_published: true,
            created_at: '2026-08-22T01:45:15.456Z',
            updated_at: '2026-08-22T01:45:15.456Z'
          }}
        }},
        status: 201
      }},
      {{
        method: 'GET',
        path: '/api/v1/items?published_only=true',
        description: 'Filter and list published items',
        responseBody: {{
          success: true,
          message: 'Operation successful',
          data: {{
            items: [
              {{
                id: 1,
                title: 'FastAPI Production Handbook',
                description: 'Comprehensive guide to scaling FastAPI',
                price: 49.99,
                owner_id: 1,
                is_published: true,
                created_at: '2026-08-22T01:45:15.456Z',
                updated_at: '2026-08-22T01:45:15.456Z'
              }}
            ],
            total: 1,
            page: 1,
            size: 20,
            total_pages: 1
          }}
        }},
        status: 200
      }}
    ],
    tests: [
      {{
        name: "test_liveness_probe",
        file: "tests/test_health.py",
        description: "Verify liveness probe returns 200 OK and status healthy",
        status: "passed",
        duration: "0.02s"
      }},
      {{
        name: "test_readiness_probe",
        file: "tests/test_health.py",
        description: "Verify database connectivity via async SQL ping",
        status: "passed",
        duration: "0.03s"
      }},
      {{
        name: "test_create_user_success",
        file: "tests/test_users_api.py",
        description: "Verify user creation with password hashing and entity mapping",
        status: "passed",
        duration: "0.04s"
      }},
      {{
        name: "test_create_user_duplicate_email",
        file: "tests/test_users_api.py",
        description: "Verify 409 Conflict when creating existing email",
        status: "passed",
        duration: "0.03s"
      }},
      {{
        name: "test_get_user_by_id",
        file: "tests/test_users_api.py",
        description: "Verify retrieve user by ID and 404 response for unknown ID",
        status: "passed",
        duration: "0.03s"
      }},
      {{
        name: "test_list_users_pagination",
        file: "tests/test_users_api.py",
        description: "Verify paginated list with page and size parameters",
        status: "passed",
        duration: "0.04s"
      }},
      {{
        name: "test_update_and_delete_user",
        file: "tests/test_users_api.py",
        description: "Verify profile update and cascade delete",
        status: "passed",
        duration: "0.04s"
      }},
      {{
        name: "test_create_item_success",
        file: "tests/test_items_api.py",
        description: "Verify item creation with owner relationship",
        status: "passed",
        duration: "0.03s"
      }},
      {{
        name: "test_create_item_nonexistent_owner",
        file: "tests/test_items_api.py",
        description: "Verify 404 when item owner does not exist in database",
        status: "passed",
        duration: "0.02s"
      }},
      {{
        name: "test_list_items_and_filtering",
        file: "tests/test_items_api.py",
        description: "Verify item filtering by published status flag",
        status: "passed",
        duration: "0.03s"
      }},
      {{
        name: "test_update_and_delete_item",
        file: "tests/test_items_api.py",
        description: "Verify item price update and delete operation",
        status: "passed",
        duration: "0.03s"
      }},
      {{
        name: "test_user_service_create_conflict",
        file: "tests/test_services.py",
        description: "Unit test UserService conflict raising with AsyncMock repo",
        status: "passed",
        duration: "0.01s"
      }},
      {{
        name: "test_correlation_id_and_process_time_headers",
        file: "tests/test_middleware.py",
        description: "Verify ASGI middleware injects X-Correlation-ID and X-Process-Time",
        status: "passed",
        duration: "0.02s"
      }}
    ]
  }}
}};
"""

with open("src/lib/content/projectsData.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Wrote src/lib/content/projectsData.ts")
