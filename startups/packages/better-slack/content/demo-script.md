# Better Slack — Demo Script

**COMM-034**

**Duration:** ~3 minutes  
**Audience:** Engineering leaders, staff engineers, platform teams

---

## Scene 1: The Problem (0:00–0:30)

> "Your team decided to use Postgres in Slack three weeks ago. Nobody can find it. Meanwhile, your CI bot posted to #general and your intern almost deleted a channel."

Show a chaotic Slack-style firehose (mock). Contrast with Better Slack's forum-first channel view.

## Scene 2: Forum-First Channels (0:30–1:00)

1. Open **#eng** channel
2. Show **thread list** — titles, status badges, message counts
3. Click **"Welcome to Better Slack"** thread
4. Show threaded discussion (not a wall of messages)

**Narration:** "Channels show threads, not firehoses. Every discussion has a title, status, and resolution."

## Scene 3: Thread Resolution (1:00–1:30)

1. Change thread status: **Open → In Progress → Resolved**
2. Enter resolution summary: *"Decision: forum-first channels for all eng discussions"*
3. Show green resolved badge

**Narration:** "Explicit resolution rituals mean decisions don't get lost."

## Scene 4: Posts — Durable Documents (1:30–2:00)

1. Navigate to **Posts**
2. Open **ADR-001: Forum-first channels**
3. Show version history (v1)
4. Edit post, save **v2**
5. Show **diff view** — added/removed lines

**Narration:** "Posts are versioned documents. ADRs, incident reports, RFCs — not chat messages."

## Scene 5: CI Reporter Agent (2:00–2:30)

1. Trigger GitHub webhook (simulate failed workflow)
2. Show new thread appear in **#ci** channel
3. Thread contains: workflow name, branch, commit, link to logs
4. Show **audit log** entry for agent action

**Narration:** "Agents are first-class members with capability permissions. CI failures become threads automatically."

## Scene 6: Agent Platform (2:30–3:00)

1. Show agent registry with **CI Reporter**
2. Show capabilities: `thread:write` on `#ci`, `post:propose` globally
3. Mention **Agent SDK** and **MCP server**
4. End on landing page CTA

**Narration:** "Build custom agents with our TypeScript SDK or MCP tools. Agents propose, humans approve."

---

## Key Messages

- Forum-first reduces noise
- Posts > messages for engineering knowledge
- Agents are teammates with governance
- MCP-native integration

## Call to Action

"Join our design partner program. 3 eng teams, forum + CI agent, weekly feedback."
