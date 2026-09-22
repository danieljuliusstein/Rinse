# Implementation Plan: Feature Verification 100%

## Overview
- **Total work:** 30 tasks, 253 tests, ~36 hours
- **Current state:** 8 verified, 16 partial, 2 mocked, 1 not-tested
- **Target:** 27 verified (100%)
- **Approach:** Sequential with occasional parallelization
- **Blocking issue:** Job creation 400 error (Phase 1)

## Task Dependency Graph

```
Phase 1: Fix job creation (1-2h)
  ↓
Phase 2: CRUD coverage (8-10h)
  ↓ ↓
Phase 3: Auth matrix (3-4h)    Phase 4: Routes (4-5h)
  ↓
Phase 5: Integrations (5-6h)
  ↓
Phase 6: Parity (3-4h)         Phase 7: Hooks (2-3h)
  ↓
Phase 8: Matrix completion (2-3h)
```

## Session Tracking

This session uses the SQL database to track progress:

```sql
SELECT * FROM feature_100_scope WHERE status = 'pending' ORDER BY phase;
```

Update status as work completes:

```sql
UPDATE feature_100_scope SET status = 'in_progress' WHERE task_id = '...';
UPDATE feature_100_scope SET status = 'done', completed_at = CURRENT_TIMESTAMP WHERE task_id = '...';
```

## Implementation Start

**Phase 1 beginning now:**
- Diagnose job creation 400 error
- Add verbose PocketBase logging
- Test with minimal payloads
- Verify subscription guard doesn't block founding_member=true
- Unskip test and validate it passes
