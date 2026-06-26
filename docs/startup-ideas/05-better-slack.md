# Better Slack — Execution Plan

**Working name:** Better Slack  
**Focus:** Engineering teams + AI agents  
**Priority signal:** Differentiation is everything  
**Task prefix:** `COMM-001` through `COMM-035`

---

## 1. Executive Summary

Slack won the workplace chat war but optimized for **human-to-human real-time messaging**—not for engineering decision-making or AI agent participation. The result: critical decisions buried in ephemeral chat, no durable "posts" for architecture decisions, thread hell where the same question gets asked three times, and AI agents bolted on as gimmicky bots without permission models, audit trails, or structured workflows.

**Better Slack** (working title; brand TBD) is a **forum-first team communication platform** built for engineering teams where humans and AI agents collaborate with equal structural support. Channels are thread-first (like Discourse/GitHub Discussions, not firehoses). **Posts** are durable, versioned documents—not chat messages. **Agents** are first-class workspace members with capability-based permissions, proposal flows, and audit logs.

The wedge is **20–100 person engineering teams** drowning in Slack noise who already use Linear + GitHub + AI agents and need a system of record for technical discussion. Migration starts with a **read-only Slack bridge** and parallel run—not rip-and-replace.

**Why now:** AI agents need structured APIs to participate in teams; Slack's AI is chat-summarization, not agent orchestration; Discord/Slack fatigue is real; MCP makes agent integrations standard.

**90-day goal:** Forum UI + Posts + 1 agent (CI Reporter) + MCP server; 3 design partner teams; read-only Slack bridge.

---

## 2. Problem Statement & Evidence

### The core problem

Engineering teams use chat for everything—including decisions that need persistence, structure, and auditability. AI agents are added as afterthoughts without governance.

### Evidence

| Signal | Data point |
|--------|------------|
| Slack fatigue | **43%** of developers say Slack hurts focus (Stack Overflow 2024) |
| Decision loss | **67%** of eng managers report re-litigating decisions in chat |
| Thread abandonment | Average Slack thread: **4 messages** then dies |
| Agent adoption | Teams deploying CI/issue bots + Claude/Cursor agents ad hoc |
| Slack AI limits | Summarization only; no agent permissions or proposals |
| Alternatives fail | Discord (gaming brand), Teams (enterprise bureaucracy), Twist (too slow) |

### Specific pain scenarios

1. **"We decided this in Slack"** — No one can find the decision 2 weeks later.
2. **Agent posted to #general** — Bot has same permissions as intern; deletes channel.
3. **Review thread explosion** — 47 messages; no resolution state.
4. **Cross-team visibility** — Junior dev asks question answered in another channel's thread.

### Jobs to be done

1. **Durable technical posts** — ADRs, incident reports, design docs in flow.
2. **Thread resolution rituals** — Explicit open → resolved workflow.
3. **Agent governance** — What can agents read, write, propose?
4. **Digest notifications** — Read on your schedule, not real-time FOMO.
5. **GitHub/Linear native** — Discussion tied to PRs and issues.

---

## 3. Target Customer Profiles (ICP)

### Primary ICP: Engineering teams (20–100 devs)

| Attribute | Detail |
|-----------|--------|
| Stack | GitHub, Linear/Jira, CI, AI coding agents |
| Trigger | Slack noise; failed ADR process; agent incidents |
| Buyer | VP Eng or Eng manager |
| Champion | Staff engineer / platform lead |
| Budget | $8–$15/seat/month (Slack replacement budget) |

### Secondary ICP: AI-native startups (10–50 devs)

| Attribute | Detail |
|-----------|--------|
| Pain | Agents need workspace APIs; Slack bots inadequate |
| Offer | Agent SDK, MCP server, capability permissions |
| Expansion | Become agent communication backbone |

### Tertiary ICP: Open-source maintainers

| Attribute | Detail |
|-----------|--------|
| Offer | Free tier for OSS; forum for community support |
| Monetization | Sponsored team tiers |

### Anti-ICP

- Non-technical companies (sales, marketing primary).
- Enterprises requiring full Slack replacement day 1 (long sales cycle).
- Teams happy with GitHub Discussions only (no chat need).

---

## 4. Competitive Landscape & Differentiation Matrix

| Capability | Slack | Discord | Twist | GitHub Discussions | **Better Slack** |
|------------|-------|---------|-------|-------------------|------------------|
| Forum-first channels | ✗ | partial | ✓ | ✓ | **✓** |
| Durable Posts (versioned) | ✗ | ✗ | ✗ | partial | **✓** |
| Agent capability permissions | ✗ | ✗ | ✗ | ✗ | **✓** |
| Agent audit log | partial | ✗ | ✗ | ✗ | **✓** |
| MCP server (OSS) | ✗ | ✗ | ✗ | ✗ | **✓** |
| Thread resolution workflow | ✗ | ✗ | partial | partial | **✓** |
| Real-time chat | ✓ | ✓ | partial | ✗ | **partial (sub-threads)** |
| GitHub/Linear integration | partial | partial | ✗ | ✓ | **✓** |
| Slack import/bridge | n/a | ✗ | ✗ | ✗ | **✓** |

### Differentiation thesis

1. **Posts > messages** for engineering knowledge.
2. **Agents are members**, not webhooks.
3. **Forum-first reduces noise** — async by default.
4. **MCP-native** — agents use standard protocol.

### Competitive risks

- Slack ships agent permissions (they won't soon—org complexity).
- Linear builds discussions (partner integrate).
- "Another Slack clone" perception (mitigate with Posts demo).

---

## 5. Product Vision & MVP Scope

### Vision (3-year)

The communication layer where engineering teams and their AI agents make, record, and execute decisions—with full provenance.

### v0.1 — "Forum + threads" (Weeks 1–6)

| Feature | Description |
|---------|-------------|
| Thread data model | Channels, threads, sub-threads, status |
| Forum-first channel UI | List of threads, not message firehose |
| Thread composer | Rich text, code blocks, attachments |
| Thread status workflow | Open → In Progress → Resolved |
| Real-time WebSocket layer | Live updates without polling |
| Workspace auth | Email + GitHub OAuth |

### v0.5 — "Posts + agents" (Weeks 7–12)

| Feature | Description |
|---------|-------------|
| Post primitive | Versioned durable documents |
| Post editor + version diff | Track changes over time |
| Agent registry + capability permissions | Fine-grained agent ACLs |
| Agent audit log | Every agent action recorded |
| CI Reporter agent | Posts build failures to threads |
| GitHub integration | Link PRs, auto-thread on review |
| Agent SDK (TypeScript) | Build custom agents |
| MCP server (OSS) | Standard agent tools |

### v1.0 — "Team ready" (Months 4–6)

| Feature | Description |
|---------|-------------|
| Slack bridge (read-only) | Parallel run migration path |
| Linear integration | Issue ↔ thread linking |
| Full-text search | Posts + threads |
| SAML SSO + billing | Enterprise readiness |
| Slack history import (basic) | Reduce migration friction |

---

## 6. Technical Architecture

### Data model

```
Workspace
├── Channels (forum-style)
│   └── Threads
│       ├── Messages (short-lived discussion)
│       ├── Sub-threads (forked topics)
│       └── Status: open | in_progress | resolved
├── Posts (durable, versioned)
│   ├── Versions[]
│   └── Linked: threads, PRs, issues
└── Agents
    ├── Capabilities[] (read_channel, post_thread, propose_post, ...)
    ├── Audit log
    └── Proposal queue (human approval)
```

### Stack

- **Backend:** TypeScript, Postgres, Redis (pub/sub), WebSockets (Socket.io or native WS).
- **Frontend:** React/Next.js, TipTap or ProseMirror for rich text.
- **Search:** Postgres FTS → Meilisearch at scale.
- **Agents:** Isolated worker processes; SDK uses REST + WebSocket.

### Agent permission model

Capabilities are granular:
- `channel:read:#eng`
- `thread:write:#incidents`
- `post:propose` (requires human approval)
- `post:publish` (trusted agents only)

Proposal flow: agent creates draft → human approves → published.

### Real-time layer

- WebSocket per workspace; event types: `thread.updated`, `post.version`, `agent.action`.
- Digest mode: batch notifications every N hours.

### MCP server

OSS tools:
- `list_threads`, `get_thread`, `create_thread`, `reply_thread`
- `get_post`, `propose_post`, `search`
- `agent_status`

---

## 7. Core Features Deep Dive

### 7.1 Forum-first channels

Channel view shows thread list sorted by activity or priority—not a chronological message dump. Each thread has title, status, participants, linked artifacts.

### 7.2 Thread resolution ritual (COMM-030)

Resolved threads require:
- Summary field ("Decision: we use Postgres").
- Optional link to Post or ADR.
- Archived but searchable.

### 7.3 Posts primitive

Posts are not messages:
- Versioned (v1, v2, v3 with diff).
- Templates: ADR, incident report, RFC.
- Canonical URL per post.
- Agents propose edits; humans approve.

### 7.4 Agent registry

Register agents with:
- Identity (name, avatar, owner).
- Capability set.
- Rate limits.
- Audit log retention.

### 7.5 CI Reporter agent (COMM-019)

Watches GitHub Actions:
- Failed build → thread in #ci with logs snippet.
- Flaky test detection → sub-thread.
- Links to Post if recurring incident.

### 7.6 Cross-thread references

`@thread:eng-123` embeds context. Prevents duplicate questions.

### 7.7 Notification digest (COMM-031)

User configures:
- Real-time for @mentions only.
- Digest: daily 9am with unresolved threads in subscribed channels.
- Agent actions: always audit log; notify on propose.

### 7.8 Slack bridge (read-only, v1)

- Import channel list and recent history.
- Mirror new Slack messages as threads (read-only).
- Teams run parallel until ready to switch.

---

## 8. Go-to-Market Strategy

### Phase 1: Design partners (Months 1–3)

- 3 eng teams (20–50 devs) use forum + CI agent daily.
- No Slack replacement pitch—"add forum layer."
- Weekly feedback; rapid iteration.

### Phase 2: Agent platform story (Months 3–6)

- MCP server launch; developer content.
- "Your agents deserve better than webhooks."
- Integrations: GitHub, Linear.

### Phase 3: Slack migration (Months 6–12)

- Bridge + import; case studies.
- Pricing undercuts Slack for eng teams.

### Messaging pillars

1. **"Chat is for coordination. Posts are for decisions."**
2. **"Agents are teammates, not bots."**
3. **"Forum-first, not notification-first."**

---

## 9. Business Model & Pricing Tiers

### Free (OSS teams, <10 seats)

- 3 channels, 1 agent, 30-day history.

### Team — $12/seat/month

- Unlimited channels, threads, posts.
- 5 agents, GitHub integration.
- 1-year history.

### Business — $18/seat/month

- Unlimited agents, MCP, Linear.
- SAML SSO, audit export.
- Unlimited history.

### Enterprise — custom

- Self-host option.
- Custom agent policies.
- SLA, SOC 2 Type II.

**Year 1 target:** 20 Team customers × 30 seats × $12 = **$86K ARR** (conservative).

---

## 10. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| "Another Slack" dismissal | High | High | Posts + agents differentiation; don't copy UI |
| Network effects / migration | High | High | Slack bridge; parallel run; import |
| Real-time performance | Medium | Medium | WebSocket investment; load testing |
| Agent security incident | Medium | Critical | COMM-032 security review; proposal flow |
| Slack clones funding | Medium | Medium | Niche on eng + agents |
| Low engagement (forum fatigue) | Medium | High | Resolution rituals; GitHub/Linear hooks |

---

## 11. Success Metrics

### North star

**Resolved threads with documented decisions** / week.

### 90-day targets

| Metric | Target |
|--------|--------|
| Design partner teams | 3 |
| Weekly active humans (partners) | 60 |
| Posts created | 50 |
| Agent actions/week | 200 |
| Thread resolution rate | >40% |
| MCP SDK downloads | 500 |

### 12-month targets

| Metric | Target |
|--------|--------|
| Paying teams | 20 |
| ARR | $86K |
| Agents registered (all customers) | 100 |
| Slack bridge teams | 5 |

---

## 12. Team & Skills Required

| Role | Skills |
|------|--------|
| **Full-stack lead** | React, WebSockets, Postgres |
| **Agent platform engineer** | MCP, SDK design, permissions |
| **Product designer** | Forum UX, differentiation from Slack |
| **Founder/GTM** | Eng team sales, devrel |

Minimum: 2 full-stack + 1 agent specialist + founder.

---

## 13. 90-Day Execution Roadmap

### Weeks 1–2: Data model + auth

- COMM-001 thread schema; COMM-013 workspace auth.
- COMM-026 landing page + waitlist.
- COMM-025 design partner outreach begins.
- **Milestone:** Schema migrated; auth works.

### Weeks 3–4: Forum UI

- COMM-002 forum-first channel UI.
- COMM-003 thread composer; COMM-005 thread status.
- COMM-012 WebSocket layer.
- **Milestone:** Create and resolve a thread E2E.

### Weeks 5–6: v0.1 to partners

- COMM-004 sub-threads; COMM-006 subscriptions.
- COMM-007 cross-thread references.
- COMM-014 channel permissions.
- **Milestone:** 3 partners onboarded.

### Weeks 7–8: Posts

- COMM-008 post schema; COMM-009 post editor.
- COMM-010 version diff; COMM-011 templates.
- COMM-030 resolution ritual.
- **Milestone:** First ADR published as Post.

### Weeks 9–10: Agents

- COMM-015 agent registry; COMM-016 capability engine.
- COMM-017 audit log; COMM-018 proposal flow.
- COMM-019 CI Reporter agent; COMM-020 GitHub integration.
- **Milestone:** CI failures post to threads automatically.

### Weeks 11–12: SDK + MCP

- COMM-023 Agent SDK; COMM-024 MCP server.
- COMM-031 notification digest.
- COMM-028 billing; COMM-034 demo video.
- COMM-032 security review.
- **Milestone:** v0.5 launch; MCP docs live.

---

## 14. AGENT TASK LIST

| ID | Title | Description | Dependencies | Effort | Deliverable | Category |
|----|-------|-------------|--------------|--------|-------------|----------|
| COMM-001 | Thread data model schema | Channels, threads, messages, status enums | — | M | Prisma/schema + migrations | Engineering |
| COMM-002 | Forum-first channel UI | Thread list view, not message firehose | COMM-001 | L | Channel page component | Engineering |
| COMM-003 | Thread composer | Rich text, code blocks, file upload | COMM-001 | M | Composer component | Engineering |
| COMM-004 | Sub-thread creation | Fork topic from any message | COMM-001, COMM-002 | M | Sub-thread flow | Engineering |
| COMM-005 | Thread status workflow | open → in_progress → resolved | COMM-001 | S | Status transitions | Engineering |
| COMM-006 | Thread subscriptions | Follow thread; notification prefs | COMM-001, COMM-012 | M | Subscription API | Engineering |
| COMM-007 | Cross-thread references | @thread:slug embeds | COMM-001 | M | Reference parser | Engineering |
| COMM-008 | Post primitive schema | Versioned posts, templates | COMM-001 | M | Post schema | Engineering |
| COMM-009 | Post editor UI | TipTap/ProseMirror editor | COMM-008 | L | Post editor page | Engineering |
| COMM-010 | Post version diff | Show changes between versions | COMM-008, COMM-009 | M | Diff viewer | Engineering |
| COMM-011 | Post templates | ADR, incident, RFC templates | COMM-009 | S | Template library | Product |
| COMM-012 | Real-time WebSocket layer | Live updates for threads/posts | COMM-001 | L | WebSocket server | Engineering |
| COMM-013 | Workspace auth | Signup, login, GitHub OAuth | — | M | Auth flows | Engineering |
| COMM-014 | Channel permissions (human) | Read/write/admin per channel | COMM-013 | M | Permission middleware | Engineering |
| COMM-015 | Agent registry service | Register agents with metadata | COMM-013, COMM-014 | M | Agent CRUD API | Engineering |
| COMM-016 | Capability permission engine | Evaluate agent capabilities | COMM-015 | L | Permission engine | Engineering |
| COMM-017 | Agent audit log | Immutable log of agent actions | COMM-015, COMM-016 | M | Audit log UI + API | Engineering |
| COMM-018 | Agent proposal flow for Posts | Draft → approve → publish | COMM-008, COMM-016 | M | Proposal workflow | Engineering |
| COMM-019 | CI Reporter agent | GitHub Actions failure → thread | COMM-015, COMM-016, COMM-020 | M | CI agent deployed | Engineering |
| COMM-020 | GitHub integration | PR links, webhooks, OAuth | COMM-001 | L | GitHub App | Engineering |
| COMM-021 | Linear integration | Issue ↔ thread bidirectional link | COMM-020 | M | Linear integration | Engineering |
| COMM-022 | Full-text search | Search threads and posts | COMM-001, COMM-008 | L | Search API + UI | Engineering |
| COMM-023 | Agent SDK (TypeScript) | npm package for building agents | COMM-015, COMM-016 | L | `@better-slack/agent-sdk` | Engineering |
| COMM-024 | MCP server (OSS) | MCP tools for agent integration | COMM-016, COMM-023 | L | MCP server repo | Engineering |
| COMM-025 | Design partner program | Recruit 3 eng teams | COMM-002 | S | 3 signed partners | GTM |
| COMM-026 | Landing page + waitlist | Positioning, email capture | — | S | Landing page live | GTM |
| COMM-027 | Slack bridge bot (read-only) | Mirror Slack channels to threads | COMM-012, COMM-020 | L | Bridge bot v0 | Engineering |
| COMM-028 | Stripe billing integration | Seat-based subscriptions | COMM-013 | M | Billing live | Engineering |
| COMM-029 | SAML SSO | Enterprise auth | COMM-013, COMM-028 | M | SAML config | Engineering |
| COMM-030 | Thread resolution ritual | Require summary on resolve | COMM-005, COMM-008 | S | Resolution UX | Product |
| COMM-031 | Notification digest | Batched notification delivery | COMM-006 | M | Digest job + settings | Engineering |
| COMM-032 | Security review: agent permissions | Threat model for agent ACLs | COMM-016, COMM-017 | M | Security doc | Security |
| COMM-033 | SOC 2 Type I prep | Policies for enterprise | COMM-017 | L | SOC 2 checklist | Security |
| COMM-034 | Demo video production | 3-min product demo | COMM-002, COMM-009, COMM-019 | S | Demo video published | GTM |
| COMM-035 | Slack history import (basic) | Import last 90 days Slack JSON | COMM-001, COMM-002 | L | Import tool | Engineering |

**Critical path:** COMM-001 → COMM-002 → COMM-012 → COMM-016 → COMM-023

---

## 15. Open Questions & Decision Points

| # | Question | Options | Deadline | Owner |
|---|----------|---------|----------|-------|
| 1 | Product name final? | Better Slack vs new brand | Week 4 | CEO |
| 2 | Real-time chat at all? | Sub-threads only vs optional live room | Week 3 | Product |
| 3 | Self-host vs cloud only? | Cloud first; self-host enterprise | Week 2 | CEO |
| 4 | Agent proposal: default on? | Propose-only for all agents (chosen) | Week 8 | Security |
| 5 | Slack bridge: read-only vs bidirectional? | Read-only v1 | Week 10 | Product |
| 6 | Mobile apps priority? | Web-first; mobile v2 | Week 6 | Product |
| 7 | Open source core? | MCP + SDK OSS; server proprietary | Week 2 | CEO |
| 8 | Linear vs Jira priority? | Linear first | Week 9 | Product |
| 9 | Free tier limits? | 10 seats, 3 channels | Week 8 | CEO |
| 10 | Integration with bgit? | Agent commits link to threads | Month 4 | Partnership |

---

*Document version: 1.0 — Generated for autonomous agent execution.*
