# Context Window Audit

## Current Context (Latest Session)

### Essential Documentation (Always Keep)
- `AGENTS.md` - Agent protocol and rules (~130 lines)
- `docs/project_state.md` - Current status and progress (~328 lines)
- `docs/architecture.md` - System overview and data flow (~211 lines)
- `docs/context-management.md` - Context optimization guidelines (~59 lines)

### Recently Referenced (Session-Specific)
- `docs/testing/testing-checklist.md` - Testing procedures (~139 lines)
- `docs/data-sources/political_topics.md` - Topic list for The Contrarian (~45 lines)
- `docs/features/contrarian-challenge-feature.md` - Feature brainstorm (~491 lines)
- `docs/plans/2026-01-31-contrarian-educational-architecture.md` - Explicit stance, confirmation, mode, CTAs (implemented)

### Code Files (Only When Modifying)
- The Contrarian implementation:
  - `src/lib/contrarian/*.ts` - Service layer, prompts, scoring
  - `src/components/Contrarian.tsx` - Main component
  - `src/components/AlignmentScoreBox.tsx` - Score meters
  - `src/app/api/contrarian/*/route.ts` - API endpoints

## Large Files to Avoid

### Completed Plans (Reference Only)
- **`docs/plans/2026-01-21-newd-mvp.md`** - 1929 lines (Phase 1-8 implementation, completed)
- **`docs/plans/2026-01-22-contrarian-challenge-implementation.md`** - Implementation plan (Phase 9, completed)

**Action**: Use `architecture.md` and `project_state.md` instead. Only read plan files if debugging specific historical decisions.

### Test Files
- Only read when actively writing/fixing tests
- Don't read for context when implementing features
- Test files: `src/lib/**/*.test.ts` (~19 tests for contrarian, ~13 for analysis)

## Context Optimization Strategy

### 1. Start Every Session
**Read these 3 files only:**
1. `docs/project_state.md` - Current status, recent work, open todos
2. `docs/architecture.md` - System overview, data flows, components
3. `AGENTS.md` - Rules and protocols

**Total: ~670 lines** (vs 5000+ if reading everything)

### 2. When Implementing Features
**Before coding:**
- Read relevant section of `architecture.md` (not entire file)
- Use `codebase_search` to find similar implementations
- Read only the specific file you're modifying (with offset/limit if large)

**Example:**
```typescript
// ❌ Bad: Reading entire large file
read_file('src/lib/contrarian/index.ts') // 122 lines

// ✅ Good: Reading only what you need
codebase_search('How does determineOpposingLens work?')
read_file('src/lib/contrarian/index.ts', offset: 40, limit: 25)
```

### 3. When Debugging
**Read only related files:**
- Error message → specific file mentioned
- API endpoint issue → route file + service file only
- UI issue → component file only

**Don't read:**
- Entire codebase
- All test files
- Completed implementation files

### 4. When Reviewing Code
**Use semantic search first:**
```typescript
codebase_search('How does alignment scoring work?')
codebase_search('Where are API endpoints defined?')
```

**Then read specific sections:**
- Only the function/class you're reviewing
- Use grep for exact matches: `grep -n "functionName"`

### 5. File Reading Priority

**High Priority (Read When Needed):**
- `docs/project_state.md` - Always current
- `docs/architecture.md` - System structure
- Active files being modified

**Medium Priority (Read When Relevant):**
- `docs/data-sources/government-data-sources.md` - API details (only when working with gov APIs)
- `docs/testing/testing-checklist.md` - Testing procedures (only when testing)
- Component files (only when modifying that component)

**Low Priority (Avoid Unless Necessary):**
- Completed plan files (`docs/plans/*.md`)
- Test files (unless writing/fixing tests)
- Completed implementation files (unless modifying)

## Context Usage Patterns

### Pattern 1: Feature Implementation
```
1. Read project_state.md (current status)
2. Read architecture.md (relevant section only)
3. codebase_search (find similar patterns)
4. Read only files being modified
5. Write code
```

**Estimated context: ~800-1200 lines**

### Pattern 2: Bug Fix
```
1. Read error message
2. Read specific file with error
3. Read related files (dependencies only)
4. Fix bug
```

**Estimated context: ~400-600 lines**

### Pattern 3: Code Review
```
1. codebase_search (understand feature)
2. Read modified files only
3. Review changes
```

**Estimated context: ~500-800 lines**

## Current Project Structure

### Features Implemented
- **Analysis**: News + government data → GPT-4o analysis
- **Socratic Circle**: 4 political perspectives on topics
- **The Contrarian**: Quantitative contrarian AI with alignment scoring

### Key Directories
- `src/lib/analysis/` - Analysis engine
- `src/lib/socratic/` - Socratic Circle service
- `src/lib/contrarian/` - The Contrarian service
- `src/lib/government/` - 6 government data APIs
- `src/components/` - React components
- `src/app/api/` - Next.js API routes

### Test Coverage
- Analysis: 13 tests
- Contrarian: 19 tests
- Prompts: 15 tests
- Total: ~47 tests passing

## Recommendations for Future Sessions

### Do This
1. **Start with 3 essential docs** (project_state, architecture, AGENTS)
2. **Use semantic search** before reading files
3. **Read specific sections** with offset/limit
4. **Read files only when modifying** them
5. **Reference architecture.md** instead of plan files

### Don't Do This
1. **Don't read completed plan files** (1929+ lines)
2. **Don't read test files** unless testing
3. **Don't read entire large files** (use sections)
4. **Don't re-read completed code** unless modifying
5. **Don't read all components** when working on one

### Context Budget
- **Target**: 800-1200 lines per session
- **Maximum**: 2000 lines (if debugging complex issues)
- **Avoid**: 5000+ lines (reading everything)

## Monitoring

**Signs of context bloat:**
- Responses become slow
- Less accurate code suggestions
- Reading files unnecessarily
- Re-reading completed code

**If context is bloated:**
1. Review what files you've read
2. Remove completed plan files from context
3. Use semantic search instead of file reads
4. Read only active files being modified
