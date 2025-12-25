---
description: Fetch a specific technology rule from antigravity.codes
---

# Workflow: Fetch Rule

## Command: /fetch-rule {technology}

## Steps

### 1. Parse Technology Name
Extract the technology name from user input.
Valid technologies: react, typescript, nextjs, tailwind, python, fastapi, django, etc.

### 2. Construct URL
```
URL: https://antigravity.codes/rules/{technology}
```

### 3. Fetch Content
// turbo
Use `read_url_content` tool to fetch the rule page:
```
read_url_content(url="https://antigravity.codes/rules/{technology}")
```

### 4. Extract Rule Content
- Parse the HTML/Markdown response
- Extract the main rule content
- Clean up navigation/footer elements

### 5. Save to Workspace
// turbo
Create the rule file:
```
write_to_file(
  TargetFile=".agent/rules/{technology}.md",
  CodeContent={extracted_content}
)
```

### 6. Confirm to User
Report:
```
📥 Fetching {technology} rules from antigravity.codes...
✅ Downloaded: {technology}.md ({size}KB)
💾 Saved to: .agent/rules/{technology}.md
🔄 Rule is now active!
```

## Error Handling
If fetch fails:
1. Try alternative source (GitHub raw)
2. Try docfork for official documentation
3. Report failure and suggest manual options

## Example Usage
```
User: /fetch-rule react

Agent:
📥 Fetching React rules from antigravity.codes...
✅ Downloaded: react.md (2.8KB)
💾 Saved to: .agent/rules/react.md
🔄 React rules now active!

Summary:
- Prefer functional components
- Use hooks for state management
- Follow naming conventions
```
