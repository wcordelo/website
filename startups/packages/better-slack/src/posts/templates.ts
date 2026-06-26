/** COMM-011: Post templates — RFC, ADR, Incident, Runbook */

export type PostTemplateId = "rfc" | "adr" | "incident" | "runbook";

export interface PostTemplate {
  id: PostTemplateId;
  name: string;
  description: string;
  content: string;
}

export const POST_TEMPLATES: Record<PostTemplateId, PostTemplate> = {
  rfc: {
    id: "rfc",
    name: "RFC",
    description: "Request for Comments — propose a change and gather feedback",
    content: `# RFC: [Title]

## Status
Draft

## Authors
@you

## Summary
One paragraph describing the proposed change.

## Motivation
Why are we doing this? What problem does it solve?

## Detailed design
Technical approach, API changes, data model impacts.

## Alternatives considered
What else did we evaluate?

## Open questions
- [ ] Question 1
`,
  },
  adr: {
    id: "adr",
    name: "ADR",
    description: "Architecture Decision Record — capture a significant technical decision",
    content: `# ADR-NNN: [Title]

## Status
Proposed

## Context
What is the issue that we're seeing that motivates this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or harder because of this change?
`,
  },
  incident: {
    id: "incident",
    name: "Incident",
    description: "Incident report — timeline, impact, and follow-ups",
    content: `# Incident: [Title]

## Severity
SEV-?

## Timeline (UTC)
- **Detected:**
- **Mitigated:**
- **Resolved:**

## Impact
Who was affected? For how long?

## Root cause
What went wrong?

## Resolution
How was it fixed?

## Action items
- [ ] Follow-up task
`,
  },
  runbook: {
    id: "runbook",
    name: "Runbook",
    description: "Operational runbook — step-by-step procedures",
    content: `# Runbook: [Title]

## Overview
What system or process does this cover?

## Prerequisites
- Access required
- Tools needed

## Procedure

### Step 1: [Action]
\`\`\`bash
# commands here
\`\`\`

### Step 2: [Verify]
Expected outcome.

## Rollback
How to undo if something goes wrong.

## Escalation
Who to contact if this fails.
`,
  },
};

export function getTemplate(id: string): PostTemplate | null {
  return POST_TEMPLATES[id as PostTemplateId] ?? null;
}

export function listTemplates(): PostTemplate[] {
  return Object.values(POST_TEMPLATES);
}
