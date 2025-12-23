---
name: add-ui-component
description: Add a new React component using shadcn/ui and project conventions. Use when adding UI elements or widgets.
model: sonnet
---

Add a new React component following project UI patterns.

## Your Process

### 1. Component structure

- Create file in `src/renderer/components/` (or `src/renderer/components/ui/` for shadcn)
- Use TypeScript with proper prop types interface
- Export as named export (not default unless it's a page)
- Use functional component with hooks

### 2. Styling with Tailwind CSS

- Use utility classes from Tailwind
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Follow existing component spacing/sizing patterns
- Respect responsive design (use lg:, md:, sm: breakpoints)

### 3. Use shadcn/ui components

- Import from `@/components/ui/*` using path alias
- Available components: Button, Card, Input, Label, Select, Tabs, Textarea
- Check `src/renderer/components/ui/` for installed components
- If needed component not installed, inform user how to add it

### 4. Connect to hooks (if interactive)

- Use `useAuth` from `@/hooks/useAuth` for auth state
- Use `useReview` from `@/hooks/useReview` for review operations
- Create new custom hook if logic is complex

### 5. Handle loading and error states

- Show loading spinner/skeleton during async operations
- Display error messages clearly (red text or alert)
- Disable buttons during submission (with `disabled` prop)

### 6. Form validation (if applicable)

- Client-side validation for UX
- Show inline error messages
- Prevent submission if invalid

### 7. IPC communication (if needed)

- Use `window.reviewApi.*` methods (typed in global.d.ts)
- Handle promises properly (async/await)
- Update UI based on response

## User Interaction

Before starting, ask the user:
- Component name and purpose
- Props interface (what data it receives)
- State requirements (what data it manages)
- User interactions (buttons, forms, etc.)
- Where it will be used (which parent component)

## Output

After implementation:
- Show how to import and use the component
- Provide example props
- Update parent component if needed
- Update tasks.md if relevant
