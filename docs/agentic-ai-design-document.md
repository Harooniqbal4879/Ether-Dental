# EtherAI-Dental: Agentic AI Digital Workforce Design Document

**Version:** 1.3  
**Date:** February 2026  
**Status:** Draft — Pending Review  
**Changelog:**  
- v1.3 — Added Human-Agent Interaction Model (Section 5) defining the relationship between Chrome Extension (human interface), AI agents (server-side automation), and the extension as a bridge for HITL approvals and agent monitoring.  
- v1.2 — Added Multi-PMS Integration Strategy with 4-tier integration architecture, DSO software fragmentation analysis, integration pricing model, and Chrome Extension as unifying layer.  
- v1.1 — Added DSO/Multi-Location hierarchy, location-level agent execution, pricing/subscription model, and usage metering.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [GPAORI Pattern Overview](#2-gpaori-pattern-overview)
3. [Human-in-the-Loop (HITL) Framework](#3-human-in-the-loop-hitl-framework)
4. [System Architecture](#4-system-architecture)
5. [Human-Agent Interaction Model](#5-human-agent-interaction-model)
   - 5.1 Two Operating Modes
   - 5.2 Chrome Extension as the Bridge
   - 5.3 Interaction Patterns by Role
   - 5.4 Extension-Agent Integration Features
   - 5.5 Data Flow: Human ↔ Agent ↔ Extension
6. [DSO & Multi-Location Hierarchy](#6-dso--multi-location-hierarchy)
7. [Core Infrastructure](#7-core-infrastructure)
8. [Agent Definitions](#8-agent-definitions)
   - 8.1 Insurance Verification Agent
   - 8.2 AI Shift Matchmaker Agent
   - 8.3 Claims Follow-Up Agent
   - 8.4 Patient Communication Agent
   - 8.5 Credential Monitoring Agent
   - 8.6 Revenue Cycle Intelligence Agent
9. [Pricing & Subscription Model](#9-pricing--subscription-model)
10. [Database Schema](#10-database-schema)
11. [API Design](#11-api-design)
12. [Security & Compliance](#12-security--compliance)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

This document defines the architecture for building six **Agentic AI solutions** within the EtherAI-Dental platform. Each agent follows the **GPAORI pattern** (Goal → Plan → Act → Observe → Reflect → Iterate) and incorporates **Human-in-the-Loop (HITL)** checkpoints at every step to ensure accuracy, compliance, and trust.

These agents form a "Digital Workforce" that automates repetitive, time-consuming tasks across dental practice operations while keeping practice administrators in full control. The agents don't replace staff — they augment them by handling the grunt work and surfacing decisions for human approval.

The platform supports **DSOs (Dental Service Organizations)** managing multiple practices and locations, with agents that **configure at the practice level** and **execute at the location level**, providing both centralized control and location-specific intelligence.

### Design Principles

| Principle | Description |
|---|---|
| **HITL-First** | No agent takes irreversible action without human approval |
| **Transparency** | Every agent decision is logged, explainable, and auditable |
| **Graceful Degradation** | Agents fail safely — if AI is uncertain, it escalates to a human |
| **Incremental Trust** | Agents start fully supervised; practices can gradually increase autonomy |
| **HIPAA-Aware** | All PHI handled per existing platform encryption and access controls |
| **Location-Aware** | Agents execute per-location with practice-level defaults and DSO-level reporting |

---

## 2. GPAORI Pattern Overview

Each agent operates in a continuous loop following six phases:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   ┌──────┐    ┌──────┐    ┌─────┐    ┌─────────┐       │
│   │ GOAL │───▶│ PLAN │───▶│ ACT │───▶│ OBSERVE │       │
│   └──────┘    └──────┘    └─────┘    └─────────┘       │
│       ▲          │           │            │              │
│       │          ▼           ▼            ▼              │
│       │     [HITL Gate] [HITL Gate]  [HITL Gate]        │
│       │                                   │              │
│       │    ┌─────────┐    ┌─────────┐    │              │
│       └────│ ITERATE │◀───│ REFLECT │◀───┘              │
│            └─────────┘    └─────────┘                    │
│                 │              │                          │
│                 ▼              ▼                          │
│            [HITL Gate]   [HITL Gate]                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Phase Definitions

| Phase | Purpose | Output | HITL Gate |
|---|---|---|---|
| **G — Goal** | Define what the agent needs to accomplish | Structured goal object with success criteria | Admin sets/confirms the goal |
| **P — Plan** | Break the goal into ordered steps with dependencies | Step-by-step execution plan | Admin reviews and approves the plan |
| **A — Act** | Execute the current step (API call, data query, notification) | Action result with raw data | Admin approves before irreversible actions |
| **O — Observe** | Analyze the result — did the action succeed? what data came back? | Observation report with confidence score | Admin sees what the agent observed |
| **R — Reflect** | Evaluate progress toward goal, identify issues, decide next move | Reflection summary with recommendation | Admin reviews agent's assessment |
| **I — Iterate** | Decide: continue to next step, retry, modify plan, or complete | Next action decision | Admin approves continuation or termination |

### Confidence Scoring

Every observation and reflection includes a confidence score:

| Score | Level | HITL Behavior |
|---|---|---|
| 0.9 — 1.0 | **High** | Auto-proceed (if practice has enabled auto-mode) |
| 0.7 — 0.89 | **Medium** | Proceed with notification to admin |
| 0.5 — 0.69 | **Low** | Pause and require explicit approval |
| 0.0 — 0.49 | **Very Low** | Halt execution and escalate to admin |

---

## 3. Human-in-the-Loop (HITL) Framework

### 3.1 Approval Workflow

```
Agent Step Completes
        │
        ▼
  ┌─────────────┐
  │ HITL Gate    │
  │ Required?    │──── NO ────▶ Continue (auto-approved)
  └──────┬──────┘
         │ YES
         ▼
  ┌─────────────┐
  │ Create       │
  │ Approval     │
  │ Request      │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐    ┌──────────┐    ┌──────────────┐
  │ Notify       │───▶│ Admin    │───▶│ Admin        │
  │ Admin        │    │ Reviews  │    │ Decides      │
  └─────────────┘    └──────────┘    └──────┬───────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                    ┌──────────┐     ┌──────────┐     ┌──────────┐
                    │ APPROVE  │     │ REJECT   │     │ MODIFY   │
                    │          │     │          │     │ & APPROVE│
                    └────┬─────┘     └────┬─────┘     └────┬─────┘
                         │                │                 │
                         ▼                ▼                 ▼
                    Continue          Halt Agent       Update Plan
                    Execution         + Log Reason     + Continue
```

### 3.2 Approval Request Structure

Each HITL checkpoint generates an approval request containing:

- **Agent Name** — which agent is requesting
- **Run ID** — unique execution identifier
- **Location** — which practice location this run applies to
- **Phase** — which GPAORI phase (Plan, Act, Observe, Reflect, Iterate)
- **Step Number** — current step in the plan
- **Summary** — human-readable description of what happened / what's proposed
- **Details** — full data payload for review
- **Confidence Score** — agent's self-assessed confidence (0.0–1.0)
- **Options** — Approve / Reject / Modify
- **Deadline** — optional time limit before auto-escalation
- **Context** — link to patient, shift, claim, or other entity involved

### 3.3 Notification Channels

| Channel | Use Case |
|---|---|
| **In-App Dashboard** | Primary — always available, shows queue of pending approvals |
| **Email (Resend)** | For high-priority or time-sensitive approvals |
| **Chrome Extension** | Badge alert for pending agent approvals |
| **Mobile Push** | Future — for mobile app users |

### 3.4 Autonomy Levels (Practice-Configurable)

Practices can configure how much autonomy each agent has. Configuration can be set at the practice level (applies to all locations) or overridden per location:

| Level | Name | Behavior |
|---|---|---|
| 1 | **Full Supervision** | Every GPAORI phase requires approval (default for new agents) |
| 2 | **Plan Approval** | Admin approves the plan; individual steps auto-execute if confidence > 0.7 |
| 3 | **Exception-Based** | Agent runs autonomously; only pauses on low confidence or errors |
| 4 | **Full Autonomy** | Agent runs end-to-end with post-execution reporting (audit only) |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         EtherAI-Dental Platform                          │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐       │
│  │  Frontend     │    │  Chrome Ext   │    │  Mobile App          │       │
│  │  (React)      │    │  (Manifest V3)│    │  (iOS/Android)       │       │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘       │
│         │                   │                        │                   │
│         └───────────────────┼────────────────────────┘                   │
│                             │                                            │
│                      ┌──────▼──────┐                                    │
│                      │  API Layer   │                                    │
│                      │  (Express)   │                                    │
│                      └──────┬──────┘                                    │
│                             │                                            │
│         ┌───────────────────┼───────────────────┐                       │
│         │                   │                   │                        │
│  ┌──────▼──────┐     ┌─────▼─────┐     ┌───────▼───────┐              │
│  │ Agent        │     │ HITL      │     │ Subscription  │              │
│  │ Orchestrator │     │ Engine    │     │ & Metering    │              │
│  └──────┬──────┘     └─────┬─────┘     └───────┬───────┘              │
│         │                   │                   │                        │
│  ┌──────▼──────┐     ┌─────▼─────┐     ┌───────▼───────┐              │
│  │ Agent        │     │ Agent     │     │ DSO/Practice  │              │
│  │ Runtime      │     │ Registry  │     │ Hierarchy     │              │
│  └──────┬──────┘     └───────────┘     └───────────────┘              │
│         │                                                               │
│  ┌──────▼──────────────────────────────────────────────┐               │
│  │                    Agent Instances                    │               │
│  │                                                      │               │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │               │
│  │  │ Verify     │  │ Shift      │  │ Claims     │    │               │
│  │  │ Agent      │  │ Matchmaker │  │ Agent      │    │               │
│  │  │ @Location1 │  │ @Location1 │  │ @Location2 │    │               │
│  │  └────────────┘  └────────────┘  └────────────┘    │               │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │               │
│  │  │ Comms      │  │ Creds      │  │ Revenue    │    │               │
│  │  │ Agent      │  │ Agent      │  │ Agent      │    │               │
│  │  │ @Location3 │  │ @Practice  │  │ @Practice  │    │               │
│  │  └────────────┘  └────────────┘  └────────────┘    │               │
│  └──────────────────────┬──────────────────────────────┘               │
│                          │                                               │
│              ┌───────────┼────────────┐                                  │
│              │           │            │                                   │
│        ┌─────▼────┐ ┌───▼────┐ ┌─────▼──────┐                          │
│        │PostgreSQL │ │ OpenAI │ │ External   │                          │
│        │  Database │ │  API   │ │ Services   │                          │
│        └──────────┘ └────────┘ │(DentalXch, │                          │
│                                │ Availity,  │                           │
│                                │ Stripe,    │                           │
│                                │ Resend)    │                           │
│                                └────────────┘                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Descriptions

| Component | Responsibility |
|---|---|
| **Agent Orchestrator** | Manages agent lifecycle: create, start, pause, resume, cancel. Enforces GPAORI sequence. Spawns location-specific runs. |
| **HITL Engine** | Creates approval requests, tracks decisions, enforces timeouts, manages notification dispatch. Routes approvals to the correct admin level (location manager or DSO admin). |
| **Agent Registry** | Stores agent definitions, configurations, and autonomy settings per practice and per location. |
| **Agent Runtime** | Executes individual agent instances. Each run is isolated with its own state and scoped to a specific location (or practice-wide for aggregate agents). |
| **Subscription & Metering** | Tracks agent run counts against subscription limits, manages billing via Stripe, enforces tier-based access. |
| **DSO/Practice Hierarchy** | Manages the relationship between DSO organizations, practices, and locations. Controls config inheritance and reporting rollups. |
| **OpenAI API** | Powers reasoning (Plan, Reflect phases), natural language summaries, and confidence scoring. |

---

## 5. Human-Agent Interaction Model

This section defines the relationship between human users, AI agents, and the Chrome Extension — clarifying who does what, when, and how they interact.

### 5.1 Two Operating Modes

The EtherAI-Dental platform has two fundamentally different operating modes for insurance verification, staffing, and practice operations:

| | Chrome Extension (Human Mode) | AI Agents (Automated Mode) |
|---|---|---|
| **Where it runs** | In the user's Chrome browser, overlaid on their PMS | On the server as background processes |
| **Who triggers it** | Human clicks a button or opens the panel | Scheduled cron job, manual trigger from dashboard, or another agent |
| **Data source** | Reads from the PMS screen the human is viewing | Reads directly from the platform database |
| **Scope** | One patient at a time, on-demand | Batch processing (e.g., all 25 patients for tomorrow) |
| **Speed** | Real-time, interactive | Asynchronous, may take minutes for large batches |
| **Decision-making** | Human decides what to do with results | Agent proposes actions, human approves via HITL |
| **Requires browser** | Yes — Chrome with extension installed | No — runs headlessly on the server |
| **Use case** | "I'm looking at this patient right now and need to check their coverage" | "Verify all patients scheduled tomorrow across all 3 locations before staff arrives" |

**Key principle:** The AI agents do NOT use the Chrome Extension. They are server-side processes that operate independently of any browser session. The extension is exclusively a human interface.

### 5.2 Chrome Extension as the Bridge

While the extension is a human tool, it can serve as a **bridge** between humans and agents — giving humans visibility into agent activity and a lightweight way to act on agent outputs without switching to the full platform dashboard.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Human Workflow                                │
│                                                                      │
│   Front Desk Staff                                                   │
│        │                                                             │
│        ▼                                                             │
│   ┌──────────────┐     ┌──────────────────────┐                     │
│   │ Dental PMS    │     │ Chrome Extension      │                     │
│   │ (Dentrix,     │────▶│ Side Panel            │                     │
│   │  Curve, etc.) │     │                       │                     │
│   └──────────────┘     │  ┌─ Eligibility Tab   │                     │
│                         │  │  (Manual check)    │                     │
│                         │  ├─ Benefits Tab      │                     │
│                         │  │  (AI summary)      │                     │
│                         │  ├─ Shifts Tab        │                     │
│                         │  │  (Open positions)  │                     │
│                         │  └─ Agent Hub Tab ◀───┼── NEW              │
│                         │     (Agent alerts,    │                     │
│                         │      HITL approvals,  │                     │
│                         │      status monitor)  │                     │
│                         └──────────┬────────────┘                     │
│                                    │                                  │
│                                    │ API calls                        │
│                                    │                                  │
└────────────────────────────────────┼──────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       EtherAI-Dental Backend                           │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                    Shared Database                             │    │
│   │  patients, verifications, shifts, approvals, agent_runs       │    │
│   └──────────────────────────────┬───────────────────────────────┘    │
│                                   │                                    │
│          ┌────────────────────────┼──────────────────────┐            │
│          │                        │                      │             │
│   ┌──────▼──────┐         ┌──────▼──────┐        ┌──────▼──────┐    │
│   │ Insurance    │         │ Shift       │        │ Claims      │    │
│   │ Verify Agent │         │ Matchmaker  │        │ Follow-Up   │    │
│   │ (scheduled   │         │ Agent       │        │ Agent       │    │
│   │  6PM daily)  │         │ (triggered) │        │ (weekly)    │    │
│   └─────────────┘         └─────────────┘        └─────────────┘    │
│                                                                        │
│   ┌─────────────┐         ┌─────────────┐        ┌─────────────┐    │
│   │ Patient     │         │ Credential  │        │ Revenue     │    │
│   │ Comms Agent │         │ Monitor     │        │ Intelligence│    │
│   └─────────────┘         └─────────────┘        └─────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Interaction Patterns by Role

#### Front Desk Staff (Extension User)
| Scenario | Tool Used | What Happens |
|---|---|---|
| Patient walks in, staff needs to verify coverage | **Chrome Extension** | Staff views patient in PMS, extension auto-detects data, staff clicks "Verify" |
| Agent already verified this patient last night | **Chrome Extension** | Extension shows "Already verified" badge with timestamp; staff skips manual check |
| Agent found inactive coverage for a patient | **Chrome Extension (Agent Hub)** | Alert appears: "Agent flagged 3 patients with expired coverage — review needed" |
| Open shift needs to be filled | **Chrome Extension (Shifts tab)** | Staff sees count and details, can escalate to admin |

#### Practice Admin / Office Manager (Extension + Dashboard User)
| Scenario | Tool Used | What Happens |
|---|---|---|
| Review overnight agent results | **Platform Dashboard** or **Extension (Agent Hub)** | Summary of what agents accomplished while staff was away |
| Approve agent actions (e.g., resubmit a corrected claim) | **Platform Dashboard** or **Extension (Agent Hub)** | HITL approval queue with one-click approve/reject |
| Configure agent schedules and autonomy | **Platform Dashboard** | Settings page — not in extension (too complex for side panel) |
| Quick check on agent status mid-day | **Chrome Extension (Agent Hub)** | Compact view: last run time, success rate, pending approvals count |

#### DSO Administrator (Dashboard Only)
| Scenario | Tool Used | What Happens |
|---|---|---|
| Cross-location performance comparison | **Platform Dashboard** | DSO executive dashboard with rollup metrics |
| Adjust agent autonomy for a location | **Platform Dashboard** | Configuration inheritance: Organization → Practice → Location |
| Review usage and billing | **Platform Dashboard** | Subscription and metering UI |

**Rule of thumb:** The Chrome Extension is for **quick, in-context actions** while working in the PMS. The Platform Dashboard is for **configuration, reporting, and complex decisions**. Some features appear in both (agent alerts, approvals), but the extension shows a simplified view.

### 5.4 Extension-Agent Integration Features

These features bring agent activity into the Chrome Extension side panel, allowing humans to monitor and interact with agents without leaving their PMS:

#### 5.4.1 Agent Hub Tab (New)

A fourth tab in the Chrome Extension side panel:

```
┌──────────────────────────────────────────────┐
│  Eligibility │ Benefits │ Shifts │ Agent Hub  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  ⚡ 3 items need your attention       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Insurance Verification Agent         │   │
│  │  Last run: Today 6:15 PM              │   │
│  │  Result: 22/25 verified ✓             │   │
│  │  ⚠ 3 inactive policies found         │   │
│  │  [View Details]                       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  ⏳ Pending Approval                  │   │
│  │  "Resubmit claim #4821 with          │   │
│  │   corrected code D2740→D2750"        │   │
│  │  Confidence: 94%                      │   │
│  │  [Approve] [Reject] [View Full]       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Credential Monitor                   │   │
│  │  Last run: Today 2:00 AM              │   │
│  │  ⚠ 2 expiring in 14 days             │   │
│  │  [View Report]                        │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

**Features:**
- Pending HITL approval count badge on the Agent Hub tab (similar to shift count badge)
- Compact agent status cards showing last run, result summary, and action items
- Inline approve/reject buttons for simple HITL decisions (Level 1-2)
- "View Full" links to the platform dashboard for complex reviews
- Location filter for multi-location practices

#### 5.4.2 Agent Alert Badge

The extension toolbar icon already shows open shift count. With agent integration, it also shows:
- Combined badge: open shifts + pending approvals (e.g., "5" = 2 shifts + 3 approvals)
- Color coding: teal (normal), amber (approvals pending), red (urgent/expired)

#### 5.4.3 Agent Context in Eligibility Tab

When a staff member views a patient in the extension:
- If the Insurance Verification Agent already checked this patient, show the result with timestamp instead of asking the staff to re-check
- Label: "Verified by AI Agent — Today 6:22 PM" vs. "Verified manually — Now"
- Staff can still re-run manually if desired (override)

#### 5.4.4 Notification Preferences

Users configure which agent events they want to see in the extension:

| Event Type | Default | Configurable |
|---|---|---|
| HITL approval required | Always shown | Cannot disable |
| Agent run completed | Shown | Can disable |
| Agent found issues | Shown | Can disable |
| Credential expiring | Shown | Can disable |
| Agent error/failure | Shown | Cannot disable |

### 5.5 Data Flow: Human ↔ Agent ↔ Extension

#### Scenario 1: Agent Verifies, Human Reviews in Extension

```
6:00 PM — Insurance Agent starts scheduled run
         │
         ▼
6:05 PM — Agent queries appointments table: 25 patients for tomorrow at Location 1
         │
         ▼
6:12 PM — Agent completes: 22 active, 2 inactive, 1 failed lookup
         │
         ▼
6:12 PM — Agent writes results to verifications table
         Agent creates 2 action items: "Contact patient #42 and #67 about expired coverage"
         Agent creates HITL approval request for action items
         │
         ▼
6:12 PM — Extension badge updates (via polling): "2" (2 pending approvals)
         │
         ▼
Next morning — Staff opens PMS, sees extension badge "2"
         │
         ▼
Staff clicks Agent Hub tab → sees approval requests
         │
         ▼
Staff clicks "Approve" on contacting patients → Agent sends emails via Patient Comms Agent
         │
         ▼
Staff views patient #42 in PMS → Extension Eligibility tab shows:
  "⚠ Inactive — Verified by AI Agent, Yesterday 6:12 PM"
  "Coverage expired 01/15/2026. Patient was notified via email."
```

#### Scenario 2: Human Verifies in Extension, Agent Uses Result Later

```
10:30 AM — Walk-in patient not on tomorrow's schedule
          │
          ▼
10:30 AM — Staff uses Extension to manually verify eligibility
          │
          ▼
10:30 AM — Result saved to verifications table: Active, Delta Dental PPO
          │
          ▼
6:00 PM  — Insurance Agent starts evening run
          │
          ▼
6:01 PM  — Agent finds this patient already verified today → skips
          Agent log: "Patient #88 — already verified (manual, 10:30 AM). Skipping."
          │
          ▼
          ✓ No duplicate work — human and agent share the same data layer
```

#### Scenario 3: DSO Admin Monitors Multiple Locations via Extension

```
DSO Admin opens Chrome → Extension badge: "7" (5 approvals + 2 alerts)
         │
         ▼
Agent Hub tab shows location-grouped view:
  📍 Main Office: 2 approvals pending
  📍 West Branch: 3 approvals pending  
  📍 North Clinic: ✓ All clear
         │
         ▼
Admin approves 4 routine items inline (insurance follow-ups)
         │
         ▼
Admin clicks "View Full" on 1 complex denial → opens Platform Dashboard
         │
         ▼
Extension badge updates: "2" (remaining items)
```

### 5.6 What Stays in the Dashboard vs. Extension

| Feature | Platform Dashboard | Chrome Extension |
|---|---|---|
| Agent configuration (enable, schedule, autonomy) | ✅ Full control | ❌ Not available |
| Agent run history and audit logs | ✅ Full detail | 🟡 Last run summary only |
| HITL approval queue | ✅ Full with detail | ✅ Compact with approve/reject |
| Cross-location analytics | ✅ Full dashboard | ❌ Not available |
| Manual eligibility verification | 🟡 Available | ✅ Primary use case |
| Benefits AI summary | 🟡 In verification detail | ✅ Primary use case |
| Staffing alerts | ✅ Full management | ✅ Alert count + details |
| Subscription management | ✅ Full control | ❌ Not available |
| Agent notifications and alerts | ✅ In-app + email | ✅ Badge + Agent Hub tab |
| Practice/NPI/Tax ID configuration | ✅ Settings page | ❌ Not available |

### 5.7 Extension API Additions for Agent Integration

New endpoints needed to support the Agent Hub tab:

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/extension/agents/status` | GET | JWT | Returns compact status of all enabled agents for the practice |
| `/api/extension/agents/approvals` | GET | JWT | Returns pending HITL approvals for the logged-in admin |
| `/api/extension/agents/approvals/:id/decide` | POST | JWT | Submit approve/reject decision from the extension |
| `/api/extension/agents/alerts/count` | GET | JWT | Returns combined count (pending approvals + agent alerts) for badge |
| `/api/extension/agents/patient/:patientId/verification` | GET | JWT | Returns most recent verification result for a patient (agent or manual) |

---

## 6. DSO & Multi-Location Hierarchy

### 6.1 Entity Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      DSO Organization                        │
│                  "Bright Smile Partners"                      │
│                                                              │
│   ┌─────────────────────┐    ┌─────────────────────┐        │
│   │  Practice A          │    │  Practice B          │        │
│   │  "Downtown Dental"   │    │  "Suburban Smiles"   │        │
│   │                      │    │                      │        │
│   │  ┌────────────────┐  │    │  ┌────────────────┐  │        │
│   │  │ Location 1     │  │    │  │ Location 1     │  │        │
│   │  │ "Main Office"  │  │    │  │ "Elm Street"   │  │        │
│   │  └────────────────┘  │    │  └────────────────┘  │        │
│   │  ┌────────────────┐  │    │  ┌────────────────┐  │        │
│   │  │ Location 2     │  │    │  │ Location 2     │  │        │
│   │  │ "West Branch"  │  │    │  │ "Oak Avenue"   │  │        │
│   │  └────────────────┘  │    │  └────────────────┘  │        │
│   │  ┌────────────────┐  │    │  ┌────────────────┐  │        │
│   │  │ Location 3     │  │    │  │ Location 3     │  │        │
│   │  │ "North Clinic" │  │    │  │ "Mall Dental"  │  │        │
│   │  └────────────────┘  │    │  └────────────────┘  │        │
│   └─────────────────────┘    └─────────────────────┘        │
│                                                              │
│   Agent Subscription: Enterprise @ $249/mo × 6 locations    │
│   Total: $1,494/mo                                           │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Configuration Inheritance

Agent settings follow a **cascading inheritance** model — more specific settings override less specific ones:

```
DSO Organization Defaults
    │
    ▼
Practice-Level Defaults (can override DSO defaults)
    │
    ▼
Location-Level Overrides (can override practice defaults)
```

| Setting | DSO Level | Practice Level | Location Level |
|---|---|---|---|
| Agent enabled/disabled | Default for all practices | Override per practice | Override per location |
| Autonomy level | Default starting level | Override per practice | Override per location |
| Schedule (cron) | N/A | Default schedule | Override (e.g., different time zones) |
| Notification channels | Default channels | Override per practice | Override per location |
| HITL approvers | DSO admin pool | Practice admins | Location managers |

**Example:** A DSO enables the Insurance Verification Agent at autonomy level 2 for all practices. Practice A overrides to level 3 (exception-based) because they trust the system. Location 2 of Practice A overrides back to level 1 (full supervision) because they're a new office still learning the workflow.

### 6.3 Execution Scope: Location vs. Practice

Each agent type has a natural execution scope:

| Agent | Execution Level | Reason |
|---|---|---|
| **Insurance Verification** | Per Location | Appointments and patients are location-specific |
| **Shift Matchmaker** | Per Location | Shifts belong to specific locations; distance calculations are location-specific |
| **Claims Follow-Up** | Per Location | Claims are tied to location-specific services |
| **Patient Communication** | Per Location | Appointment reminders reference specific location addresses and times |
| **Credential Monitoring** | Per Practice | Professionals work across locations; credentials are person-level not location-level |
| **Revenue Cycle Intelligence** | Both | Per-location analysis for operational insights; per-practice/DSO rollup for strategic decisions |

### 6.4 Reporting Rollup

```
Location-Level Reports
    │ Aggregate ───▶ Practice-Level Dashboards
    │                      │ Aggregate ───▶ DSO-Level Executive Dashboard
    │                      │
    │                      └── Cross-Location Comparisons
    │                          "Location 2 has 3x the denial rate of Location 1"
    │
    └── Location-Specific Details
        "Location 1: 95% verification success rate, 12 shifts filled this week"
```

### 6.5 Admin Roles in DSO Context

| Role | Scope | Agent Permissions |
|---|---|---|
| **DSO Admin** | All practices + all locations | Configure defaults, view all runs/reports, approve at any level, manage subscriptions |
| **Practice Admin** | One practice + all its locations | Configure practice-level settings, approve for any owned location, view practice reports |
| **Location Manager** | One specific location | Approve agent runs for their location, view location reports, cannot change config |
| **Front Desk Staff** | One specific location | View agent results and notifications only (no approval authority) |

---

## 7. Core Infrastructure

### 7.1 Agent Run State Machine

```
                    ┌────────────┐
                    │  CREATED   │
                    └─────┬──────┘
                          │ start()
                          ▼
                    ┌────────────┐
              ┌────▶│  PLANNING  │◀─── modify_plan()
              │     └─────┬──────┘
              │           │ plan_approved()
              │           ▼
              │     ┌────────────┐
              │     │  EXECUTING │◀─── resume()
              │     └─────┬──────┘
              │           │
              │     ┌─────┼─────────────────┐
              │     │     │                 │
              │     ▼     ▼                 ▼
              │  ┌──────┐ ┌──────────┐  ┌────────┐
              │  │PAUSED│ │WAITING   │  │ ERROR  │
              │  │(HITL)│ │_APPROVAL │  │        │
              │  └──┬───┘ └────┬─────┘  └───┬────┘
              │     │          │             │
              │     │     ┌────┼────┐        │ retry()
              │     │     ▼    ▼    ▼        │
              │     │  approve reject modify │
              │     │     │    │      │      │
              │     └─────┘    │      └──────┘
              │                ▼
              │          ┌──────────┐
              │          │ REJECTED │
              │          └──────────┘
              │
              │     step_complete()
              │           │
              │           ▼
              │     ┌────────────┐
              │     │ REFLECTING │
              │     └─────┬──────┘
              │           │
              │     ┌─────┼──────┐
              │     ▼            ▼
              │  iterate()   complete()
              │     │            │
              └─────┘            ▼
                           ┌────────────┐
                           │ COMPLETED  │
                           └────────────┘
```

### 7.2 GPAORI Step Execution Flow

For each step in an agent's plan, the runtime executes:

```typescript
interface GPAORIStep {
  stepNumber: number;
  phase: "goal" | "plan" | "act" | "observe" | "reflect" | "iterate";
  
  // Scope
  locationId: string | null;
  
  // Input
  input: Record<string, any>;
  
  // Output
  output: Record<string, any> | null;
  status: "pending" | "executing" | "waiting_approval" | "approved" | 
          "rejected" | "completed" | "failed";
  
  // HITL
  requiresApproval: boolean;
  approvalId: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  approvalNotes: string | null;
  
  // AI
  confidenceScore: number | null;
  aiReasoning: string | null;
  
  // Metering
  tokensUsed: number;
  
  // Timing
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
}
```

### 7.3 OpenAI Integration Pattern

Each GPAORI phase uses OpenAI differently:

| Phase | OpenAI Role | Model | Prompt Pattern |
|---|---|---|---|
| **Goal** | Parse and structure the goal | gpt-4o-mini | "Given this objective, extract structured goal with success criteria" |
| **Plan** | Generate step-by-step plan | gpt-4o | "Given this goal and available tools, create an execution plan" |
| **Act** | Determine action parameters | gpt-4o-mini | "Given this step, determine the correct API call/query" |
| **Observe** | Analyze action results | gpt-4o | "Analyze this result. Was the action successful? Extract key data." |
| **Reflect** | Evaluate progress and decide | gpt-4o | "Given goal, plan, and progress so far, assess and recommend next." |
| **Iterate** | Decide continue/retry/complete | gpt-4o-mini | "Should we continue, retry, modify, or complete?" |

### 7.4 Multi-Location Agent Scheduling

When a scheduled agent fires, the orchestrator spawns separate runs for each applicable location:

```
Scheduled Trigger: "Insurance Verification — Daily 6PM"
    │
    ├── Practice A
    │       │
    │       ├── Run for Location 1 "Main Office" (18 patients)
    │       ├── Run for Location 2 "West Branch" (12 patients)
    │       └── Run for Location 3 "North Clinic" (8 patients)
    │
    └── Practice B
            │
            ├── Run for Location 1 "Elm Street" (22 patients)
            ├── Run for Location 2 "Oak Avenue" (15 patients)
            └── Run for Location 3 "Mall Dental" (9 patients)

Total: 6 agent runs, each metered separately
```

For practice-level agents (e.g., Credential Monitoring), a single run covers all professionals in the practice, regardless of which locations they're assigned to.

---

## 8. Agent Definitions

### 8.1 Insurance Verification Agent

**Purpose:** Automatically verify insurance eligibility for patients with upcoming appointments.  
**Execution Level:** Per Location

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Verify insurance eligibility for all patients with appointments at [Location Name] in the next N days" | Admin confirms date range, location, and patient scope |
| **Plan** | 1. Query appointments for date range at this location. 2. Identify patients needing verification. 3. For each patient, fetch insurance policy. 4. Run eligibility check via DentalXchange/Availity. 5. Record results. 6. Flag issues. | Admin reviews patient list and approves batch |
| **Act** | Execute eligibility API call for each patient | Auto-proceed if confidence > 0.7; pause on errors |
| **Observe** | Parse eligibility response — coverage active? benefits available? | Display results summary to admin |
| **Reflect** | "15/18 patients verified active. 2 inactive. 1 failed (payer timeout)." | Admin reviews failed/inactive cases |
| **Iterate** | Retry failed checks. Flag inactive patients for front desk follow-up. | Admin approves notifications to front desk |

#### Integration Points
- **Input:** `appointments` table (filtered by location), `insurance_policies` table, `patients` table
- **External APIs:** DentalXchange (dental), Availity (medical)
- **Output:** `verifications` table, `benefits` table, `verification_queue` updates

#### Trigger Options
- Scheduled: Daily at configured time (e.g., 6 PM for next-day appointments) — runs per location
- Manual: Admin triggers from dashboard for specific location
- Event-driven: New appointment created at a location

---

### 8.2 AI Shift Matchmaker Agent

**Purpose:** Match open shifts with the best-fit available professionals.  
**Execution Level:** Per Location

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Find and recommend the best professionals for open shifts at [Location Name]" | Admin confirms which shifts to fill |
| **Plan** | 1. Get open shifts with requirements at this location. 2. Query eligible professionals (license, location, availability). 3. Score candidates on fit criteria. 4. Rank and recommend top 3-5 per shift. 5. Send invitations to approved candidates. | Admin reviews matching criteria weights |
| **Act** | Run matching algorithm: license match, distance calc from this location (Google Maps), availability check, performance history, rate compatibility | Present ranked candidates with scores and reasoning |
| **Observe** | "Shift #42 (Hygienist, Mon 8AM): 12 eligible, top match Dr. Sarah J. (score: 0.94 — 3.2 miles from Main Office, 4.8 rating, $55/hr within range)" | Admin reviews all match recommendations |
| **Reflect** | "8/10 shifts have strong matches (>0.8). 2 shifts have weak matches — may need rate adjustment or broader search radius." | Admin decides on weak matches |
| **Iterate** | Send shift invitations to approved matches. For weak matches, suggest rate increase or expanded search. | Admin approves each invitation before sending |

#### Scoring Criteria

| Factor | Weight (Default) | Source |
|---|---|---|
| License/Credential Match | 30% | `professional_certifications`, `staff_roles` |
| Distance from **Location** | 20% | Google Maps Geocoding API (uses location address, not practice HQ) |
| Availability Match | 20% | `professional_preferences` |
| Performance Rating | 15% | `shift_transactions` (past completed shifts) |
| Rate Compatibility | 15% | `professional_preferences.minHourlyRate` vs shift rate |

#### Integration Points
- **Input:** `staff_shifts` (open, filtered by location), `professionals`, `professional_preferences`, `professional_certifications`
- **External APIs:** Google Maps (distance from location), OpenAI (explanation generation)
- **Output:** `shift_negotiations` (invitations), notifications

---

### 8.3 Claims Follow-Up Agent

**Purpose:** Monitor submitted insurance claims and automate follow-up on unpaid/denied claims.  
**Execution Level:** Per Location

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Review all claims older than 30 days without payment at [Location Name] and determine follow-up actions" | Admin confirms aging threshold, location, and scope |
| **Plan** | 1. Query claims by aging buckets (30/60/90+ days) for this location. 2. Check claim status with clearinghouse. 3. Categorize: pending, denied (with reason), partially paid. 4. Generate follow-up actions per category. 5. Execute approved actions. | Admin reviews aging report and action plan |
| **Act** | For denied: identify denial reason, suggest corrective action. For pending: check status. For partial: calculate remaining balance. | Pause on each denial — admin reviews corrective action |
| **Observe** | "47 claims reviewed at Main Office. 32 pending (normal), 8 denied (3 coding errors, 2 missing info, 3 eligibility), 7 partially paid." | Full report to admin |
| **Reflect** | "Coding errors can be auto-corrected and resubmitted. Missing info requires patient contact. Eligibility denials need manual review." | Admin approves categorized actions |
| **Iterate** | Resubmit corrected claims. Queue patient contact for missing info. Flag eligibility denials for manual review. | Admin approves each resubmission |

#### Integration Points
- **Input:** Claims data (future `claims` table, filtered by location), `patient_billing`
- **External APIs:** Office Ally (claims status), DentalXchange
- **Output:** Resubmitted claims, follow-up tasks, aging reports

---

### 8.4 Patient Communication Agent

**Purpose:** Send automated, contextual communications to patients (reminders, verification updates, billing).  
**Execution Level:** Per Location

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Send appointment reminders and insurance verification updates for tomorrow's patients at [Location Name]" | Admin confirms communication scope and location |
| **Plan** | 1. Get tomorrow's appointments at this location. 2. Check verification status for each. 3. Draft messages per patient (reminder + verification status, include location address/phone). 4. Select channel (email/SMS). 5. Send approved messages. | Admin reviews message templates and patient list |
| **Act** | Draft personalized messages using AI. Example: "Hi [Name], reminder: your appointment is tomorrow at [time] at our [Location Name] office ([address]). Great news — we've confirmed your insurance is active with Delta Dental." | Admin reviews each message before sending (Level 1) or reviews template only (Level 2+) |
| **Observe** | Track delivery status: sent, delivered, opened, bounced, failed | Delivery report to admin |
| **Reflect** | "22/25 messages delivered. 2 bounced (invalid email). 1 patient has no contact info." | Admin handles bounced/missing contacts |
| **Iterate** | Update patient records with bounced status. Flag missing contact info. | Admin approves record updates |

#### Message Types

| Type | Trigger | Channel | Template |
|---|---|---|---|
| Appointment Reminder | 24h before appointment | Email + SMS | "Your appointment is tomorrow at {time} at {location_name}..." |
| Verification Complete | After agent verifies insurance | Email | "We've verified your insurance coverage for your visit to {location_name}..." |
| Benefits Summary | After eligibility check | Email | "Here's a summary of your dental benefits..." |
| Balance Due | After billing processed | Email | "You have an outstanding balance of ${amount} at {location_name}..." |
| Payment Confirmation | After payment received | Email | "Thank you for your payment of ${amount}..." |

#### Integration Points
- **Input:** `appointments` (filtered by location), `patients`, `verifications`, `patient_billing`
- **External APIs:** Resend (email), future SMS provider
- **Output:** Communication logs, delivery tracking

---

### 8.5 Credential Monitoring Agent

**Purpose:** Track contractor credentials and proactively alert on expirations, renewals, and compliance gaps.  
**Execution Level:** Per Practice (cross-location)

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Monitor all active contractor credentials for [Practice Name] and identify any expiring within 60 days" | Admin confirms monitoring scope and thresholds |
| **Plan** | 1. Query all active professionals across all locations. 2. Check each credential type (license, NPI, malpractice, background, CPR/BLS, immunizations). 3. Calculate days until expiration. 4. Categorize: expired, critical (<14 days), warning (14-30), upcoming (30-60). 5. Generate notifications. | Admin reviews thresholds |
| **Act** | Scan credential records and calculate expiration status for each professional | Auto-proceed (read-only operation) |
| **Observe** | "142 professionals scanned across 3 locations. 3 expired credentials, 5 critical, 12 warning, 18 upcoming." | Full compliance dashboard to admin |
| **Reflect** | "3 professionals with expired credentials should be suspended from shift eligibility at all locations. 5 critical need immediate outreach." | Admin reviews suspension recommendations |
| **Iterate** | Send renewal reminders to professionals. Suspend shift eligibility for expired (if approved). Schedule re-check in 24h. | Admin approves suspensions and notifications |

#### Credential Types Monitored

| Credential | Source Table | Expiration Field | Renewal Period |
|---|---|---|---|
| Professional License | `contractor_documents` | `expirationDate` | Annual |
| NPI Number | `contractor_documents` | N/A (verify active) | Continuous |
| Malpractice Insurance | `contractor_documents` | `expirationDate` | Annual |
| Background Check | `contractor_documents` | `expirationDate` | Biennial |
| CPR/BLS Certification | `contractor_documents` | `expirationDate` | Biennial |
| Immunization Records | `contractor_documents` | `expirationDate` | Varies |

#### Integration Points
- **Input:** `professionals`, `contractor_documents`, `professional_certifications` (all locations)
- **External APIs:** Resend (notifications), future license verification APIs
- **Output:** Compliance reports, suspension actions, renewal notifications

---

### 8.6 Revenue Cycle Intelligence Agent

**Purpose:** Analyze financial data across the practice to identify revenue optimization opportunities.  
**Execution Level:** Both (per-location analysis + practice/DSO rollup)

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Analyze this month's revenue cycle for [Practice Name] across all locations and identify optimization opportunities" | Admin confirms analysis period, scope, and which locations |
| **Plan** | 1. Aggregate billing data by category and by location. 2. Calculate collection rates per location. 3. Identify under-coded procedures. 4. Analyze payer mix and reimbursement rates. 5. Compare location performance. 6. Project revenue trends. 7. Generate actionable recommendations. | Admin reviews analysis parameters |
| **Act** | Query billing, payment, and verification data across all locations. Run statistical analysis. Use AI to identify patterns. | Auto-proceed (read-only analysis) |
| **Observe** | "Practice-wide collection rate: 87%. Location 1: 92% (on target). Location 2: 78% (below benchmark). Top denial reason at Location 2: missing pre-auth (34%)." | Full analytics dashboard with cross-location comparison |
| **Reflect** | "Location 2 is pulling down the practice average. Pre-auth denials are the primary revenue leak — estimated annual impact: $45,000. Location 1's workflow could be replicated." | Admin reviews findings and recommendations |
| **Iterate** | Generate specific action items per location: update pre-auth workflow at Location 2, flag under-coded procedures, adjust fee schedule for underperforming payers. | Admin approves each recommendation |

#### Analytics Produced

| Metric | Calculation | Benchmark | Scope |
|---|---|---|---|
| Collection Rate | Payments / Billed Amount | > 92% | Per location + practice rollup |
| Days to Payment | Avg days from service to payment | < 30 days | Per location |
| Denial Rate | Denied claims / Total claims | < 5% | Per location + by payer |
| Write-Off Rate | Write-offs / Billed Amount | < 3% | Per location |
| Payer Mix Efficiency | Revenue by payer vs effort | Varies | Per location + practice rollup |
| Location Comparison | Relative performance across locations | Internal benchmark | Practice/DSO level |

#### Integration Points
- **Input:** `patient_billing`, `patient_payments`, `verifications`, `shift_transactions` (all locations or filtered)
- **External APIs:** OpenAI (pattern analysis, natural language insights)
- **Output:** Analytics reports per location, practice rollup, DSO executive dashboard, action items

---

## 9. Pricing & Subscription Model

### 9.1 Pricing Philosophy

The AI agent pricing follows three principles:

1. **Predictable billing** — Healthcare organizations budget annually; no surprise bills
2. **Scale with value** — DSOs with more locations generate more value and pay more, but get volume discounts
3. **Land and expand** — Low entry point for solo practices; grow naturally as they add agents and locations

### 9.2 Subscription Tiers

| | Starter | Professional | Enterprise (DSO) |
|---|---|---|---|
| **Price** | $149/mo per practice | $349/mo per practice | $249/mo per location |
| **Agents Included** | 2 (choose any) | 4 (choose any) | All 6 agents |
| **Agent Runs/Month** | 500 | 2,000 | Unlimited |
| **Locations** | 1 | Up to 5 | Unlimited |
| **Autonomy Levels** | Level 1-2 only | Level 1-3 | Level 1-4 (Full Autonomy) |
| **HITL Approvals** | In-app only | In-app + Email | In-app + Email + Chrome Ext + Mobile |
| **Reporting** | Location-level | Practice-level rollup | DSO-level executive dashboard |
| **Cross-Location Comparison** | N/A | Basic | Advanced with benchmarking |
| **Support** | Email | Priority email | Dedicated account manager |
| **Overage Rate** | $0.15/run | $0.10/run | N/A (unlimited) |

### 9.3 Pricing Examples

| Customer Type | Configuration | Monthly Cost |
|---|---|---|
| **Solo practice, 1 location** | Starter: Insurance Verification + Shift Matchmaker | $149/mo |
| **Growing practice, 3 locations** | Professional: 4 agents across 3 locations | $349/mo |
| **Small DSO, 8 locations** | Enterprise: $249 × 8 locations | $1,992/mo |
| **Mid DSO, 25 locations** | Enterprise: $249 × 25 locations | $6,225/mo |
| **Large DSO, 100 locations** | Enterprise (custom): Negotiated volume rate | Custom |

### 9.4 What Counts as an "Agent Run"

An **agent run** is one complete GPAORI cycle for one agent at one location. Examples:

| Action | Runs Consumed |
|---|---|
| Insurance Verification for tomorrow's 20 patients at Location 1 | 1 run |
| Shift Matchmaker fills 5 open shifts at Location 1 | 1 run |
| Same Shift Matchmaker runs at Location 2 | 1 additional run |
| Daily credential scan for entire practice | 1 run |
| Revenue analysis for 1 practice with 3 locations | 1 run (practice-level) |
| A failed run that is retried | 1 additional run |
| A run cancelled by admin before completion | 0 runs (not counted) |

### 9.5 Metering & Billing Flow

```
Agent Run Completes
      │
      ▼
┌─────────────┐
│ Record Usage │─── agent_usage_records table
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Check Against    │
│ Subscription     │
│ Limits           │
└──────┬──────────┘
       │
       ├── Within Limit ──▶ No action
       │
       ├── 80% of Limit ──▶ Warning notification to admin
       │
       ├── 100% of Limit ──▶ Overage notification + continue (overage charges apply)
       │
       └── Enterprise ──▶ Unlimited — no metering enforcement
       
Monthly Billing Cycle (via Stripe):
  1. Base subscription charge on billing date
  2. Overage charges calculated at month-end
  3. Invoice generated with usage breakdown per location
```

### 9.6 Free Trial & Onboarding

| Phase | Duration | Included |
|---|---|---|
| **Free Trial** | 14 days | Professional tier features, 100 agent runs, 2 locations |
| **Onboarding** | First 30 days | Guided setup, agent configuration assistance, first-run walkthrough |
| **Upgrade Prompt** | Day 12 | In-app notification with usage summary and tier recommendation |

### 9.7 Add-On Services

| Add-On | Price | Description |
|---|---|---|
| **Additional Agent Runs** | $0.10–$0.15/run | For Starter/Professional tiers exceeding included runs |
| **AI Phone Verification** | $2.50/call | Agent dials insurance carrier, navigates IVR, extracts benefits by voice (future) |
| **Custom Agent Development** | $5,000+ one-time | Build a custom agent tailored to the practice's specific workflow |
| **Premium Analytics** | $99/mo | Extended data retention (2 years), export to BI tools, custom reports |

### 9.8 Stripe Integration for Agent Billing

The agent subscription system integrates with the existing Stripe setup:

```
┌──────────────────────────────────────────────────────────────┐
│                    Stripe Billing Architecture                 │
│                                                               │
│  Existing Stripe Customer (per practice)                      │
│       │                                                       │
│       ├── Existing Subscriptions                              │
│       │       ├── Insurance Verification Service              │
│       │       ├── Patient Billing Service                     │
│       │       └── Staffing Marketplace                        │
│       │                                                       │
│       └── NEW: Agent Subscription                             │
│               ├── Base Plan (Starter/Professional/Enterprise) │
│               ├── Per-Location Line Items (Enterprise)        │
│               └── Metered Usage (overage runs)                │
│                                                               │
│  Stripe Products:                                             │
│       ├── prod_agent_starter     ($149/mo)                   │
│       ├── prod_agent_pro         ($349/mo)                   │
│       ├── prod_agent_enterprise  ($249/mo per location)      │
│       └── prod_agent_overage     ($0.10-$0.15 per run)       │
│                                                               │
│  Webhook Events:                                              │
│       ├── invoice.payment_succeeded → Update subscription     │
│       ├── invoice.payment_failed → Notify admin + grace       │
│       └── customer.subscription.updated → Sync tier changes   │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Database Schema

### 10.1 New Tables Required

```sql
-- DSO Organization grouping (optional — for DSOs managing multiple practices)
CREATE TABLE organizations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,                    -- e.g., "Bright Smile Partners"
  type VARCHAR DEFAULT 'dso',              -- 'dso', 'group_practice', 'franchise'
  contact_name VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  billing_email VARCHAR,
  stripe_customer_id VARCHAR,              -- DSO-level Stripe customer (optional)
  logo_url VARCHAR,
  settings JSONB,                          -- org-wide default settings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Link practices to DSO organizations (add column to existing practices table)
-- ALTER TABLE practices ADD COLUMN organization_id VARCHAR REFERENCES organizations(id);
-- ALTER TABLE practices ADD COLUMN organization_role VARCHAR DEFAULT 'member'; 
--   -- 'owner', 'member'

-- Agent definitions and configuration
CREATE TABLE agent_definitions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,                    -- e.g., "Insurance Verification Agent"
  slug VARCHAR NOT NULL UNIQUE,             -- e.g., "insurance-verification"
  description TEXT,
  version VARCHAR DEFAULT '1.0.0',
  category VARCHAR NOT NULL,                -- verification, staffing, claims, 
                                            -- communication, compliance, revenue
  execution_level VARCHAR NOT NULL          -- 'location', 'practice', 'both'
    DEFAULT 'location',
  default_autonomy_level INTEGER DEFAULT 1, -- 1=full supervision, 4=full autonomy
  min_tier VARCHAR DEFAULT 'starter',       -- minimum subscription tier required
  gpaori_config JSONB,                      -- phase-specific configuration
  tools_available TEXT[],                    -- list of tool/action IDs this agent can use
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Practice-level agent settings (defaults for all locations)
CREATE TABLE agent_practice_configs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  agent_definition_id VARCHAR NOT NULL REFERENCES agent_definitions(id),
  autonomy_level INTEGER DEFAULT 1,
  is_enabled BOOLEAN DEFAULT false,
  schedule_cron VARCHAR,                    -- cron expression for scheduled runs
  config_overrides JSONB,                   -- practice-specific settings
  notification_channels TEXT[],             -- ['in_app', 'email', 'chrome_extension']
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(practice_id, agent_definition_id)
);

-- Location-level agent overrides (optional — overrides practice defaults)
CREATE TABLE agent_location_configs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  location_id VARCHAR NOT NULL REFERENCES practice_locations(id),
  agent_definition_id VARCHAR NOT NULL REFERENCES agent_definitions(id),
  autonomy_level INTEGER,                   -- NULL = inherit from practice config
  is_enabled BOOLEAN,                       -- NULL = inherit from practice config
  schedule_cron VARCHAR,                    -- NULL = inherit from practice config
  config_overrides JSONB,                   -- location-specific overrides (merged with practice)
  notification_channels TEXT[],             -- NULL = inherit from practice config
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(location_id, agent_definition_id)
);

-- Agent subscription and billing
CREATE TABLE agent_subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  organization_id VARCHAR REFERENCES organizations(id),   -- NULL for independent practices
  tier VARCHAR NOT NULL DEFAULT 'starter',  -- 'starter', 'professional', 'enterprise', 'custom'
  status VARCHAR NOT NULL DEFAULT 'trialing', -- 'trialing', 'active', 'past_due', 
                                              -- 'cancelled', 'suspended'
  max_agents INTEGER NOT NULL DEFAULT 2,
  max_locations INTEGER NOT NULL DEFAULT 1,
  max_runs_per_month INTEGER NOT NULL DEFAULT 500,
  max_autonomy_level INTEGER NOT NULL DEFAULT 2,
  monthly_price_cents INTEGER NOT NULL,     -- base price in cents
  overage_price_cents INTEGER DEFAULT 15,   -- per-run overage price in cents
  stripe_subscription_id VARCHAR,
  stripe_price_id VARCHAR,
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(practice_id)
);

-- Usage metering per billing period
CREATE TABLE agent_usage_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  location_id VARCHAR REFERENCES practice_locations(id),  -- NULL for practice-level agents
  agent_definition_id VARCHAR NOT NULL REFERENCES agent_definitions(id),
  agent_run_id VARCHAR NOT NULL REFERENCES agent_runs(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  run_status VARCHAR NOT NULL,              -- 'completed', 'failed'
  tokens_used INTEGER DEFAULT 0,            -- OpenAI tokens consumed
  is_billable BOOLEAN DEFAULT true,         -- false for cancelled runs
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Monthly usage summary (materialized for billing)
CREATE TABLE agent_usage_summaries (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  subscription_id VARCHAR NOT NULL REFERENCES agent_subscriptions(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_runs INTEGER DEFAULT 0,
  billable_runs INTEGER DEFAULT 0,
  included_runs INTEGER DEFAULT 0,          -- from subscription
  overage_runs INTEGER DEFAULT 0,           -- runs beyond included
  overage_amount_cents INTEGER DEFAULT 0,   -- overage charge
  total_tokens_used INTEGER DEFAULT 0,
  runs_by_agent JSONB,                      -- { "insurance-verification": 45, "shift-matchmaker": 23 }
  runs_by_location JSONB,                   -- { "loc_123": 30, "loc_456": 38 }
  is_invoiced BOOLEAN DEFAULT false,
  stripe_invoice_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(practice_id, billing_period_start)
);

-- Individual agent execution runs
CREATE TABLE agent_runs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_definition_id VARCHAR NOT NULL REFERENCES agent_definitions(id),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  location_id VARCHAR REFERENCES practice_locations(id),  -- NULL for practice-level agents
  triggered_by VARCHAR NOT NULL,            -- 'schedule', 'manual', 'event'
  triggered_by_admin_id VARCHAR,            -- who started it (if manual)
  status VARCHAR NOT NULL DEFAULT 'created', -- created, planning, executing, 
                                             -- paused, waiting_approval, 
                                             -- completed, failed, rejected, cancelled
  goal JSONB NOT NULL,                       -- structured goal object
  plan JSONB,                                -- array of planned steps
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER,
  overall_confidence NUMERIC(3,2),
  result_summary TEXT,                       -- AI-generated summary of results
  result_data JSONB,                         -- structured result payload
  error_message TEXT,
  total_tokens_used INTEGER DEFAULT 0,       -- cumulative OpenAI tokens
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual GPAORI steps within a run
CREATE TABLE agent_run_steps (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id VARCHAR NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  phase VARCHAR NOT NULL,                    -- goal, plan, act, observe, reflect, iterate
  description TEXT,                          -- human-readable description
  status VARCHAR NOT NULL DEFAULT 'pending', -- pending, executing, waiting_approval,
                                             -- approved, rejected, completed, 
                                             -- failed, skipped
  input_data JSONB,                          -- data going into this step
  output_data JSONB,                         -- data produced by this step
  confidence_score NUMERIC(3,2),
  ai_reasoning TEXT,                         -- AI explanation of decision/result
  ai_model_used VARCHAR,                     -- which model was used
  ai_tokens_used INTEGER,
  requires_approval BOOLEAN DEFAULT false,
  approval_request_id VARCHAR,
  tool_name VARCHAR,                         -- which tool/action was used
  tool_input JSONB,
  tool_output JSONB,
  duration_ms INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- HITL approval requests
CREATE TABLE agent_approval_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id VARCHAR NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  agent_run_step_id VARCHAR NOT NULL REFERENCES agent_run_steps(id) ON DELETE CASCADE,
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  location_id VARCHAR REFERENCES practice_locations(id),
  request_type VARCHAR NOT NULL,             -- plan_review, action_approval, 
                                             -- result_review, escalation
  title VARCHAR NOT NULL,                    -- short description for notification
  summary TEXT NOT NULL,                     -- detailed explanation for admin
  details JSONB,                             -- full payload for review
  confidence_score NUMERIC(3,2),
  urgency VARCHAR DEFAULT 'normal',          -- low, normal, high, critical
  status VARCHAR NOT NULL DEFAULT 'pending', -- pending, approved, rejected, 
                                             -- modified, expired, auto_approved
  decided_by VARCHAR,                        -- admin ID who made the decision
  decision_notes TEXT,                       -- admin's notes/reason
  modifications JSONB,                       -- if admin modified the proposal
  expires_at TIMESTAMP,                      -- auto-escalate after this time
  decided_at TIMESTAMP,
  notified_at TIMESTAMP,
  notification_channels TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log for all agent actions
CREATE TABLE agent_audit_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id VARCHAR NOT NULL,
  agent_definition_id VARCHAR NOT NULL,
  practice_id VARCHAR NOT NULL,
  location_id VARCHAR,                       -- NULL for practice-level actions
  event_type VARCHAR NOT NULL,               -- run_started, step_completed, 
                                             -- approval_requested, approval_granted,
                                             -- action_executed, error_occurred, 
                                             -- run_completed, subscription_changed,
                                             -- overage_triggered
  event_data JSONB,
  actor_type VARCHAR NOT NULL,               -- 'agent', 'admin', 'system', 'billing'
  actor_id VARCHAR,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 10.2 Relationship Diagram

```
organizations (DSO)
       │
       └──── practices (1:many)
                  │
                  ├──── practice_locations (1:many)
                  │          │
                  │          └──── agent_location_configs (per-location overrides)
                  │          └──── agent_runs (location-scoped execution)
                  │          └──── agent_approval_requests (location-scoped approvals)
                  │          └──── agent_usage_records (per-location metering)
                  │
                  ├──── agent_practice_configs (practice-level defaults)
                  │
                  ├──── agent_subscriptions (billing)
                  │          │
                  │          └──── agent_usage_summaries (monthly rollup)
                  │
                  └──── agent_runs (practice-level agents)
                            │
                            ├──── agent_run_steps
                            │          │
                            │          └──── agent_approval_requests
                            │
                            └──── agent_audit_log

agent_definitions
       │
       ├──── agent_practice_configs
       ├──── agent_location_configs
       └──── agent_runs

Existing tables referenced by agents:
  - patients, appointments, insurance_policies
  - verifications, benefits, verification_queue
  - staff_shifts, professionals, professional_preferences
  - contractor_documents, professional_certifications
  - patient_billing, patient_payments
  - shift_transactions, shift_negotiations
  - practice_locations (for location-scoped execution)
```

---

## 11. API Design

### 11.1 Agent Management APIs

```
# Agent Definitions (admin only)
GET    /api/agents                                    # List all agent definitions
GET    /api/agents/:slug                              # Get specific agent details

# Practice Agent Configuration
GET    /api/agents/config                             # List practice's agent configs
PUT    /api/agents/config/:agentSlug                  # Update practice-level config
POST   /api/agents/config/:agentSlug/enable           # Enable agent for practice
POST   /api/agents/config/:agentSlug/disable          # Disable agent for practice

# Location-Level Overrides
GET    /api/agents/config/locations/:locationId       # List location's agent overrides
PUT    /api/agents/config/locations/:locationId/:slug  # Set location-level override
DELETE /api/agents/config/locations/:locationId/:slug  # Remove override (inherit practice)

# Agent Runs
GET    /api/agents/runs                               # List runs (filter: agent, status, location)
POST   /api/agents/runs                               # Trigger a new agent run
GET    /api/agents/runs/:runId                         # Get run details with steps
POST   /api/agents/runs/:runId/cancel                  # Cancel a running agent
POST   /api/agents/runs/:runId/pause                   # Pause a running agent
POST   /api/agents/runs/:runId/resume                  # Resume a paused agent

# Run Steps
GET    /api/agents/runs/:runId/steps                   # List all steps for a run
GET    /api/agents/runs/:runId/steps/:stepId           # Get step details

# HITL Approvals
GET    /api/agents/approvals                           # List pending approvals (filter: location)
GET    /api/agents/approvals/:id                       # Get approval details
POST   /api/agents/approvals/:id/approve               # Approve a request
POST   /api/agents/approvals/:id/reject                # Reject a request
POST   /api/agents/approvals/:id/modify                # Modify and approve
GET    /api/agents/approvals/count                     # Count of pending approvals (for badges)

# Subscription & Usage
GET    /api/agents/subscription                        # Get current subscription details
POST   /api/agents/subscription/upgrade                # Upgrade tier
GET    /api/agents/usage                               # Current period usage
GET    /api/agents/usage/history                        # Historical usage by period
GET    /api/agents/usage/by-location                   # Usage breakdown by location
GET    /api/agents/usage/by-agent                      # Usage breakdown by agent type

# DSO / Organization APIs
GET    /api/organizations/:orgId/practices             # List all practices in DSO
GET    /api/organizations/:orgId/agents/dashboard      # DSO executive dashboard
GET    /api/organizations/:orgId/agents/usage          # Aggregate usage across practices
GET    /api/organizations/:orgId/agents/compare        # Cross-location comparison

# Audit Log
GET    /api/agents/audit                               # Query audit log (filterable)
```

### 11.2 WebSocket / SSE for Real-Time Updates

```
# SSE stream for agent activity
GET    /api/agents/stream                    # Real-time updates for:
                                             #   - Step completions
                                             #   - Approval requests
                                             #   - Run status changes
                                             #   - Error notifications
                                             #   - Usage threshold alerts
```

---

## 12. Security & Compliance

### 12.1 HIPAA Considerations

| Concern | Mitigation |
|---|---|
| PHI in AI prompts | Minimize PHI sent to OpenAI. Use IDs where possible. Never send SSN, full DOB unnecessarily. |
| PHI in agent logs | Encrypt sensitive fields in `agent_run_steps.output_data`. Apply same encryption as existing `contractor_tax_forms`. |
| Audit trail | Full audit logging via `agent_audit_log`. Every action, approval, and data access recorded with location context. |
| Access control | Only practice admins can view/manage their practice's agents. DSO admins can view all practices. Location managers can only view their location. |
| Data retention | Agent run data follows same retention policy as existing platform data. |
| Cross-practice isolation | DSO admins see aggregate data; individual practice data is never shared between practices within a DSO. |

### 12.2 Authorization Model

| Role | Scope | Agent Permissions |
|---|---|---|
| **Platform Super Admin** | All organizations, practices, locations | Full access to all agent definitions, configs, runs, audit logs, and subscriptions |
| **DSO Admin** | All practices + all locations in their organization | Configure org-wide defaults, view all runs/reports, approve at any level, manage DSO subscription |
| **Practice Admin** | One practice + all its locations | Configure practice-level settings, override per location, approve for any owned location, view practice reports |
| **Location Manager** | One specific location | Approve agent runs for their location, view location reports, cannot change config |
| **Office Manager** | One specific location | View agent results and pending approvals (read-only) |
| **Front Desk** | One specific location | View notifications from agents (e.g., verification results) |
| **Professional** | N/A | No access to agents (receives notifications only — shift invitations, credential alerts) |

### 12.3 Rate Limiting & Safety

- Maximum concurrent agent runs per practice: 3 (Starter), 5 (Professional), 10 (Enterprise)
- Maximum concurrent runs per location: 2
- Maximum steps per single run: 100
- OpenAI token budget per run: 50,000 tokens
- Automatic timeout: 30 minutes per run (configurable)
- Circuit breaker: If 3 consecutive runs fail at a location, disable auto-scheduling for that location until admin reviews
- Subscription enforcement: Runs blocked (with notification) when subscription is past_due or suspended

---

## 13. Implementation Roadmap

### Phase 1: Core Framework + DSO Hierarchy (Weeks 1-4)
- [ ] Database schema for organizations, agent tables, subscriptions, and usage metering
- [ ] Add `organization_id` to practices table
- [ ] Agent Orchestrator service (GPAORI loop engine) with location-scoped execution
- [ ] HITL Engine (approval request creation, tracking, notification) with location context
- [ ] Subscription & Metering service with Stripe integration
- [ ] Agent Dashboard UI (list agents, view runs, approve/reject, filter by location)
- [ ] Approval queue in sidebar navigation with location badges
- [ ] SSE stream for real-time agent updates
- [ ] DSO admin dashboard (cross-practice view)

### Phase 2: First Agent — Insurance Verification (Weeks 5-6)
- [ ] Insurance Verification Agent implementation (per-location execution)
- [ ] Integration with existing DentalXchange/Availity services
- [ ] Batch verification with progress tracking per location
- [ ] Results display in agent dashboard with location grouping
- [ ] Email notifications for completed verifications

### Phase 3: Shift Matchmaker Agent (Weeks 7-8)
- [ ] AI Shift Matchmaker Agent implementation (per-location, distance from location address)
- [ ] Scoring algorithm with configurable weights (per-practice with location override)
- [ ] Google Maps distance calculation using location coordinates
- [ ] Match recommendation UI with approve/reject per candidate
- [ ] Shift invitation automation

### Phase 4: Communication & Credentials Agents (Weeks 9-11)
- [ ] Patient Communication Agent (per-location — appointment reminders include location address)
- [ ] Credential Monitoring Agent (per-practice — scans all professionals across locations)
- [ ] SMS integration (future provider)
- [ ] Compliance dashboard with location-level drill-down

### Phase 5: Claims & Revenue Agents (Weeks 12-15)
- [ ] Claims Follow-Up Agent (per-location, requires claims table expansion)
- [ ] Revenue Cycle Intelligence Agent (both: per-location analysis + practice/DSO rollup)
- [ ] Cross-location comparison analytics
- [ ] DSO executive dashboard with benchmarking
- [ ] Practice-level autonomy configuration UI with location overrides

### Phase 6: Chrome Extension ↔ Agent Integration (Weeks 16-17)
- [ ] New "Agent Hub" tab in Chrome Extension side panel
- [ ] `GET /api/extension/agents/status` — compact agent status for extension
- [ ] `GET /api/extension/agents/approvals` — pending HITL approvals for extension
- [ ] `POST /api/extension/agents/approvals/:id/decide` — approve/reject from extension
- [ ] `GET /api/extension/agents/alerts/count` — combined badge count (shifts + approvals)
- [ ] `GET /api/extension/agents/patient/:patientId/verification` — check if agent already verified a patient
- [ ] Agent status cards in extension (last run, result summary, action items)
- [ ] Inline HITL approve/reject in extension for Level 1-2 decisions
- [ ] Combined badge: shift count + pending approvals with color coding
- [ ] "Already verified by agent" indicator in Eligibility tab when agent has recent result
- [ ] Agent notification preferences in extension settings
- [ ] Duplicate work prevention: extension checks for recent agent verification before manual run

### Phase 7: Billing, Polish & Scale (Weeks 18-20)
- [ ] Stripe subscription products and pricing setup
- [ ] Usage metering and overage billing
- [ ] Subscription management UI (upgrade/downgrade, usage dashboard)
- [ ] Free trial flow and upgrade prompts
- [ ] Mobile app notifications for approvals
- [ ] Performance optimization and caching
- [ ] Documentation and training materials

---

## 14. Appendix

### A. Glossary

| Term | Definition |
|---|---|
| **GPAORI** | Goal → Plan → Act → Observe → Reflect → Iterate — the agent execution pattern |
| **HITL** | Human-in-the-Loop — requiring human approval at designated checkpoints |
| **DSO** | Dental Service Organization — a company that manages multiple dental practices |
| **Agent Run** | A single execution of an agent from goal to completion, scoped to a location or practice |
| **Approval Request** | A HITL checkpoint where the agent pauses for human review |
| **Autonomy Level** | Practice/location-configurable setting controlling how much HITL oversight an agent requires |
| **Confidence Score** | Agent's self-assessed certainty (0.0–1.0) about its output |
| **Digital Workforce** | The collection of AI agents operating as virtual team members |
| **Execution Level** | Whether an agent runs per-location, per-practice, or both |
| **Config Inheritance** | Settings cascade: Organization → Practice → Location (more specific overrides less specific) |
| **Metered Usage** | Agent runs counted against subscription limits for billing |
| **Agent Hub** | A tab in the Chrome Extension side panel showing agent status, alerts, and HITL approval queue |
| **Human Mode** | Operations triggered by a human via the Chrome Extension (one patient, on-demand, interactive) |
| **Automated Mode** | Operations triggered by AI agents on the server (batch, scheduled, asynchronous) |
| **Bridge Pattern** | The Chrome Extension serving as a lightweight interface between human users and server-side AI agents |
| **Duplicate Work Prevention** | Logic that checks if an agent has recently verified a patient before allowing a manual re-check |

### B. Example: DSO Running Insurance Verification Across 3 Locations

```json
{
  "organization": "Bright Smile Partners",
  "practice": "Downtown Dental",
  "subscription": {
    "tier": "enterprise",
    "price_per_location": "$249/mo",
    "locations_count": 3,
    "monthly_total": "$747/mo"
  },
  "scheduled_trigger": "Daily 6:00 PM EST",
  "runs_spawned": [
    {
      "run_id": "run_loc1_abc",
      "location": "Main Office (123 Main St)",
      "patients_scoped": 18,
      "autonomy_level": 3,
      "result": {
        "verified_active": 16,
        "verified_inactive": 1,
        "failed": 1,
        "auto_completed": true,
        "hitl_triggered": false
      }
    },
    {
      "run_id": "run_loc2_def",
      "location": "West Branch (456 West Ave)",
      "patients_scoped": 12,
      "autonomy_level": 1,
      "result": {
        "verified_active": 10,
        "verified_inactive": 2,
        "failed": 0,
        "auto_completed": false,
        "hitl_triggered": true,
        "approval": {
          "requested_at": "2026-02-26T18:05:00Z",
          "approved_by": "admin@brightsmile.com",
          "approved_at": "2026-02-26T18:12:00Z",
          "notes": "Confirmed — contact patients #42 and #67 about expired coverage"
        }
      }
    },
    {
      "run_id": "run_loc3_ghi",
      "location": "North Clinic (789 North Blvd)",
      "patients_scoped": 8,
      "autonomy_level": 3,
      "result": {
        "verified_active": 8,
        "verified_inactive": 0,
        "failed": 0,
        "auto_completed": true,
        "hitl_triggered": false
      }
    }
  ],
  "usage_this_period": {
    "total_runs": 87,
    "included_runs": "unlimited",
    "overage": 0
  },
  "dso_dashboard_summary": {
    "total_patients_verified": 38,
    "success_rate": "92.1%",
    "inactive_policies_found": 3,
    "action_items": 3,
    "best_performing_location": "North Clinic (100%)",
    "needs_attention": "West Branch (2 inactive policies)"
  }
}
```

### C. Technology Stack

| Component | Technology | Reason |
|---|---|---|
| Agent Runtime | TypeScript / Node.js | Matches existing backend |
| AI Engine | OpenAI (gpt-4o, gpt-4o-mini) | Already integrated |
| Database | PostgreSQL + Drizzle ORM | Already in use |
| Real-time Updates | Server-Sent Events (SSE) | Already used in chat system |
| Notifications | Resend (email) | Already integrated |
| Billing | Stripe (subscriptions + metered usage) | Already integrated |
| Job Scheduling | Node-cron + DB queue | Matches existing verification queue pattern |
| Frontend | React + TanStack Query | Matches existing frontend |
| Geocoding | Google Maps API | Already integrated for distance calculations |
