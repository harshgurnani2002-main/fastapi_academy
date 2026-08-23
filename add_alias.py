with open("export_all_projects.py", "r") as f:
    code = f.read()

# Make sure if a slug alias exists, it's also mapped
alias_code = '''
if "production-auth-platform" in all_projects_data:
    all_projects_data["auth-security-gateway"] = dict(all_projects_data["production-auth-platform"])
    all_projects_data["auth-security-gateway"]["slug"] = "auth-security-gateway"
'''

if 'all_projects_data["auth-security-gateway"]' not in code:
    code = code.replace('ts_content = f"""// Auto-generated project files catalog', alias_code + '\nts_content = f"""// Auto-generated project files catalog')
    with open("export_all_projects.py", "w") as f:
        f.write(code)

