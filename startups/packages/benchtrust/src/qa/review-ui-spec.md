# Human QA Review UI Specification

**Task ID:** BENCH-006  
**Version:** 0.1  
**Audience:** Product, Operations

---

## Overview

Expert reviewers validate extracted benchmark tasks before vault ingestion. Each task requires **3 independent reviewers** with **2-of-3 approval** consensus before promotion to the holdout vault.

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Reviewer** | View assigned queue items, submit approve/reject/revision decisions |
| **QA Lead** | Reassign reviewers, override stale items, export audit log |
| **Pipeline** | Submit candidates from extraction (BENCH-003), read approved tasks |

---

## Screens

### 1. Review Queue (`/qa/queue`)

- Filter: `in_review`, `approved`, `rejected`, `revision`
- Sort: oldest first (FIFO)
- Columns: task title, language, scope hint, validation score, reviewer progress (e.g. `2/3`)
- Badge colors: green (approved), amber (in review), red (rejected), blue (revision)

### 2. Task Review Detail (`/qa/review/:queueId`)

**Left panel — task content**
- Title, description, language
- File list with count badge (narrow/wide hint from classifier)
- `testCommand` preview
- Temporal tags (`createdAt`, `licenseId`, `sourceRepo`)
- Auto-validator warnings/errors from BENCH-004

**Right panel — review form**
- Decision radio: Approve / Reject / Needs Revision
- Notes textarea (required on reject/revision)
- Submit button (disabled if already reviewed by this reviewer)

**Bottom panel — reviewer consensus**
- Table of 3 reviewer slots: ID, decision, timestamp, notes
- Progress bar: approvals / rejections / pending
- Consensus rule displayed: "2 of 3 approvals required"

### 3. QA Analytics (`/qa/stats`)

- Tasks reviewed this week
- Approval rate, rejection reasons (tagged)
- Median time-to-consensus
- Reviewer throughput (anonymized in v0.1)

---

## API Endpoints (future)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/qa/submit` | Pipeline submits candidate task |
| `GET` | `/v1/qa/queue` | List queue items |
| `GET` | `/v1/qa/queue/:id` | Single item detail |
| `POST` | `/v1/qa/queue/:id/review` | Submit reviewer decision |
| `POST` | `/v1/qa/queue/:id/finalize` | Promote approved task to vault |

Implementation: `src/qa/workflow.ts` (`QAWorkflow` class).

---

## Workflow States

```
pending → in_review → approved → vault
                   ↘ rejected
                   ↘ revision → (resubmit) → in_review
```

---

## SLA Targets

| Metric | Target |
|--------|--------|
| Time to first review | < 24h |
| Time to consensus | < 72h |
| Reviewer utilization | 3 reviewers per task, no self-review |

---

## Accessibility

- Keyboard-navigable decision form
- High-contrast status badges
- Screen-reader labels on consensus table

---

*BenchTrust Operations — BENCH-006*
