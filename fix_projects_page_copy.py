with open("src/app/projects/page.tsx", "r") as f:
    text = f.read()

text = text.replace("12 production-grade backend engineering projects.", "25 production-grade backend engineering projects.")
text = text.replace("12 Production Projects", "25 Production Projects")

with open("src/app/projects/page.tsx", "w") as f:
    f.write(text)

print("Updated src/app/projects/page.tsx to 25 Production Projects.")
