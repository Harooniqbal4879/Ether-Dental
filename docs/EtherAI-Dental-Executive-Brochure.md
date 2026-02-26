# EtherAI-Dental: Operational Intelligence for Multi-Location Dental Organizations

**Executive Briefing for DSO Leadership**

---

## The Operational Reality of Running a DSO Today

A 5-location DSO with 20 patients per day per location handles roughly **2,400 insurance verifications per month**, manages **50-100 contractor credential expirations per year**, processes **1,500+ insurance claims monthly**, and coordinates staffing across locations with different software systems, different office managers, and different levels of operational maturity.

The math on manual processes doesn't work:

| Manual Process | Time per Item | Monthly Volume (5 locations) | Monthly Labor Hours |
|---|---|---|---|
| Insurance verification phone call | 8-12 minutes | 2,400 patients | 320-480 hours |
| Claim denial investigation | 15-30 minutes | 75-150 denied claims | 19-75 hours |
| Credential status check | 5-10 minutes | 50-100 checks | 4-17 hours |
| Shift fill (calling/texting) | 20-45 minutes | 30-60 open shifts | 10-45 hours |
| **Total administrative overhead** | | | **353-617 hours/month** |

At an average front desk salary of $18-22/hour, that's **$6,350-$13,575/month** in labor spent on tasks that don't require human judgment for the majority of cases.

EtherAI-Dental doesn't eliminate these tasks — it separates the routine cases (which the system handles automatically) from the exceptions (which your staff handles with full context provided). Based on industry data, roughly **75-85% of insurance verifications are straightforward** (active coverage, standard benefits). Your staff should be spending their time on the 15-25% that actually need a human — not the 75% that don't.

---

## How Each Capability Actually Works

### 1. Insurance Verification: What Happens Behind the Scenes

This isn't a black box. Here's exactly what the system does, step by step.

**The nightly process:**

```
6:00 PM — System pulls tomorrow's appointment schedule from your database
         Example: Location 1 has 22 patients, Location 2 has 18, Location 3 has 25

6:01 PM — For each patient, the system checks: do they have insurance on file?
         Result: 60 patients need verification, 5 are self-pay (skipped)

6:02 PM — System sends eligibility requests to the actual clearinghouses:
         - Dental insurance → DentalXchange (same clearinghouse your staff uses manually)
         - Medical insurance → Availity (same portal your staff logs into)
         These are the same real-time eligibility checks your staff would make.
         The system uses your practice's NPI number and Tax ID — pulled from
         your account settings, not hardcoded.

6:05 PM — Responses come back. The system categorizes each one:
         ✓ 52 patients: Active coverage confirmed, benefits parsed
         ⚠ 5 patients: Coverage active but with limitations (waiting periods, annual max near limit)
         ✗ 2 patients: Coverage inactive or terminated
         ! 1 patient: Clearinghouse returned an error (payer timeout — retry scheduled)

6:06 PM — For the 52 clear verifications: results are recorded automatically.
         No AI involved. The clearinghouse said "active" — we record "active."

6:07 PM — For the 5 patients with limitations: AI reads the raw benefits response
         and translates it into a summary your front desk can actually use:

         BEFORE (raw clearinghouse data):
         "EB*C*IND*30*0*23*1500.00~EB*B*IND*35*0*23*50~EB*A*IND*35*0*23*80~"

         AFTER (AI summary):
         "Annual max is $1,500 with $1,180 remaining. Preventive covered at 100%.
          Basic (fillings, extractions) at 80% after $50 deductible (met).
          Major (crowns, bridges) at 50%. Patient is 4 months into a 12-month
          waiting period for major services — major work not covered until June 2026."

6:08 PM — For the 2 inactive patients and the 1 error: flagged in a queue
         for your front desk to handle in the morning.

7:00 AM — Staff arrives. Dashboard shows:
         "52 verified ✓ | 5 verified with notes ⚠ | 3 need attention ✗"
         Staff handles 3 patients instead of 60.
```

**Why the numbers work:** The clearinghouse API calls take 1-3 seconds each, not 8-12 minutes. The bottleneck in manual verification isn't the lookup — it's navigating to the portal, logging in, entering patient info, interpreting the response, and recording it. The system eliminates all of that for the straightforward cases.

**What we connect to:** DentalXchange and Availity are the two largest dental and medical clearinghouses in the US. If your staff currently verifies through these portals (or through your PMS which connects to them), our system uses the same data source. We're not making up eligibility data — we're reading the same responses your staff would see, faster.

---

### 2. Claims Recovery: How We Actually Find the Money

This is where DSOs leave the most money behind. The ADA estimates that **3-5% of dental claims are denied**, and industry studies show that **50-65% of denied claims are never resubmitted**. For a DSO billing $500,000/month across locations, that's potentially **$7,500-$16,250/month in recoverable revenue** that's being written off.

Here's how the system works through a denied claim:

```
CLAIM #4521 — Patient: Johnson, Robert
  Procedure: D2740 (Crown, porcelain/ceramic)
  Billed: $1,200
  Payer: Delta Dental PPO
  Submitted: January 15
  Status: DENIED — Reason Code CO-4

Step 1 — System reads the denial code:
  CO-4 = "The procedure or revenue code is inconsistent with the modifier
  used, or a required modifier is missing."
  This is a coding issue, not a coverage issue.

Step 2 — System checks: Does this patient have coverage for D2740?
  Query: Patient's benefits show crowns covered at 50% after 12-month
  waiting period. Waiting period was met (patient effective since 2024).
  Finding: Coverage exists. This should have been paid.

Step 3 — System checks: Was prior authorization required?
  Query: Delta Dental PPO requires prior auth for crowns over $1,000.
  Finding: No prior auth on file for this claim.

Step 4 — System presents its finding to your office manager:
  "Claim #4521 denied for missing modifier/prior auth. Patient has active
   coverage for D2740 at 50%. Recommended action: Obtain retroactive prior
   auth from Delta Dental, add modifier, and resubmit. Estimated recovery:
   $600 (50% of $1,200)."

Step 5 — Your office manager reviews and approves the resubmission,
  or decides to call Delta first, or dismisses if they know something
  the system doesn't. The system never resubmits without approval.
```

**Across a 5-location DSO, the system does this for every claim over 30 days old.** It groups findings by denial reason so you can see patterns:

```
Monthly Claims Analysis — All Locations:

Top Denial Reasons:
1. Missing prior authorization — 34 claims — $28,400 recoverable
   Locations affected: Main Office (18), West Branch (12), North Clinic (4)
   → Pattern: West Branch is not checking prior auth requirements before procedures

2. Coding error (wrong modifier) — 12 claims — $8,900 recoverable
   Locations affected: Main Office (5), East Side (4), Mall Dental (3)
   → No pattern — appears to be individual coding mistakes

3. Inactive coverage at time of service — 8 claims — $6,200
   Locations affected: All locations (1-2 each)
   → These patients were not verified before their appointment

Action items:
  - Implement prior auth checklist at West Branch (training issue)
  - 34 claims ready for resubmission pending your approval
  - 8 inactive-coverage claims should be billed to patients directly
```

**This is how you find the $45,000/year.** It's not a guess — it's every denied claim, investigated, categorized, and presented with a specific dollar amount and recommended action.

---

### 3. Staffing: The Scoring Algorithm Explained

When an office posts an open shift, the system doesn't just blast it to everyone. It scores candidates against 5 factors and presents the top matches with full transparency on *why* each person ranked where they did.

**Scoring breakdown for a real shift fill:**

```
OPEN SHIFT: Hygienist needed — Main Office
  Date: Thursday, March 5, 8:00 AM - 5:00 PM
  Rate: $50-60/hr
  Requirements: Active RDH license, current CPR

CANDIDATE SCORING:

  Sarah J. — Score: 0.94
  ├── License match: RDH active, expires Dec 2026         30% → 30/30
  ├── Distance: 3.2 miles from Main Office                20% → 19/20
  ├── Availability: Marked available Thu-Fri              20% → 20/20
  ├── Performance: 4.8/5.0 from 12 past shifts            15% → 14.4/15
  ├── Rate: Preferred rate $55/hr (within $50-60 range)   15% → 10.5/15
  └── TOTAL                                                      93.9/100

  Michael T. — Score: 0.81
  ├── License match: RDH active, expires Mar 2026         30% → 30/30
  ├── Distance: 12.8 miles from Main Office               20% → 12/20
  ├── Availability: No specific availability set          20% → 10/20
  ├── Performance: 4.5/5.0 from 6 past shifts             15% → 13.5/15
  ├── Rate: Preferred rate $58/hr (within range)          15% → 15/15
  └── TOTAL                                                      80.5/100

  Jennifer L. — Score: 0.68  ⚠ Below threshold
  ├── License match: RDH active but CPR expires in 8 days 30% → 20/30
  ├── Distance: 8.4 miles from Main Office                20% → 15/20
  ├── ...
```

**Key detail:** Distance is calculated from the *specific office location*, not your DSO headquarters. If your Main Office is downtown and your West Branch is in the suburbs, a candidate 3 miles from Main Office might be 25 miles from West Branch. The system handles this automatically using Google Maps for each location address.

Your office manager sees the ranked list, the reasoning, and sends an invitation with one click. They can also adjust the scoring weights ("we care more about distance than rating for this location") — those preferences are saved per location.

---

### 4. Credential Monitoring: No AI Needed — Just Date Math That Never Forgets

This is the simplest capability and arguably the most important from a liability standpoint. There's no AI involved — it's pure date arithmetic running every day:

```
DAILY CREDENTIAL SCAN — All Locations:

For each active contractor, check 6 credential types:
  1. Professional License (state dental board)
  2. NPI Number (verify still active)
  3. Malpractice Insurance
  4. Background Check
  5. CPR/BLS Certification
  6. Immunization Records

Today's results across 142 contractors:

  EXPIRED (immediate action required):
  ├── Dr. Amanda K. — Malpractice Insurance expired Feb 20
  │   Impact: Currently scheduled for 3 shifts next week at 2 locations
  │   Action: Shift eligibility SUSPENDED pending renewal
  │   Notification: Sent to contractor + office managers at both locations
  │
  ├── James R., RDH — CPR/BLS expired Feb 18
  │   Impact: 1 shift scheduled this week
  │   Action: Shift eligibility SUSPENDED
  │   Notification: Sent to contractor + office manager

  CRITICAL (expires within 14 days):
  ├── 5 contractors with licenses expiring before March 12
  │   Renewal reminders sent automatically
  │   Flagged on office manager dashboards

  WARNING (expires within 30 days):
  ├── 12 contractors
  │   First renewal reminder sent

  UPCOMING (expires within 60 days):
  ├── 18 contractors
  │   Noted — no action yet
```

**Why this matters:** A single shift worked by a contractor with expired malpractice insurance exposes your DSO to uncovered liability. The system doesn't let it happen — expired credentials automatically block shift eligibility. Your office managers can override this with documented justification, but the default is protection.

---

### 5. Revenue Intelligence: What the Cross-Location Report Actually Shows

This is where the DSO-level value becomes clear. A single practice can track its own numbers. A DSO needs to compare locations, spot patterns, and benchmark.

**Sample monthly report — 3-location DSO:**

```
REVENUE CYCLE REPORT — February 2026
Practice: Downtown Dental Group

                        Main Office   West Branch   North Clinic   Practice Avg
                        ──────────── ────────────── ────────────── ─────────────
Billed Amount           $185,000      $142,000       $98,000        $141,667
Collected               $170,200      $110,760       $90,160        $123,707
Collection Rate         92.0%         78.0%          92.0%          87.3%
                                      ▲ BELOW BENCHMARK (92%)

Days to Payment         24 days       38 days        22 days        28 days
                                      ▲ ABOVE BENCHMARK (30 days)

Denial Rate             3.2%          8.1%           2.8%           4.7%
                                      ▲ ABOVE BENCHMARK (5%)

Write-Off Rate          1.8%          4.2%           1.5%           2.5%
                                      ▲ ABOVE BENCHMARK (3%)

TOP ISSUE IDENTIFIED:
  West Branch collection rate is pulling down the practice average by 5 points.

ROOT CAUSE ANALYSIS:
  - 34% of West Branch denials are "missing prior authorization" (vs 8% at other locations)
  - This suggests a workflow gap — staff may not be checking PA requirements before procedures
  - Estimated annual revenue impact: $45,000 in avoidable denials

RECOMMENDED ACTIONS (ranked by financial impact):
  1. Implement prior auth verification checklist at West Branch — Est. recovery: $45,000/yr
  2. Resubmit 12 coding-error claims across all locations — Est. recovery: $8,900
  3. Review fee schedule with PrimaryPayer Inc — reimbursement 15% below market at all locations
```

**This report is generated from your actual billing, payment, and verification data.** The system queries your database, runs the calculations, and uses AI to identify patterns and generate recommendations. The numbers are your numbers — the AI's job is to find the story in them.

---

## How It Fits With Your Existing Software

The most common concern from DSOs: "We run Dentrix Ascend at two locations, Curve Dental at one, and Open Dental at two. Will this work?"

**Yes. Here's why:**

EtherAI-Dental operates as a **layer on top of** your existing systems, not a replacement. Two integration points:

**1. Chrome Extension (for your staff's daily workflow):**
Your front desk installs a browser extension. When they're working in Dentrix Ascend and viewing a patient, the extension detects the patient's name, DOB, and insurance info directly from the screen. One click verifies eligibility — no switching tabs, no re-entering data.

The extension currently supports:
- Dentrix Ascend
- Curve Dental
- Open Dental Cloud
- Oryx Dental
- tab32
- Any web-based PMS (generic field detection as fallback)

**2. Central Database (for your operational data):**
All verification results, staffing records, credential status, and claims data live in one database. This is the single source of truth that your DSO dashboard reads from, regardless of which PMS each location uses. This is what makes cross-location reporting possible — even if Location 1 runs Dentrix and Location 2 runs Curve, both feed into the same data layer.

```
Location 1 (Dentrix)  ─┐
Location 2 (Curve)     ─┤
Location 3 (Dentrix)   ─┼──▶ EtherAI-Dental Central Database ──▶ DSO Dashboard
Location 4 (Open Dental)┤
Location 5 (tab32)     ─┘
```

**You keep every PMS. Nothing changes for your clinical staff.** The front desk gets a Chrome extension. Your office managers get a dashboard. You get cross-location visibility.

---

## Approval Controls & Data Governance

Every automated action requires human approval before execution. This isn't optional — it's the architecture.

**What happens without approval:**
- Insurance verification results are recorded (reading data — no patient impact)
- Credential expiration dates are checked (reading data — no patient impact)
- Financial reports are generated (reading data — no external impact)

**What requires approval before it happens:**
- Claim resubmission → Office manager must approve each one
- Patient messages → Staff reviews before sending
- Shift invitations → Office manager approves each candidate
- Contractor suspension → Office manager confirms (or overrides)
- Shift eligibility changes → Logged with who approved and why

**Audit trail for every action:**
```
Feb 25, 2026 14:32:08 — System: Claim #4521 denial analyzed, resubmission recommended
Feb 25, 2026 14:45:22 — Sarah M. (Office Manager, Main Office): Approved resubmission
Feb 25, 2026 14:45:23 — System: Claim #4521 resubmitted to Delta Dental with prior auth
Feb 26, 2026 09:15:44 — System: Claim #4521 status updated — "In Process"
```

Every entry includes: who, what, when, which location, and the full context of what was reviewed. This audit trail is exportable for compliance reviews and is maintained per HIPAA requirements.

**Autonomy is configurable per location.** Your experienced office manager at Main Office might approve batches of verifications at once. Your newer manager at the satellite office sees every item individually. You control the dial.

---

## What It Actually Costs vs. What It Saves

**For a 5-location DSO at the Enterprise tier ($349/month per location):**

| | Monthly Cost | Annual Cost |
|---|---|---|
| EtherAI-Dental subscription | $1,745/mo (5 x $349) | $20,940/year |

**Estimated annual savings:**

| Savings Area | How It's Calculated | Annual Estimate |
|---|---|---|
| Front desk time (verification) | 320-480 hrs/mo x $20/hr x 75% automated | $57,600-$86,400 |
| Claims recovery | 3-5% denial rate, 50% currently unworked, partial recovery | $30,000-$60,000 |
| Staffing efficiency | Faster fills = fewer unfilled shifts x avg revenue/shift | $15,000-$30,000 |
| Compliance risk avoidance | 1 malpractice incident avoided | Incalculable (but significant) |
| **Total estimated annual savings** | | **$102,600-$176,400** |
| **Net ROI** | Savings minus cost | **$81,660-$155,460/year** |
| **ROI multiple** | | **4.9x — 8.4x** |

These aren't made-up numbers. The verification time savings come from industry-average call times (ADA Practice Monitor). The claims recovery estimate comes from published denial and rework rates (MGMA benchmarking data). The actual numbers for your DSO will depend on your volume, payer mix, and current operational efficiency — which is exactly what our 14-day free trial is designed to measure.

---

## Pricing

| | Starter | Professional | Enterprise |
|---|---|---|---|
| **Best for** | Single practice | Multi-location practice | DSO / 5+ locations |
| **Agents included** | 2 (Verification + Credentials) | 4 (+ Staffing, Comms) | All 6 (+ Claims, Revenue) |
| **Locations** | 1 | Up to 5 | Unlimited |
| **AI operations/month** | 500 | 2,000/location | 5,000/location |
| **Cross-location reporting** | N/A | Yes | Yes + executive rollup |
| **PMS integrations** | Chrome Extension | Chrome Extension | Chrome Extension + priority support for new PMS |
| **Support** | Email | Priority email | Dedicated account manager |
| **Price** | $149/mo | $249/mo per location | $349/mo per location |

Volume discounts available for 10+ locations. 14-day free trial with full access — no credit card required. Cancel anytime.

---

## Next Step

We'd like to run EtherAI-Dental on **one of your locations for 14 days** — no charge, no commitment. At the end of the trial, we'll show you:

1. How many verification hours were saved (with exact patient counts)
2. How many denied claims were identified and their total recoverable value
3. Any credential gaps found across your contractors
4. A sample revenue intelligence report comparing that location's performance to industry benchmarks

That data will tell you — with your own numbers — whether this makes sense for your organization.

---

**EtherAI-Dental**
Operational Intelligence for Multi-Location Dental Organizations

*Contact: [Your contact information]*
