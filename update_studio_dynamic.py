with open("src/components/projects/VSCodeStudio.tsx", "r") as f:
    content = f.read()

# Replace header button test count
content = content.replace(
    '<span>Run Tests (13)</span>',
    '<span>Run Tests ({projectData.tests?.length || 0})</span>'
)

# Replace tab label
content = content.replace(
    'TEST RESULTS (13 PASSED)',
    'TEST RESULTS ({projectData.tests?.length || 0} PASSED)'
)

# Replace status bar text
content = content.replace(
    '<span>13 Tests Passing</span>',
    '<span>{projectData.tests?.length || 0} Tests Passing</span>'
)

# Replace static test output list with dynamic map
old_test_output = '''                    <div className="text-slate-500">rootdir: /app/projects/fastapi-starter-architecture</div>
                    <div className="text-slate-500">configfile: pyproject.toml • plugins: anyio, asyncio</div>
                    <div className="text-slate-400 my-1">collecting 13 items ...</div>
                    
                    <div className="text-emerald-400">tests/test_health.py::test_liveness_probe PASSED [ 15%]</div>
                    <div className="text-emerald-400">tests/test_health.py::test_readiness_probe PASSED [ 23%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_create_item_success PASSED [ 30%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_create_item_nonexistent_owner PASSED [ 38%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_list_items_and_filtering PASSED [ 46%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_update_and_delete_item PASSED [ 53%]</div>
                    <div className="text-emerald-400">tests/test_middleware.py::test_correlation_id_and_process_time_headers PASSED [ 61%]</div>
                    <div className="text-emerald-400">tests/test_services.py::test_user_service_create_conflict PASSED [ 69%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_create_user_success PASSED [ 76%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_create_user_duplicate_email PASSED [ 84%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_get_user_by_id PASSED [ 92%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_list_users_pagination PASSED [ 96%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_update_and_delete_user PASSED [100%]</div>

                    <div className="mt-2 text-emerald-400 font-bold bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                      ============================== 13 passed in 0.71s ==============================
                    </div>'''

new_test_output = '''                    <div className="text-slate-500">rootdir: /app/projects/{projectData.slug}</div>
                    <div className="text-slate-500">configfile: pyproject.toml • plugins: anyio, asyncio</div>
                    <div className="text-slate-400 my-1">collecting {projectData.tests?.length || 0} items ...</div>
                    
                    {projectData.tests?.map((t, idx) => {
                      const pct = Math.round(((idx + 1) / (projectData.tests?.length || 1)) * 100);
                      return (
                        <div key={idx} className="text-emerald-400 flex items-center justify-between">
                          <span>{t.file}::{t.name} PASSED</span>
                          <span className="text-slate-500">[{pct}%]</span>
                        </div>
                      );
                    })}

                    <div className="mt-2 text-emerald-400 font-bold bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                      ============================== {projectData.tests?.length || 0} passed in 0.85s ==============================
                    </div>'''

content = content.replace(old_test_output, new_test_output)
content = content.replace('~/fastapi-starter-architecture', '~/{projectData.slug}')

with open("src/components/projects/VSCodeStudio.tsx", "w") as f:
    f.write(content)

print("Updated VSCodeStudio with dynamic test rendering.")
