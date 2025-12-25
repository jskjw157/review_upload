---
description: Auto-detect project technologies and fetch appropriate rules
---

# Workflow: Setup Project Rules

## Command: /setup-rules

## Steps

### 1. Detect Technologies
// turbo
Scan project files for dependencies:
```bash
# Check package.json for JS/TS projects
cat package.json | jq '.dependencies, .devDependencies'

# Check requirements.txt for Python projects  
cat requirements.txt 2>/dev/null || echo "No Python deps"

# Check go.mod for Go projects
cat go.mod 2>/dev/null || echo "No Go deps"
```

### 2. Map Dependencies to Technologies
Common mappings:
| Dependency | Technology |
|------------|------------|
| react | react |
| next | nextjs |
| typescript | typescript |
| tailwindcss | tailwind |
| @tanstack/react-query | react-query |
| fastapi | fastapi |
| django | django |

### 3. Fetch Rules (Parallel)
For each detected technology:
// turbo
```
read_url_content(url="https://antigravity.codes/rules/{tech}")
```

### 4. Combine Rules
- Merge all fetched rules into single document
- Remove duplicate rules
- Organize by category:
  - Code Style
  - Architecture  
  - Testing
  - Documentation

### 5. Save Combined Rules
// turbo
```
write_to_file(
  TargetFile=".agent/rules/auto-generated.md",
  CodeContent={combined_rules}
)
```

### 6. Present to User
```
�� Auto-setup complete!

Detected:
- ⚛️  React 18
- 📘 TypeScript 5
- 🎨 Tailwind CSS

Fetched rules:
✅ React best practices (2.1KB)
✅ TypeScript conventions (1.8KB)
✅ Tailwind utilities (1.2KB)

Combined rules saved to: .agent/rules/auto-generated.md

Would you like to review? [Yes/No]
```

## Fallback Strategy
If antigravity.codes not available:
1. Use docfork to fetch official docs for each technology
2. Extract best practices from documentation
3. Generate rules based on common patterns

## Maintenance
Re-generate rules when:
- New dependencies added (package.json changes)
- Major framework upgrade detected
- User explicitly requests: "update rules"
