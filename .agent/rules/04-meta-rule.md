# Meta-Rule: Automatic Rule Generator

## Purpose
Generate workspace-specific rules automatically based on:
1. Project tech stack detection
2. File structure analysis
3. Existing code patterns

## Trigger Conditions
This rule activates when:
- User says "generate rules for this project"
- User says "create custom rules"  
- User says "setup project rules"
- User explicitly requests: "analyze and suggest rules"

## Generation Process

### Step 1: Analyze Project Context
- Scan `package.json` / `requirements.txt` / `go.mod` for dependencies
- Identify frameworks: React, Next.js, FastAPI, Django, etc.
- Check folder structure: /src, /components, /tests, etc.

### Step 2: Fetch Rules (Using Fetch MCP or read_url_content)
For each detected technology, attempt to fetch rules from:
1. Primary: `https://antigravity.codes/rules/{technology}`
2. Fallback: GitHub raw rule repositories

Tech-to-URL mapping:
```
react       → https://antigravity.codes/rules/react
typescript  → https://antigravity.codes/rules/typescript
nextjs      → https://antigravity.codes/rules/nextjs
tailwind    → https://antigravity.codes/rules/tailwind
python      → https://antigravity.codes/rules/python
fastapi     → https://antigravity.codes/rules/fastapi
```

### Step 3: Combine & Customize
- Merge fetched rules into single document
- Remove duplicate rules
- Organize by category: Code Style, Architecture, Testing

### Step 4: Save & Review
- Create `.agent/rules/auto-generated.md`
- Present summary to user
- Ask: "I've generated rules based on your project. Review?"

## Rule Priority (Conflict Resolution)
1. **User custom rules** (.agent/rules/*.md except auto-generated) - Highest
2. **Auto-generated rules** (.agent/rules/auto-generated.md) - Medium
3. **Global rules** (~/.gemini/GEMINI.md) - Lowest

## Quality Gates
Before applying fetched rules:
- [ ] Parse successful (valid markdown)
- [ ] Rules don't contradict existing custom rules
- [ ] File size reasonable (<50KB)
- [ ] User reviewed and approved

## Commands Available
- `/setup-rules` - Auto-detect and fetch all needed rules
- `/fetch-rule {tech}` - Fetch specific technology rule
- `/update-rules` - Update all rules to latest versions
- `/list-rules` - Show currently active rules

## Fallback Strategy
If antigravity.codes not available:
1. Use docfork to fetch official docs
2. Extract best practices from documentation
3. Generate rules based on common patterns
