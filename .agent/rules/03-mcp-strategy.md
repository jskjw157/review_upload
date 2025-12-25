---
trigger: always_on
---

# MCP Usage Strategy

## Documentation Search Strategy

### Tier 1: Internal Codebase (Priority)
- **Check FIRST**: Is this about our own code?
  - Keywords: "our", "this project", "existing implementation"
  - Tools: grep_search, view_file_outline, find_by_name
  - Reason: Internal code not in public docs

### Tier 2: External Documentation

#### Priority Order (Default)
1. **docfork** (Primary - Try First)
   - For: Any library/framework documentation
   - Reason: 9000+ libraries, daily updates, 500ms response, FREE
   - Use when: Most common documentation needs

2. **context7** (Secondary - Fallback)
   - For: Libraries not in docfork
   - For: Version-specific documentation needs
   - Reason: Broader coverage, version-aware
   - Use when: docfork doesn't have it

#### Decision Flow
1. **Try docfork first** for any external library question
2. **If docfork sufficient** → Use docfork result ONLY (stop here)
3. **If docfork insufficient** → Consider context7
4. **Use BOTH only if** they provide complementary information

### Complementary Information (Exception Cases)

**When to use BOTH docfork + context7**:
- ✅ Need API reference (docfork) + real examples (context7)
- ✅ Need type definitions (docfork) + use cases (context7)
- ✅ Need official docs (docfork) + community patterns (context7)

**When to use ONE only**:
- ❌ Basic definitions → docfork only
- ❌ Simple instructions → docfork only
- ❌ API signatures → docfork only

**Rule of Thumb**: Ask yourself:
> "Does the second MCP add NEW information not in the first?"
> - YES → Use both (efficient)
> - NO → Use one (avoid waste)

### Concrete Examples

**Single MCP (Correct)**:
- "How to use React useState hook?" → docfork only
- "Next.js 14 file-based routing" → docfork only

**Dual MCP (Correct - Complementary)**:
- "React Query: Complete guide with examples" → docfork (API) + context7 (examples)
- "TypeScript generics: Theory + practice" → docfork (definitions) + context7 (use cases)

**Avoid Redundancy (Incorrect)**:
- "What is React?" → docfork only (NOT both)
- "Install Next.js command" → docfork only (NOT both)

---

## Error Handling & Fallbacks

### If docfork fails
1. Try context7 once
2. If still not found → Ask user: "Should I try web search?"
3. Do NOT auto web-search without consent

### If both fail
- Report clearly: "Neither docfork nor context7 has docs for X"
- Suggest options and wait for user decision

### Quality Check Before Using Docs
- [ ] Correct library version?
- [ ] API signature matches our usage?
- [ ] Any deprecation warnings?

---

## Token Optimization

### Hard Limits (Cost Control)
- **Max MCP calls per turn**: 3
- **Max tokens per MCP**: 5,000
- **If exceeded**: Stop and ask user priority

### Optimization Techniques

#### 1. File Viewing (70%+ Token Savings)
- ✅ `view_file_outline` first → understand structure
- ✅ `StartLine`/`EndLine` → view only needed sections
- ❌ Never re-read already viewed content

#### 2. Search Efficiency
- ✅ Use specific `topic` parameters
- ✅ Cache results mentally (no redundant searches)
- ✅ Parallel tool calls for independent operations

#### 3. Query Decomposition
1. Break complex → sub-queries
2. Execute independent sub-queries in parallel
3. Synthesize results at end

#### 4. Context Management
Periodically summarize in structured format:
- Goals achieved
- Errors found & fixed
- Files modified
- Remaining tasks

---

## Quick Reference

| Scenario | First Try | If Insufficient | Never |
|----------|-----------|-----------------|-------|
| React hooks API | docfork | context7 | Both for basic API |
| Our internal code | codebase search | docfork | Skip internal search |
| Library + examples | docfork | context7 (examples) | Both for simple install |
| Library not found | docfork → context7 | Ask user | Auto web search |

**Golden Rule**: Docfork first, context7 only when needed, both only if complementary.
