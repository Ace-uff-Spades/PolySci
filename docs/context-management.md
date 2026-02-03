# Context Management Best Practices

## Problem
Large files and unnecessary reads can flood the AI context window, reducing effectiveness and increasing costs. This project has grown significantly with 3 major features, multiple services, and extensive documentation.

## Current Project Structure

### Features (3)
- **Analysis**: News + government data → GPT-4o analysis
- **Socratic Circle**: 4 political perspectives on topics
- **The Contrarian**: Quantitative contrarian AI with alignment scoring, structured responses, validation

### Key Directories
- `src/lib/analysis/` - Analysis engine (4 files)
- `src/lib/socratic/` - Socratic Circle service (3 files)
- `src/lib/contrarian/` - The Contrarian service (10 files: index, prompts, scoring, topics, response-formatter, validation, question-handler, stance-analysis, schemas, tests)
- `src/lib/government/` - 6 government data APIs + topic-mapping, cache, format (shared `formatGovernmentData` in `format.ts`), verify-keys (10 files)
- `src/lib/evals/` - AI eval system (datasets, scorers, runner)
- `src/components/` - 9 React components (Contrarian.tsx, ContrarianResponse, etc.)
- `src/app/api/` - 5 API routes + shared `utils.ts` (jsonError, requireTopic, invalidTopicResponse)

## Essential Context (Start Every Session)

**Read these 3 files only (~700 lines total):**
1. `docs/project_state.md` - Current status, recent work, open todos (~360 lines)
2. `docs/architecture.md` - System overview, data flows, components (~210 lines)
3. `AGENTS.md` - Rules and protocols (~130 lines)

**Total: ~700 lines** (vs 5000+ if reading everything)

## Large Files to Avoid

### Completed Plan Files (Archived)
- ❌ `docs/plans/archive/2026-01-21-newd-mvp.md` - 1929 lines (Phase 1-8, completed)
- ❌ `docs/plans/archive/2026-01-22-contrarian-challenge-implementation.md` - Implementation plan (Phase 9, completed)
- ❌ `docs/plans/archive/2026-01-24-ui-refactor-design.md` - UI refactor plan (completed)

**Action**: Use `architecture.md` and `project_state.md` instead. Only read archived plan files if debugging specific historical decisions.

### Active Plan Files
- `docs/plans/2026-01-31-contrarian-educational-architecture.md` - Contrarian/educational flow: explicit stance (button + confirmation), mode, end goals, CTAs (current reference)
- `docs/plans/2026-01-24-contrarian-fixes-alternative-architecture.md` - JSON Mode + Two-Stage Pipeline (completed, keep for reference)

### Feature Documentation (Read When Relevant)
- `docs/features/contrarian-challenge-feature.md` - ~491 lines (read only when working on The Contrarian)
- `docs/data-sources/government-data-sources.md` - API details (read only when working with gov APIs)
- `docs/testing/testing-checklist.md` - Testing procedures (read only when testing)

### Test Files
- Only read when actively writing/fixing tests
- Don't read for context when implementing features
- Test files: `src/lib/**/*.test.ts` (~47 tests total)
- Eval files: `src/lib/evals/` (read only when working on evals)

## Best Practices

### 1. Use Semantic Search First
**Before reading files, search:**
```typescript
// ✅ Good: Find specific functionality
codebase_search('How does response formatting work in contrarian?')
codebase_search('Where is input validation implemented?')

// ❌ Bad: Reading entire directory
read_file('src/lib/contrarian/') // Don't do this
```

### 2. Read Files Selectively with Offsets
**When you must read a file:**
```typescript
// ❌ Bad: Reading entire file
read_file('src/lib/contrarian/index.ts') // 124 lines

// ✅ Good: Reading only what you need
read_file('src/lib/contrarian/index.ts', offset: 70, limit: 30) // Just the function you need
```

### 3. Read Files Only When Modifying
**When to read:**
- Before modifying a file (read relevant section only)
- When debugging (read only related files)
- When implementing new features (read related files only)

**When NOT to read:**
- Completed implementation files (unless modifying)
- Test files (unless actively testing)
- Large documentation files (use summaries instead)
- All components when working on one
- Entire service directories when working on one function

### 4. Context Budget Per Task Type

**Feature Implementation:**
- Essential docs: ~700 lines
- Related files: ~200-400 lines
- **Target: 900-1100 lines**

**Bug Fix:**
- Error message + specific file: ~100-200 lines
- Related dependencies: ~100-200 lines
- **Target: 200-400 lines**

**Code Review:**
- Modified files only: ~300-600 lines
- **Target: 300-600 lines**

**Maximum per session: 2000 lines** (only for complex debugging)

### 5. Module-Specific Guidance

**The Contrarian (`src/lib/contrarian/`):**
- 10 files total (index, prompts, scoring, topics, response-formatter, validation, question-handler, stance-analysis, schemas, tests)
- **Read only the file you're modifying**
- Use `codebase_search` to understand relationships
- Don't read all 10 files at once

**Government APIs (`src/lib/government/`):**
- 9 files total (6 API clients + cache + topic-mapping + index)
- **Read only the API you're working with**
- Use `codebase_search` to find which API handles a topic

**Components (`src/components/`):**
- 9 components total
- **Read only the component you're modifying**
- Don't read all components when working on one feature

### 6. File Reading Priority

**High Priority (Read When Needed):**
- `docs/project_state.md` - Always current
- `docs/architecture.md` - System structure
- Active files being modified

**Medium Priority (Read When Relevant):**
- `docs/data-sources/government-data-sources.md` - Only when working with gov APIs
- `docs/testing/testing-checklist.md` - Only when testing
- Component files - Only when modifying that component
- Service files - Only when modifying that service

**Low Priority (Avoid Unless Necessary):**
- Completed plan files (`docs/plans/*.md`)
- Test files (unless writing/fixing tests)
- Completed implementation files (unless modifying)
- Feature docs (unless working on that feature)

## Common Patterns

### Pattern 1: Implementing New Feature
```
1. Read project_state.md (current status) - ~360 lines
2. Read architecture.md (relevant section only) - ~50-100 lines
3. codebase_search (find similar patterns) - 0 lines (search results)
4. Read only files being modified - ~200-400 lines
5. Write code
```
**Total: ~610-860 lines**

### Pattern 2: Fixing Bug
```
1. Read error message - 0 lines
2. Read specific file with error - ~50-150 lines
3. Read related files (dependencies only) - ~100-200 lines
4. Fix bug
```
**Total: ~150-350 lines**

### Pattern 3: Understanding Existing Code
```
1. codebase_search (understand feature) - 0 lines
2. Read specific function/class only - ~50-100 lines
```
**Total: ~50-100 lines**

## Red Flags (Context Bloat)

**Stop if you see:**
- Reading multiple plan files (1929+ lines each)
- Reading all test files
- Reading entire service directories
- Re-reading completed code
- Reading all components when working on one
- Reading feature docs when not working on that feature

**If context is bloated:**
1. Review what files you've read
2. Remove completed plan files from context
3. Use `codebase_search` instead of reading files
4. Read only specific sections with offset/limit

## Monitoring

**Signs of context bloat:**
- Responses become slow
- Less accurate code suggestions
- Reading files unnecessarily
- Re-reading completed code
- Context exceeds 2000 lines

**Check context usage:**
- Review `docs/context-audit.md` periodically
- Prefer semantic search over file reads
- Use grep for exact matches instead of reading files
- Read files only when actively modifying them

## Quick Reference

**Always read (start of session):**
- `docs/project_state.md`
- `docs/architecture.md`
- `AGENTS.md`

**Use semantic search for:**
- Finding functionality
- Understanding relationships
- Locating specific code

**Read files only when:**
- Actively modifying them
- Debugging specific issues
- Need exact implementation details

**Never read:**
- Completed plan files (use architecture.md instead)
- Test files (unless testing)
- All files in a directory (read only what you need)
