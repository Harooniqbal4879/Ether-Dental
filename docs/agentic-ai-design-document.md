# EtherAI-Dental: Agentic AI Digital Workforce Design Document

**Version:** 1.0  
**Date:** February 2026  
**Status:** Draft — Pending Review  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [GPAORI Pattern Overview](#2-gpaori-pattern-overview)
3. [Human-in-the-Loop (HITL) Framework](#3-human-in-the-loop-hitl-framework)
4. [System Architecture](#4-system-architecture)
5. [Core Infrastructure](#5-core-infrastructure)
6. [Agent Definitions](#6-agent-definitions)
   - 6.1 Insurance Verification Agent
   - 6.2 AI Shift Matchmaker Agent
   - 6.3 Claims Follow-Up Agent
   - 6.4 Patient Communication Agent
   - 6.5 Credential Monitoring Agent
   - 6.6 Revenue Cycle Intelligence Agent
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [Security & Compliance](#9-security--compliance)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Appendix](#11-appendix)

---

## 1. Executive Summary

This document defines the architecture for building six **Agentic AI solutions** within the EtherAI-Dental platform. Each agent follows the **GPAORI pattern** (Goal → Plan → Act → Observe → Reflect → Iterate) and incorporates **Human-in-the-Loop (HITL)** checkpoints at every step to ensure accuracy, compliance, and trust.

These agents form a "Digital Workforce" that automates repetitive, time-consuming tasks across dental practice operations while keeping practice administrators in full control. The agents don't replace staff — they augment them by handling the grunt work and surfacing decisions for human approval.

### Design Principles

| Principle | Description |
|---|---|
| **HITL-First** | No agent takes irreversible action without human approval |
| **Transparency** | Every agent decision is logged, explainable, and auditable |
| **Graceful Degradation** | Agents fail safely — if AI is uncertain, it escalates to a human |
| **Incremental Trust** | Agents start fully supervised; practices can gradually increase autonomy |
| **HIPAA-Aware** | All PHI handled per existing platform encryption and access controls |

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

Practices can configure how much autonomy each agent has:

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
┌─────────────────────────────────────────────────────────────────────┐
│                        EtherAI-Dental Platform                       │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Frontend     │    │  Chrome Ext   │    │  Mobile App          │   │
│  │  (React)      │    │  (Manifest V3)│    │  (iOS/Android)       │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘   │
│         │                   │                        │               │
│         └───────────────────┼────────────────────────┘               │
│                             │                                        │
│                      ┌──────▼──────┐                                │
│                      │  API Layer   │                                │
│                      │  (Express)   │                                │
│                      └──────┬──────┘                                │
│                             │                                        │
│              ┌──────────────┼──────────────┐                        │
│              │              │              │                         │
│       ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐                │
│       │ Agent        │ │ HITL    │  │ Agent       │                 │
│       │ Orchestrator │ │ Engine  │  │ Registry    │                 │
│       └──────┬──────┘ └────┬────┘  └──────┬──────┘                │
│              │              │              │                         │
│       ┌──────▼──────────────▼──────────────▼──────┐                │
│       │              Agent Runtime                  │                │
│       │                                             │                │
│       │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │                │
│       │  │ Verify   │  │ Match   │  │ Claims  │   │                │
│       │  │ Agent    │  │ Agent   │  │ Agent   │   │                │
│       │  └─────────┘  └─────────┘  └─────────┘   │                │
│       │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │                │
│       │  │ Comms    │  │ Creds   │  │ Revenue │   │                │
│       │  │ Agent    │  │ Agent   │  │ Agent   │   │                │
│       │  └─────────┘  └─────────┘  └─────────┘   │                │
│       │                                             │                │
│       └──────────────────┬──────────────────────────┘                │
│                          │                                           │
│              ┌───────────┼────────────┐                              │
│              │           │            │                               │
│        ┌─────▼────┐ ┌───▼────┐ ┌─────▼──────┐                      │
│        │PostgreSQL │ │ OpenAI │ │ External   │                      │
│        │  Database │ │  API   │ │ Services   │                      │
│        └──────────┘ └────────┘ │(DentalXch, │                      │
│                                │ Availity,  │                       │
│                                │ Stripe,    │                       │
│                                │ Resend)    │                       │
│                                └────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Descriptions

| Component | Responsibility |
|---|---|
| **Agent Orchestrator** | Manages agent lifecycle: create, start, pause, resume, cancel. Enforces GPAORI sequence. |
| **HITL Engine** | Creates approval requests, tracks decisions, enforces timeouts, manages notification dispatch. |
| **Agent Registry** | Stores agent definitions, configurations, and autonomy settings per practice. |
| **Agent Runtime** | Executes individual agent instances. Each run is isolated with its own state. |
| **OpenAI API** | Powers reasoning (Plan, Reflect phases), natural language summaries, and confidence scoring. |

---

## 5. Core Infrastructure

### 5.1 Agent Run State Machine

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

### 5.2 GPAORI Step Execution Flow

For each step in an agent's plan, the runtime executes:

```typescript
interface GPAORIStep {
  stepNumber: number;
  phase: "goal" | "plan" | "act" | "observe" | "reflect" | "iterate";
  
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
  
  // Timing
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
}
```

### 5.3 OpenAI Integration Pattern

Each GPAORI phase uses OpenAI differently:

| Phase | OpenAI Role | Model | Prompt Pattern |
|---|---|---|---|
| **Goal** | Parse and structure the goal | gpt-4o-mini | "Given this objective, extract structured goal with success criteria" |
| **Plan** | Generate step-by-step plan | gpt-4o | "Given this goal and available tools, create an execution plan" |
| **Act** | Determine action parameters | gpt-4o-mini | "Given this step, determine the correct API call/query" |
| **Observe** | Analyze action results | gpt-4o | "Analyze this result. Was the action successful? Extract key data." |
| **Reflect** | Evaluate progress and decide | gpt-4o | "Given goal, plan, and progress so far, assess and recommend next." |
| **Iterate** | Decide continue/retry/complete | gpt-4o-mini | "Should we continue, retry, modify, or complete?" |

---

## 6. Agent Definitions

### 6.1 Insurance Verification Agent

**Purpose:** Automatically verify insurance eligibility for patients with upcoming appointments.

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Verify insurance eligibility for all patients with appointments in the next N days" | Admin confirms date range and patient scope |
| **Plan** | 1. Query appointments for date range. 2. Identify patients needing verification. 3. For each patient, fetch insurance policy. 4. Run eligibility check via DentalXchange/Availity. 5. Record results. 6. Flag issues. | Admin reviews patient list and approves batch |
| **Act** | Execute eligibility API call for each patient | Auto-proceed if confidence > 0.7; pause on errors |
| **Observe** | Parse eligibility response — coverage active? benefits available? | Display results summary to admin |
| **Reflect** | "15/18 patients verified active. 2 inactive. 1 failed (payer timeout)." | Admin reviews failed/inactive cases |
| **Iterate** | Retry failed checks. Flag inactive patients for front desk follow-up. | Admin approves notifications to front desk |

#### Integration Points
- **Input:** `appointments` table, `insurance_policies` table, `patients` table
- **External APIs:** DentalXchange (dental), Availity (medical)
- **Output:** `verifications` table, `benefits` table, `verification_queue` updates

#### Trigger Options
- Scheduled: Daily at configured time (e.g., 6 PM for next-day appointments)
- Manual: Admin triggers from dashboard
- Event-driven: New appointment created

---

### 6.2 AI Shift Matchmaker Agent

**Purpose:** Match open shifts with the best-fit available professionals.

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Find and recommend the best professionals for open shifts at Practice X" | Admin confirms which shifts to fill |
| **Plan** | 1. Get open shifts with requirements. 2. Query eligible professionals (license, location, availability). 3. Score candidates on fit criteria. 4. Rank and recommend top 3-5 per shift. 5. Send invitations to approved candidates. | Admin reviews matching criteria weights |
| **Act** | Run matching algorithm: license match, distance calc (Google Maps), availability check, performance history, rate compatibility | Present ranked candidates with scores and reasoning |
| **Observe** | "Shift #42 (Hygienist, Mon 8AM): 12 eligible, top match Dr. Sarah J. (score: 0.94 — 3.2 miles, 4.8 rating, $55/hr within range)" | Admin reviews all match recommendations |
| **Reflect** | "8/10 shifts have strong matches (>0.8). 2 shifts have weak matches — may need rate adjustment or broader search radius." | Admin decides on weak matches |
| **Iterate** | Send shift invitations to approved matches. For weak matches, suggest rate increase or expanded search. | Admin approves each invitation before sending |

#### Scoring Criteria

| Factor | Weight (Default) | Source |
|---|---|---|
| License/Credential Match | 30% | `professional_certifications`, `staff_roles` |
| Distance from Practice | 20% | Google Maps Geocoding API |
| Availability Match | 20% | `professional_preferences` |
| Performance Rating | 15% | `shift_transactions` (past completed shifts) |
| Rate Compatibility | 15% | `professional_preferences.minHourlyRate` vs shift rate |

#### Integration Points
- **Input:** `staff_shifts` (open), `professionals`, `professional_preferences`, `professional_certifications`
- **External APIs:** Google Maps (distance), OpenAI (explanation generation)
- **Output:** `shift_negotiations` (invitations), notifications

---

### 6.3 Claims Follow-Up Agent

**Purpose:** Monitor submitted insurance claims and automate follow-up on unpaid/denied claims.

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Review all claims older than 30 days without payment and determine follow-up actions" | Admin confirms aging threshold and scope |
| **Plan** | 1. Query claims by aging buckets (30/60/90+ days). 2. Check claim status with clearinghouse. 3. Categorize: pending, denied (with reason), partially paid. 4. Generate follow-up actions per category. 5. Execute approved actions. | Admin reviews aging report and action plan |
| **Act** | For denied: identify denial reason, suggest corrective action. For pending: check status. For partial: calculate remaining balance. | Pause on each denial — admin reviews corrective action |
| **Observe** | "47 claims reviewed. 32 pending (normal), 8 denied (3 coding errors, 2 missing info, 3 eligibility), 7 partially paid." | Full report to admin |
| **Reflect** | "Coding errors can be auto-corrected and resubmitted. Missing info requires patient contact. Eligibility denials need manual review." | Admin approves categorized actions |
| **Iterate** | Resubmit corrected claims. Queue patient contact for missing info. Flag eligibility denials for manual review. | Admin approves each resubmission |

#### Integration Points
- **Input:** Claims data (future `claims` table), `patient_billing`
- **External APIs:** Office Ally (claims status), DentalXchange
- **Output:** Resubmitted claims, follow-up tasks, aging reports

---

### 6.4 Patient Communication Agent

**Purpose:** Send automated, contextual communications to patients (reminders, verification updates, billing).

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Send appointment reminders and insurance verification updates for tomorrow's patients" | Admin confirms communication scope |
| **Plan** | 1. Get tomorrow's appointments. 2. Check verification status for each. 3. Draft messages per patient (reminder + verification status). 4. Select channel (email/SMS). 5. Send approved messages. | Admin reviews message templates and patient list |
| **Act** | Draft personalized messages using AI. Example: "Hi [Name], reminder: your appointment is tomorrow at [time]. Great news — we've confirmed your insurance is active with Delta Dental." | Admin reviews each message before sending (Level 1) or reviews template only (Level 2+) |
| **Observe** | Track delivery status: sent, delivered, opened, bounced, failed | Delivery report to admin |
| **Reflect** | "22/25 messages delivered. 2 bounced (invalid email). 1 patient has no contact info." | Admin handles bounced/missing contacts |
| **Iterate** | Update patient records with bounced status. Flag missing contact info. | Admin approves record updates |

#### Message Types

| Type | Trigger | Channel | Template |
|---|---|---|---|
| Appointment Reminder | 24h before appointment | Email + SMS | "Your appointment is tomorrow at {time}..." |
| Verification Complete | After agent verifies insurance | Email | "We've verified your insurance coverage..." |
| Benefits Summary | After eligibility check | Email | "Here's a summary of your dental benefits..." |
| Balance Due | After billing processed | Email | "You have an outstanding balance of ${amount}..." |
| Payment Confirmation | After payment received | Email | "Thank you for your payment of ${amount}..." |

#### Integration Points
- **Input:** `appointments`, `patients`, `verifications`, `patient_billing`
- **External APIs:** Resend (email), future SMS provider
- **Output:** Communication logs, delivery tracking

---

### 6.5 Credential Monitoring Agent

**Purpose:** Track contractor credentials and proactively alert on expirations, renewals, and compliance gaps.

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Monitor all active contractor credentials and identify any expiring within 60 days" | Admin confirms monitoring scope and thresholds |
| **Plan** | 1. Query all active professionals. 2. Check each credential type (license, NPI, malpractice, background, CPR/BLS, immunizations). 3. Calculate days until expiration. 4. Categorize: expired, critical (<14 days), warning (14-30), upcoming (30-60). 5. Generate notifications. | Admin reviews thresholds |
| **Act** | Scan credential records and calculate expiration status for each professional | Auto-proceed (read-only operation) |
| **Observe** | "142 professionals scanned. 3 expired credentials, 5 critical, 12 warning, 18 upcoming." | Full compliance dashboard to admin |
| **Reflect** | "3 professionals with expired credentials should be suspended from shift eligibility. 5 critical need immediate outreach." | Admin reviews suspension recommendations |
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
- **Input:** `professionals`, `contractor_documents`, `professional_certifications`
- **External APIs:** Resend (notifications), future license verification APIs
- **Output:** Compliance reports, suspension actions, renewal notifications

---

### 6.6 Revenue Cycle Intelligence Agent

**Purpose:** Analyze financial data across the practice to identify revenue optimization opportunities.

#### GPAORI Flow

| Phase | Action | HITL Gate |
|---|---|---|
| **Goal** | "Analyze this month's revenue cycle and identify optimization opportunities" | Admin confirms analysis period and scope |
| **Plan** | 1. Aggregate billing data by category. 2. Calculate collection rates. 3. Identify under-coded procedures. 4. Analyze payer mix and reimbursement rates. 5. Project revenue trends. 6. Generate actionable recommendations. | Admin reviews analysis parameters |
| **Act** | Query billing, payment, and verification data. Run statistical analysis. Use AI to identify patterns. | Auto-proceed (read-only analysis) |
| **Observe** | "Collection rate: 87%. Average days to payment: 34. Top denial reason: missing pre-auth (23%). Under-coded procedures identified: 12 instances." | Full analytics dashboard to admin |
| **Reflect** | "Collection rate is below industry benchmark (92%). Pre-auth denials are the primary revenue leak. Estimated annual impact: $45,000." | Admin reviews findings and recommendations |
| **Iterate** | Generate specific action items: update pre-auth workflow, flag under-coded procedures, adjust fee schedule for underperforming payers. | Admin approves each recommendation |

#### Analytics Produced

| Metric | Calculation | Benchmark |
|---|---|---|
| Collection Rate | Payments / Billed Amount | > 92% |
| Days to Payment | Avg days from service to payment | < 30 days |
| Denial Rate | Denied claims / Total claims | < 5% |
| Write-Off Rate | Write-offs / Billed Amount | < 3% |
| Payer Mix Efficiency | Revenue by payer vs effort | Varies |

#### Integration Points
- **Input:** `patient_billing`, `patient_payments`, `verifications`, `shift_transactions`
- **External APIs:** OpenAI (pattern analysis, natural language insights)
- **Output:** Analytics reports, action items, revenue projections

---

## 7. Database Schema

### 7.1 New Tables Required

```sql
-- Agent definitions and configuration
CREATE TABLE agent_definitions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,                    -- e.g., "Insurance Verification Agent"
  slug VARCHAR NOT NULL UNIQUE,             -- e.g., "insurance-verification"
  description TEXT,
  version VARCHAR DEFAULT '1.0.0',
  category VARCHAR NOT NULL,                -- verification, staffing, claims, 
                                            -- communication, compliance, revenue
  default_autonomy_level INTEGER DEFAULT 1, -- 1=full supervision, 4=full autonomy
  gpaori_config JSONB,                      -- phase-specific configuration
  tools_available TEXT[],                    -- list of tool/action IDs this agent can use
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Practice-specific agent settings
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

-- Individual agent execution runs
CREATE TABLE agent_runs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_definition_id VARCHAR NOT NULL REFERENCES agent_definitions(id),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
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
  event_type VARCHAR NOT NULL,               -- run_started, step_completed, 
                                             -- approval_requested, approval_granted,
                                             -- action_executed, error_occurred, 
                                             -- run_completed
  event_data JSONB,
  actor_type VARCHAR NOT NULL,               -- 'agent', 'admin', 'system'
  actor_id VARCHAR,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Relationship to Existing Tables

```
agent_definitions
       │
       ├──── agent_practice_configs ──── practices
       │
       └──── agent_runs ──── practices
                  │
                  ├──── agent_run_steps
                  │          │
                  │          └──── agent_approval_requests
                  │
                  └──── agent_audit_log

Existing tables referenced by agents:
  - patients, appointments, insurance_policies
  - verifications, benefits, verification_queue
  - staff_shifts, professionals, professional_preferences
  - contractor_documents, professional_certifications
  - patient_billing, patient_payments
  - shift_transactions, shift_negotiations
```

---

## 8. API Design

### 8.1 Agent Management APIs

```
# Agent Definitions (admin only)
GET    /api/agents                           # List all agent definitions
GET    /api/agents/:slug                     # Get specific agent details

# Practice Agent Configuration
GET    /api/agents/config                    # List practice's agent configs
PUT    /api/agents/config/:agentSlug         # Update practice config for agent
POST   /api/agents/config/:agentSlug/enable  # Enable agent for practice
POST   /api/agents/config/:agentSlug/disable # Disable agent for practice

# Agent Runs
GET    /api/agents/runs                      # List runs (filterable by agent, status)
POST   /api/agents/runs                      # Trigger a new agent run
GET    /api/agents/runs/:runId               # Get run details with steps
POST   /api/agents/runs/:runId/cancel        # Cancel a running agent
POST   /api/agents/runs/:runId/pause         # Pause a running agent
POST   /api/agents/runs/:runId/resume        # Resume a paused agent

# Run Steps
GET    /api/agents/runs/:runId/steps         # List all steps for a run
GET    /api/agents/runs/:runId/steps/:stepId # Get step details

# HITL Approvals
GET    /api/agents/approvals                 # List pending approvals for practice
GET    /api/agents/approvals/:id             # Get approval details
POST   /api/agents/approvals/:id/approve     # Approve a request
POST   /api/agents/approvals/:id/reject      # Reject a request
POST   /api/agents/approvals/:id/modify      # Modify and approve
GET    /api/agents/approvals/count           # Count of pending approvals (for badges)

# Audit Log
GET    /api/agents/audit                     # Query audit log (filterable)
```

### 8.2 WebSocket / SSE for Real-Time Updates

```
# SSE stream for agent activity
GET    /api/agents/stream                    # Real-time updates for:
                                             #   - Step completions
                                             #   - Approval requests
                                             #   - Run status changes
                                             #   - Error notifications
```

---

## 9. Security & Compliance

### 9.1 HIPAA Considerations

| Concern | Mitigation |
|---|---|
| PHI in AI prompts | Minimize PHI sent to OpenAI. Use IDs where possible. Never send SSN, full DOB unnecessarily. |
| PHI in agent logs | Encrypt sensitive fields in `agent_run_steps.output_data`. Apply same encryption as existing `contractor_tax_forms`. |
| Audit trail | Full audit logging via `agent_audit_log`. Every action, approval, and data access recorded. |
| Access control | Only practice admins can view/manage their practice's agents. Super admins can view all. |
| Data retention | Agent run data follows same retention policy as existing platform data. |

### 9.2 Authorization Model

| Role | Permissions |
|---|---|
| **Super Admin** | Full access to all agent definitions, configs, runs, and audit logs |
| **Practice Admin** | Configure agents for their practice, manage approvals, view runs |
| **Office Manager** | View agent results and pending approvals (read-only) |
| **Front Desk** | View notifications from agents (e.g., verification results) |
| **Professional** | No access to agents (receives notifications only) |

### 9.3 Rate Limiting & Safety

- Maximum concurrent agent runs per practice: 3
- Maximum steps per single run: 100
- OpenAI token budget per run: 50,000 tokens
- Automatic timeout: 30 minutes per run (configurable)
- Circuit breaker: If 3 consecutive runs fail, disable auto-scheduling until admin reviews

---

## 10. Implementation Roadmap

### Phase 1: Core Framework (Weeks 1-3)
- [ ] Database schema for agent tables
- [ ] Agent Orchestrator service (GPAORI loop engine)
- [ ] HITL Engine (approval request creation, tracking, notification)
- [ ] Agent Dashboard UI (list agents, view runs, approve/reject)
- [ ] Approval queue in sidebar navigation
- [ ] SSE stream for real-time agent updates

### Phase 2: First Agent — Insurance Verification (Weeks 4-5)
- [ ] Insurance Verification Agent implementation
- [ ] Integration with existing DentalXchange/Availity services
- [ ] Batch verification with progress tracking
- [ ] Results display in agent dashboard
- [ ] Email notifications for completed verifications

### Phase 3: Shift Matchmaker Agent (Weeks 6-7)
- [ ] AI Shift Matchmaker Agent implementation
- [ ] Scoring algorithm with configurable weights
- [ ] Google Maps distance calculation integration
- [ ] Match recommendation UI with approve/reject per candidate
- [ ] Shift invitation automation

### Phase 4: Communication & Credentials Agents (Weeks 8-10)
- [ ] Patient Communication Agent (appointment reminders, verification updates)
- [ ] Credential Monitoring Agent (expiration tracking, renewal alerts)
- [ ] SMS integration (future provider)
- [ ] Compliance dashboard

### Phase 5: Claims & Revenue Agents (Weeks 11-14)
- [ ] Claims Follow-Up Agent (requires claims table expansion)
- [ ] Revenue Cycle Intelligence Agent
- [ ] Analytics dashboard with charts and projections
- [ ] Practice-level autonomy configuration UI

### Phase 6: Polish & Scale (Weeks 15-16)
- [ ] Chrome Extension integration (agent alerts in side panel)
- [ ] Mobile app notifications for approvals
- [ ] Performance optimization and caching
- [ ] Documentation and training materials

---

## 11. Appendix

### A. Glossary

| Term | Definition |
|---|---|
| **GPAORI** | Goal → Plan → Act → Observe → Reflect → Iterate — the agent execution pattern |
| **HITL** | Human-in-the-Loop — requiring human approval at designated checkpoints |
| **Agent Run** | A single execution of an agent from goal to completion |
| **Approval Request** | A HITL checkpoint where the agent pauses for human review |
| **Autonomy Level** | Practice-configurable setting controlling how much HITL oversight an agent requires |
| **Confidence Score** | Agent's self-assessed certainty (0.0–1.0) about its output |
| **Digital Workforce** | The collection of AI agents operating as virtual team members |

### B. Example Agent Run — Insurance Verification

```json
{
  "run_id": "run_abc123",
  "agent": "insurance-verification",
  "status": "waiting_approval",
  "goal": {
    "description": "Verify insurance for patients with appointments on 2026-02-27",
    "date_range": "2026-02-27",
    "patient_count": 18
  },
  "current_step": 4,
  "total_steps": 6,
  "steps": [
    {
      "step": 1, "phase": "goal",
      "status": "completed",
      "output": "Goal confirmed: 18 patients with appointments on Feb 27"
    },
    {
      "step": 2, "phase": "plan", 
      "status": "completed",
      "approval": { "status": "approved", "by": "hr@haroonpractice.com" },
      "output": "Plan: Query 18 patients → Fetch policies → Verify via DentalXchange (15) + Availity (3)"
    },
    {
      "step": 3, "phase": "act",
      "status": "completed",
      "output": "15/18 verified successfully. 2 inactive. 1 payer timeout."
    },
    {
      "step": 4, "phase": "observe",
      "status": "waiting_approval",
      "confidence": 0.85,
      "output": {
        "verified_active": 15,
        "verified_inactive": 2,
        "failed": 1,
        "inactive_patients": ["Patient #42 - Delta Dental expired", "Patient #67 - no policy found"]
      },
      "approval_request": {
        "title": "Review Verification Results",
        "summary": "15 of 18 patients verified active. 2 inactive policies need front desk follow-up. 1 check failed (payer timeout — recommend retry).",
        "options": ["Approve & Continue", "Reject", "Modify"]
      }
    }
  ]
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
| Job Scheduling | Node-cron + DB queue | Matches existing verification queue pattern |
| Frontend | React + TanStack Query | Matches existing frontend |
