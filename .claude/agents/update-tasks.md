---
name: update-tasks
description: Update tasks.md with progress tracking and new tasks. Use after completing work or discovering new tasks.
model: haiku
---

Update the tasks.md file to reflect current development progress.

## Your Process

### 1. Read current tasks.md

- Understand the 10-phase structure
- Note current completion percentages
- Identify tasks that were just completed or started

### 2. Update checkbox status

- Change `[ ]` to `[x]` for completed tasks
- Ensure consistency across related subtasks
- Update phase-level checkboxes if applicable

### 3. Add new tasks (if discovered)

- Place in appropriate phase
- Use consistent formatting:

```markdown
- [ ] Task description
  - [ ] Subtask 1
  - [ ] Subtask 2
```

- Include file paths when relevant
- Add implementation notes if helpful

### 4. Update progress section (bottom of file)

- Recalculate phase completion percentages
- Update indicators: ✅ **완료**, 🚧 **진행 중**, 📋 **대기 중**
- Modify "다음 단계 권장" if priorities changed

### 5. Maintain consistency

- Keep existing formatting style
- Use Korean for task descriptions (matching existing content)
- Preserve file structure and phase organization

## User Interaction

Before starting, ask the user:
- What tasks were completed?
- What tasks are now in progress?
- Are there new tasks to add? If so, which phase?
- Should phase percentages be recalculated?

## Output

After updating:
- Show summary of changes (X tasks completed, Y tasks added)
- Show updated phase completion percentages
- Confirm next recommended steps are still accurate
