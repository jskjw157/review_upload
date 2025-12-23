# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cafe24 Local Review Manager** - Desktop app for automating Cafe24 shopping mall review uploads/management using Electron + React + TypeScript.

- **Target Platforms:** macOS and Windows
- **Stack:** Electron (main + renderer processes), React 19, TypeScript, Vite, Tailwind CSS + shadcn/ui
- **Purpose:** Local OAuth authentication flow, single/bulk review upload, upload history tracking

## Development Commands

### Running the App

```bash
# Development mode (with hot reload)
npm run dev
# Runs renderer dev server (vite) + electron with ts-node

# Production build + run
npm run build  # Builds both renderer and main process
npm run start  # Runs the built app

# Individual dev commands (usually not needed)
npm run dev:renderer  # Renderer only (port 5173)
npm run dev:electron  # Electron only (requires renderer running)
```

### Build Outputs

- **Main Process:** `dist-electron/main.js`
- **Renderer:** `dist/` (static HTML/CSS/JS)
- Development uses ts-node to run TypeScript directly

### Important Development Notes

- **Node.js Version:** v20 LTS or higher (required for Electron Forge + Vite)
- **Package Manager:** npm (use `package-lock.json`)
- Hot reload works for renderer changes; main process changes require restart
- DevTools open automatically in development mode

## Architecture

### Electron Multi-Process Model

```
┌─────────────────────────────────────────────────────────┐
│ Main Process (Node.js)           src/main/             │
│ ├─ main.ts              Entry point, window management │
│ ├─ preload.ts           IPC bridge (contextBridge)     │
│ └─ services/                                            │
│    ├─ auth.ts           OAuth 2.0 token management     │
│    └─ review.ts         Cafe24 API calls               │
└─────────────────────────────────────────────────────────┘
                          ↕ IPC Communication
┌─────────────────────────────────────────────────────────┐
│ Renderer Process (Browser)       src/renderer/         │
│ ├─ App.tsx              Main React component           │
│ ├─ components/          UI components (shadcn/ui)      │
│ ├─ hooks/                                               │
│ │  ├─ useAuth.ts       Auth state & login flow        │
│ │  └─ useReview.ts     Review submission logic        │
│ └─ lib/                 Utilities & mock services      │
└─────────────────────────────────────────────────────────┘
```

### IPC Communication Pattern

**Critical:** Always use typed IPC channels defined in `src/types/ipc.ts`

```typescript
// Main Process: src/main/main.ts
ipcMain.handle('auth:exchange', (_, payload: AuthCodePayload) => ...)
ipcMain.handle('review:submit', (_, payload: ReviewRequestPayload) => ...)

// Preload Bridge: src/main/preload.ts
contextBridge.exposeInMainWorld('reviewApi', {
  exchangeAuthCode: (payload) => ipcRenderer.invoke('auth:exchange', payload),
  submitReview: (payload) => ipcRenderer.invoke('review:submit', payload),
})

// Renderer: Access via window.reviewApi
const result = await window.reviewApi.submitReview({ input, config })
```

### Security Configuration

- `contextIsolation: true` - Renderer cannot access Node.js APIs directly
- `nodeIntegration: false` (implicit) - No direct Node in renderer
- Preload script is the ONLY bridge between processes
- Only expose minimal, typed APIs through contextBridge

### OAuth Flow Architecture

1. **User initiates login** → Renderer calls `window.reviewApi.exchangeAuthCode()`
2. **Main process** → Makes OAuth token exchange request to Cafe24 API
3. **Token storage** → Encrypted using `electron.safeStorage` (if available)
4. **Token file location** → `app.getPath('userData')/cafe24-oauth.json`
5. **Auto-refresh** → Services call `getValidAccessToken()` which auto-refreshes if expired (60s skew)

### Review Upload Flow

**Single Review:**
- Renderer form → `window.reviewApi.submitReview()` → Main process validates token → POST to `/admin/products/{id}/reviews`

**Bulk Upload:**
- Renderer file input → Convert to ArrayBuffer → `window.reviewApi.uploadBulk()` → Main process creates FormData → POST to `/admin/product-reviews/bulk`

## Cafe24 API Integration

### Authentication (OAuth 2.0)

```typescript
// Token endpoint
https://{mallId}.cafe24api.com/api/v2/oauth/token

// Authorization flow
1. Get authorization code (via browser redirect)
2. Exchange code for access_token + refresh_token
3. Store tokens locally (encrypted if possible)
4. Auto-refresh when expired (handled in getValidAccessToken)
```

### API Request Headers

```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {access_token}'
}
```

### Rate Limits

- **Admin API:** 5 requests/second
- Always check `X-Api-Call-Limit` response header
- Implement retry logic for 429 (Too Many Requests)

### Error Handling Pattern

All service functions return standardized response:

```typescript
interface ReviewServiceResponse {
  success: boolean
  message: string
  historyEntry?: HistoryEntry
  needsReauth?: boolean      // Token expired, need re-login
  errorCode?: ReviewErrorCode
}
```

**401 Handling:** Automatically attempt token refresh once, then return `needsReauth: true`

## Code Conventions

### TypeScript Strictness

- `strict: true` enabled
- Avoid `any` types
- Define shared types in `src/types/`
- Use discriminated unions for IPC responses

### IPC Channel Naming

**Pattern:** `domain:action`

```typescript
✅ 'auth:exchange', 'auth:refresh', 'review:submit', 'review:bulk'
❌ 'doAuth', 'SUBMIT_REVIEW', 'handle-review'
```

### File Organization

```
src/
├── main/                   # Main process (Node.js context)
│   ├── main.ts            # App lifecycle, window, IPC registration
│   ├── preload.ts         # contextBridge API definitions
│   └── services/          # Business logic (auth, API calls)
├── renderer/              # Renderer process (browser context)
│   ├── App.tsx           # Root component
│   ├── components/       # React components (shadcn/ui based)
│   ├── hooks/            # React hooks (useAuth, useReview)
│   └── lib/              # Utilities, mock APIs
└── types/                # Shared TypeScript types
    ├── global.d.ts       # window.reviewApi type definitions
    ├── ipc.ts            # IPC payload/response types
    └── review.ts         # Domain types (ReviewInput, etc.)
```

### Import Path Alias

- `@/*` resolves to `src/renderer/*` (configured in tsconfig.json + vite.config.ts)
- Use for renderer code only: `import { Button } from '@/components/ui/button'`

### Component Structure

- Uses **shadcn/ui** components in `src/renderer/components/ui/`
- Styling with **Tailwind CSS** (configured via `tailwind.config.cjs`)
- Custom components in `src/renderer/components/`

### Error Handling

1. **Service Layer** (main process): Return `{ success: false, message, errorCode }`
2. **React Hooks**: Update state with error message
3. **UI**: Display error message to user (via `message` prop)
4. **Token Expiry**: Set `needsReauth: true` → Trigger re-login flow

## Important Implementation Rules

### Task Management

**CRITICAL:** Always check and update `tasks.md` before starting any development work.

- `tasks.md` contains the complete development roadmap from initial setup to deployment
- Before implementing any feature, review the relevant phase in tasks.md
- Update task completion status (✅, 🚧, 📋) as you work
- Add new discovered tasks or subtasks to the appropriate phase
- Keep the "현재 진행 상황" (Current Progress) section up-to-date

This ensures:
- No duplicate work
- Consistent progress tracking
- Alignment with project roadmap
- Clear visibility of what's done/pending

### Agent Usage (Proactive)

**IMPORTANT:** Proactively use agents from `.claude/agents/` when appropriate.

**Available Agents:**

| Agent | Model | Purpose | Use When |
|-------|-------|---------|----------|
| `/check-auth` | haiku | Diagnose auth issues | Login fails or API returns 401 |
| `/update-tasks` | haiku | Track task progress | Work completed or new tasks discovered |
| `/build-and-test` | haiku | Build, lint, test automation | Pre-commit checks, CI/CD, build verification |
| `/add-ipc-channel` | sonnet | Create IPC communication | Need Renderer ↔ Main process channel |
| `/add-ui-component` | sonnet | Add React components | Creating UI elements with shadcn/ui |
| `/add-cafe24-endpoint` | sonnet | Integrate Cafe24 API | Adding new Cafe24 API calls |
| `/create-agent` | opus | Design new agents | Need to automate new repetitive pattern |

**Model Selection Rationale:**
- **haiku** - Diagnostic/inspection tasks (fast, cost-efficient)
- **sonnet** - Code generation with multi-file coordination (balanced capability)
- **opus** - Meta-level design decisions (meta-agent creating new agents)

**When to create new agents:**
- Use `/create-agent` when you notice a **repetitive pattern** (3+ similar tasks)
- Examples of when to auto-create agents:
  - "I've added 3 similar service functions" → Create `add-service-function` agent
  - "I keep writing the same error handling" → Create `add-error-handler` agent
  - "Testing follows the same pattern" → Create `add-test-file` agent

**Decision Flow:**
1. Before starting a task, check the table above for available agents
2. If no agent exists but task is repetitive, use `/create-agent` first (uses `opus` for optimal agent design)
3. Then use the new agent for current and future similar tasks

**Benefits:**
- Consistent patterns across codebase
- Optimized model selection (speed/capability/cost tradeoff)
- Knowledge captured for future use
- Reduced errors from manual repetition

### Security

- **Never expose full `ipcRenderer` to renderer** - Only specific functions via contextBridge
- **Never execute user input directly** - All file/API operations in main process only
- **Token storage** - Use `safeStorage.encryptString()` when available
- **Input validation** - Validate in both renderer (UX) and main (security)

### Performance

- **Window creation** - Use `show: false` + `ready-to-show` event to prevent flicker
- **Large file uploads** - Pass ArrayBuffer (not base64) via IPC
- **Memory leaks** - Remove IPC listeners in React cleanup (`useEffect` return)

### Cafe24 API Best Practices

- **Always check token expiry** before API calls (use `getValidAccessToken()`)
- **Retry logic** for 401: Refresh token once, then fail gracefully
- **Rate limiting** - Respect 5 req/sec limit (future: implement queue)
- **Error messages** - Parse `error_description` from Cafe24 responses

### Development Workflow

1. **Renderer changes** → Hot reload automatically
2. **Main process changes** → Restart `npm run dev`
3. **Type changes** → May need to restart both processes
4. **Build verification** → Run `npm run build && npm run start` before commits

### Cursor Rules Context

The `.cursor/rules/` directory contains detailed guidelines:
- **electron.mdc** - Electron architecture, IPC patterns, security
- **ipc-patterns.mdc** - Typed IPC system, channel naming, error handling
- **cafe24-api.mdc** - Complete Cafe24 API reference, OAuth flow, endpoints

These rules enforce:
- Type-safe IPC communication
- Security best practices (contextIsolation, no remote module)
- Standardized error response format
- OAuth token auto-refresh pattern

## Common Development Tasks

### Adding a New IPC Channel

1. Define types in `src/types/ipc.ts`
2. Register handler in `src/main/main.ts` (`registerIpcHandlers`)
3. Expose via preload in `src/main/preload.ts`
4. Update `window.reviewApi` type in `src/types/global.d.ts`
5. Use in renderer hooks/components

### Implementing a New Cafe24 API Call

1. Add service function in `src/main/services/` (auth.ts or review.ts)
2. Use `getValidAccessToken()` to ensure valid token
3. Handle 401 with token refresh + retry (see `submitSingleReview` pattern)
4. Return standardized `{ success, message, ... }` response
5. Parse Cafe24 error format: `{ error, error_description }`

### Adding a New UI Component

1. Use shadcn/ui CLI if available, or copy pattern from existing components
2. Import from `@/components/ui/` with path alias
3. Style with Tailwind utility classes
4. Connect to hooks (`useAuth`, `useReview`) for state/actions
5. Display loading states (`isSubmitting`) and messages

### Debugging IPC Communication

1. Main process logs appear in terminal running `npm run dev`
2. Renderer logs appear in DevTools (auto-opens in dev mode)
3. Check `console.error` prefixed with `[auth]` or `[review]`
4. Verify payload types match `src/types/ipc.ts` definitions
