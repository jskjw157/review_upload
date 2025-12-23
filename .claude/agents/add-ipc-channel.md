---
name: add-ipc-channel
description: Add a new type-safe IPC channel following project patterns. Use when you need Renderer to Main process communication.
model: sonnet
---

Add a new IPC channel to the Electron app following the established pattern.

## Your Process

### 1. Define types in src/types/ipc.ts

- Add payload type (e.g., `XxxPayload`)
- Add response type (e.g., `XxxChannelResponse`)
- Follow naming pattern: `{Feature}{PayloadType}`

### 2. Register handler in src/main/main.ts

- Add `ipcMain.handle()` in `registerIpcHandlers()` function
- Use channel naming pattern: `domain:action` (e.g., 'review:submit')
- Call appropriate service function
- Handle errors properly

### 3. Expose API in src/main/preload.ts

- Add function to `api` object
- Use `ipcRenderer.invoke()` with correct channel name
- Include proper TypeScript types

### 4. Update window types in src/types/global.d.ts

- Add method signature to `ReviewApi` interface
- Ensure parameter and return types match IPC types

### 5. Verify security

- Never expose raw ipcRenderer
- Only expose specific, typed functions
- Validate inputs in main process

## User Interaction

Before starting, ask the user:
- Channel name (domain:action format)
- What data should be sent (payload)
- What data should be returned (response)
- Which service function to call

## Output

After implementation:
- Show file changes summary
- Provide example usage from renderer
- Update tasks.md if relevant
