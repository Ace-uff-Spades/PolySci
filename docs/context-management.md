# Context Management Best Practices

## Problem
Large files and unnecessary reads can flood the AI context window, reducing effectiveness and increasing costs.

## Current Context Usage
- **Large files to avoid:** `docs/plans/2026-01-21-newd-mvp.md` (1929 lines)
- **Estimated total context:** ~5000+ lines when reading everything

## Best Practices

### 1. Use Architecture Docs Instead of Full Plans
- ✅ Read: `docs/architecture.md` (high-level overview)
- ✅ Read: `docs/project_state.md` (current status)
- ❌ Avoid: `docs/plans/2026-01-21-newd-mvp.md` (full implementation plan)

### 2. Use Semantic Search First
- Use `codebase_search` to find specific functionality
- Only read files when you need to modify them
- Read specific sections, not entire files

### 3. Read Files Selectively
**When to read:**
- Before modifying a file (read relevant section only)
- When debugging (read only related files)
- When implementing new features (read related files only)

**When NOT to read:**
- Completed implementation files (unless modifying)
- Test files (unless actively testing)
- Large documentation files (use summaries instead)

### 4. Keep Essential Context
Always keep in context:
- `project_state.md` - Current status
- `architecture.md` - System overview  
- `AGENTS.md` - Rules and protocols
- Currently active files being worked on

### 5. File Reading Strategy
```typescript
// ❌ Bad: Reading entire large file
read_file('docs/plans/2026-01-21-newd-mvp.md') // 1929 lines!

// ✅ Good: Using search to find specific info
codebase_search('How does news caching work?')

// ✅ Good: Reading only relevant section
read_file('src/lib/news-cache.ts', offset: 50, limit: 30)
```

## Context Audit
See `docs/context-audit.md` for detailed breakdown of what's currently in context.

## Monitoring
- Check context usage if responses become slow or less accurate
- Review `context-audit.md` periodically
- Prefer semantic search over file reads
