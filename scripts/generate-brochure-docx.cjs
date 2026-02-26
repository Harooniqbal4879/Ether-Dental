const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer,
} = require("docx");
const fs = require("fs");

const TEAL = "0D9488";
const DARK = "1E293B";
const GRAY = "64748B";
const LIGHT_BG = "F0FDFA";
const WHITE = "FFFFFF";
const BORDER = "E2E8F0";
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: TEAL, font: "Calibri" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    children: [new TextRun({ text, bold: true, size: 26, color: DARK, font: "Calibri" })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: TEAL, font: "Calibri" })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120, before: opts.before || 0 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({ text, size: opts.size || 20, color: opts.color || DARK, font: "Calibri", bold: opts.bold || false, italics: opts.italics || false })],
  });
}
function richP(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120 },
    children: runs.map(r => new TextRun({ text: r.text, size: r.size || 20, color: r.color || DARK, font: "Calibri", bold: r.bold || false, italics: r.italics || false })),
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, color: DARK, font: "Calibri", bold: opts.bold || false })],
  });
}
function code(lines) {
  return lines.map(line => new Paragraph({
    spacing: { after: 20 },
    indent: { left: 400 },
    children: [new TextRun({ text: line, size: 17, color: "334155", font: "Consolas" })],
  }));
}
function hCell(text, w) {
  return new TableCell({
    borders,
    shading: { type: ShadingType.SOLID, color: TEAL },
    width: w ? { size: w, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text, bold: true, size: 18, color: WHITE, font: "Calibri" })] })],
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    borders,
    shading: opts.shaded ? { type: ShadingType.SOLID, color: LIGHT_BG } : undefined,
    width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text, size: 18, color: DARK, font: "Calibri", bold: opts.bold || false })] })],
  });
}
function spacer(s = 200) { return new Paragraph({ spacing: { after: s }, children: [] }); }
function hr() { return new Paragraph({ spacing: { before: 100, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER } }, children: [] }); }

const c = [];

c.push(spacer(400));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "EtherAI-Dental", size: 52, bold: true, color: TEAL, font: "Calibri" })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "Operational Intelligence for Multi-Location Dental Organizations", size: 26, color: DARK, font: "Calibri" })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Executive Briefing for DSO Leadership", size: 22, color: GRAY, font: "Calibri", italics: true })] }));

c.push(h1("The Operational Reality of Running a DSO Today"));
c.push(p("A 5-location DSO with 20 patients per day per location handles roughly 2,400 insurance verifications per month, manages 50-100 contractor credential expirations per year, processes 1,500+ insurance claims monthly, and coordinates staffing across locations with different software systems, different office managers, and different levels of operational maturity."));
c.push(p("The math on manual processes doesn\u2019t work:", { after: 60 }));

c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [hCell("Manual Process", 30), hCell("Time per Item", 18), hCell("Monthly Volume (5 loc.)", 26), hCell("Monthly Labor Hours", 26)] }),
  new TableRow({ children: [cell("Insurance verification call", { w: 30, shaded: true }), cell("8-12 minutes", { w: 18, shaded: true }), cell("2,400 patients", { w: 26, shaded: true }), cell("320-480 hours", { w: 26, shaded: true })] }),
  new TableRow({ children: [cell("Claim denial investigation", { w: 30 }), cell("15-30 minutes", { w: 18 }), cell("75-150 denied claims", { w: 26 }), cell("19-75 hours", { w: 26 })] }),
  new TableRow({ children: [cell("Credential status check", { w: 30, shaded: true }), cell("5-10 minutes", { w: 18, shaded: true }), cell("50-100 checks", { w: 26, shaded: true }), cell("4-17 hours", { w: 26, shaded: true })] }),
  new TableRow({ children: [cell("Shift fill (calling/texting)", { w: 30 }), cell("20-45 minutes", { w: 18 }), cell("30-60 open shifts", { w: 26 }), cell("10-45 hours", { w: 26 })] }),
  new TableRow({ children: [cell("Total administrative overhead", { w: 30, bold: true }), cell("", { w: 18 }), cell("", { w: 26 }), cell("353-617 hours/month", { w: 26, bold: true })] }),
]}));

c.push(spacer(100));
c.push(richP([
  { text: "At an average front desk salary of $18-22/hour, that\u2019s " },
  { text: "$6,350-$13,575/month", bold: true },
  { text: " in labor spent on tasks that don\u2019t require human judgment for the majority of cases." },
]));
c.push(p("EtherAI-Dental separates the routine cases (which the system handles automatically) from the exceptions (which your staff handles with full context provided). Based on industry data, roughly 75-85% of insurance verifications are straightforward. Your staff should be spending their time on the 15-25% that actually need a human."));

c.push(hr());

c.push(h1("How Each Capability Actually Works"));

c.push(h2("1. Insurance Verification: What Happens Behind the Scenes"));
c.push(p("This isn\u2019t a black box. Here\u2019s exactly what the system does, step by step."));
c.push(h3("The nightly process:"));
c.push(...code([
  "6:00 PM \u2014 System pulls tomorrow\u2019s appointment schedule from your database",
  "         Example: Location 1 has 22 patients, Location 2 has 18, Location 3 has 25",
  "",
  "6:01 PM \u2014 For each patient, the system checks: do they have insurance on file?",
  "         Result: 60 patients need verification, 5 are self-pay (skipped)",
  "",
  "6:02 PM \u2014 System sends eligibility requests to the actual clearinghouses:",
  "         - Dental insurance \u2192 DentalXchange (same clearinghouse your staff uses manually)",
  "         - Medical insurance \u2192 Availity (same portal your staff logs into)",
  "         These are the same real-time eligibility checks your staff would make.",
  "         The system uses your practice\u2019s NPI number and Tax ID.",
  "",
  "6:05 PM \u2014 Responses come back. The system categorizes each one:",
  "         \u2713 52 patients: Active coverage confirmed, benefits parsed",
  "         \u26A0 5 patients: Coverage active but with limitations",
  "         \u2717 2 patients: Coverage inactive or terminated",
  "         ! 1 patient: Clearinghouse returned an error (payer timeout \u2014 retry scheduled)",
  "",
  "6:06 PM \u2014 For the 52 clear verifications: results are recorded automatically.",
  "         No AI involved. The clearinghouse said \u201Cactive\u201D \u2014 we record \u201Cactive.\u201D",
  "",
  "6:07 PM \u2014 For the 5 patients with limitations: AI reads the raw benefits response",
  "         and translates it into a summary your front desk can actually use.",
  "",
  "7:00 AM \u2014 Staff arrives. Dashboard shows:",
  "         \u201C52 verified \u2713 | 5 verified with notes \u26A0 | 3 need attention \u2717\u201D",
  "         Staff handles 3 patients instead of 60.",
]));

c.push(h3("Before and after:"));
c.push(richP([{ text: "BEFORE (raw clearinghouse data):", bold: true }]));
c.push(p("\"EB*C*IND*30*0*23*1500.00~EB*B*IND*35*0*23*50~EB*A*IND*35*0*23*80~\"", { size: 17, italics: true }));
c.push(richP([{ text: "AFTER (AI summary):", bold: true }]));
c.push(p("\"Annual max is $1,500 with $1,180 remaining. Preventive covered at 100%. Basic (fillings, extractions) at 80% after $50 deductible (met). Major (crowns, bridges) at 50%. Patient is 4 months into a 12-month waiting period for major services \u2014 major work not covered until June 2026.\"", { italics: true }));
c.push(p("The clearinghouse API calls take 1-3 seconds each, not 8-12 minutes. The bottleneck in manual verification isn\u2019t the lookup \u2014 it\u2019s navigating to the portal, logging in, entering patient info, interpreting the response, and recording it."));

c.push(hr());

c.push(h2("2. Claims Recovery: How We Actually Find the Money"));
c.push(richP([
  { text: "The ADA estimates that 3-5% of dental claims are denied, and industry studies show that " },
  { text: "50-65% of denied claims are never resubmitted", bold: true },
  { text: ". For a DSO billing $500,000/month across locations, that\u2019s potentially $7,500-$16,250/month in recoverable revenue being written off." },
]));
c.push(h3("How the system works through a denied claim:"));
c.push(...code([
  "CLAIM #4521 \u2014 Patient: Johnson, Robert",
  "  Procedure: D2740 (Crown, porcelain/ceramic)",
  "  Billed: $1,200 | Payer: Delta Dental PPO | Status: DENIED \u2014 CO-4",
  "",
  "Step 1 \u2014 System reads the denial code:",
  "  CO-4 = \"Procedure inconsistent with modifier or required modifier missing.\"",
  "  This is a coding issue, not a coverage issue.",
  "",
  "Step 2 \u2014 System checks: Does this patient have coverage for D2740?",
  "  Finding: Coverage exists. Crowns covered at 50% after waiting period (met).",
  "",
  "Step 3 \u2014 System checks: Was prior authorization required?",
  "  Finding: Delta Dental PPO requires prior auth for crowns over $1,000.",
  "  No prior auth on file.",
  "",
  "Step 4 \u2014 System presents its finding to your office manager:",
  "  \"Claim #4521 denied for missing prior auth. Patient has active coverage",
  "   for D2740 at 50%. Recommended: obtain retroactive prior auth, resubmit.",
  "   Estimated recovery: $600.\"",
  "",
  "Step 5 \u2014 Your office manager reviews and approves the resubmission.",
  "  The system never resubmits without approval.",
]));

c.push(h3("Cross-location pattern analysis:"));
c.push(...code([
  "Monthly Claims Analysis \u2014 All Locations:",
  "",
  "Top Denial Reasons:",
  "1. Missing prior authorization \u2014 34 claims \u2014 $28,400 recoverable",
  "   Locations: Main Office (18), West Branch (12), North Clinic (4)",
  "   \u2192 Pattern: West Branch not checking PA requirements before procedures",
  "",
  "2. Coding error (wrong modifier) \u2014 12 claims \u2014 $8,900 recoverable",
  "   Locations: Main Office (5), East Side (4), Mall Dental (3)",
  "",
  "3. Inactive coverage at time of service \u2014 8 claims \u2014 $6,200",
  "   \u2192 These patients were not verified before their appointment",
]));

c.push(hr());

c.push(h2("3. Staffing: The Scoring Algorithm Explained"));
c.push(p("When an office posts an open shift, the system scores candidates against 5 factors and presents the top matches with full transparency on why each person ranked where they did."));
c.push(...code([
  "OPEN SHIFT: Hygienist needed \u2014 Main Office",
  "  Date: Thursday, March 5, 8:00 AM - 5:00 PM | Rate: $50-60/hr",
  "",
  "CANDIDATE SCORING:",
  "",
  "  Sarah J. \u2014 Score: 0.94",
  "  \u251C\u2500 License match: RDH active, expires Dec 2026         30% \u2192 30/30",
  "  \u251C\u2500 Distance: 3.2 miles from Main Office                20% \u2192 19/20",
  "  \u251C\u2500 Availability: Marked available Thu-Fri              20% \u2192 20/20",
  "  \u251C\u2500 Performance: 4.8/5.0 from 12 past shifts            15% \u2192 14.4/15",
  "  \u251C\u2500 Rate: Preferred rate $55/hr (within $50-60 range)   15% \u2192 10.5/15",
  "  \u2514\u2500 TOTAL                                                      93.9/100",
  "",
  "  Michael T. \u2014 Score: 0.81",
  "  \u251C\u2500 License match: RDH active, expires Mar 2026         30% \u2192 30/30",
  "  \u251C\u2500 Distance: 12.8 miles from Main Office               20% \u2192 12/20",
  "  \u251C\u2500 Availability: No specific availability set          20% \u2192 10/20",
  "  \u251C\u2500 Performance: 4.5/5.0 from 6 past shifts             15% \u2192 13.5/15",
  "  \u251C\u2500 Rate: Preferred rate $58/hr (within range)          15% \u2192 15/15",
  "  \u2514\u2500 TOTAL                                                      80.5/100",
]));
c.push(p("Distance is calculated from the specific office location, not your DSO headquarters. Your office manager sees the ranked list, the reasoning, and sends an invitation with one click."));

c.push(hr());

c.push(h2("4. Credential Monitoring: Date Math That Never Forgets"));
c.push(p("No AI involved \u2014 pure date arithmetic running every day:"));
c.push(...code([
  "DAILY CREDENTIAL SCAN \u2014 All Locations (142 contractors):",
  "",
  "  EXPIRED (immediate action required):",
  "  \u251C\u2500 Dr. Amanda K. \u2014 Malpractice Insurance expired Feb 20",
  "  \u2502  Impact: Scheduled for 3 shifts next week at 2 locations",
  "  \u2502  Action: Shift eligibility SUSPENDED pending renewal",
  "  \u2502  Notification: Sent to contractor + office managers",
  "  \u2502",
  "  \u251C\u2500 James R., RDH \u2014 CPR/BLS expired Feb 18",
  "  \u2502  Action: Shift eligibility SUSPENDED",
  "",
  "  CRITICAL (expires within 14 days): 5 contractors",
  "  WARNING (expires within 30 days): 12 contractors",
  "  UPCOMING (expires within 60 days): 18 contractors",
]));
c.push(richP([
  { text: "A single shift worked by a contractor with expired malpractice insurance exposes your DSO to uncovered liability.", bold: true },
  { text: " The system doesn\u2019t let it happen \u2014 expired credentials automatically block shift eligibility." },
]));

c.push(hr());

c.push(h2("5. Revenue Intelligence: The Cross-Location Report"));
c.push(p("This is where the DSO-level value becomes clear. A single practice can track its own numbers. A DSO needs to compare locations, spot patterns, and benchmark."));
c.push(...code([
  "REVENUE CYCLE REPORT \u2014 February 2026",
  "Practice: Downtown Dental Group",
  "",
  "                        Main Office   West Branch   North Clinic   Practice Avg",
  "Billed Amount           $185,000      $142,000       $98,000        $141,667",
  "Collected               $170,200      $110,760       $90,160        $123,707",
  "Collection Rate         92.0%         78.0%          92.0%          87.3%",
  "                                      \u25B2 BELOW BENCHMARK (92%)",
  "",
  "Denial Rate             3.2%          8.1%           2.8%           4.7%",
  "                                      \u25B2 ABOVE BENCHMARK (5%)",
  "",
  "TOP ISSUE: West Branch collection rate pulling down practice average by 5 pts.",
  "",
  "ROOT CAUSE:",
  "  34% of West Branch denials are \"missing prior authorization\"",
  "  (vs 8% at other locations) \u2014 workflow gap, not a payer issue",
  "  Estimated annual revenue impact: $45,000 in avoidable denials",
  "",
  "RECOMMENDED ACTIONS (ranked by financial impact):",
  "  1. Implement prior auth checklist at West Branch \u2014 Est. recovery: $45,000/yr",
  "  2. Resubmit 12 coding-error claims \u2014 Est. recovery: $8,900",
  "  3. Review fee schedule with PrimaryPayer Inc \u2014 reimbursement 15% below market",
]));

c.push(hr());

c.push(h1("How It Fits With Your Existing Software"));
c.push(richP([
  { text: "You don\u2019t switch systems. ", bold: true },
  { text: "EtherAI-Dental operates as a layer on top of your existing PMS platforms. Two integration points:" },
]));

c.push(h3("1. Chrome Extension (for daily workflow):"));
c.push(p("Your front desk installs a browser extension. When they\u2019re working in Dentrix Ascend and viewing a patient, the extension detects the patient\u2019s info directly from the screen. One click verifies eligibility \u2014 no tab switching. Currently supports Dentrix Ascend, Curve Dental, Open Dental Cloud, Oryx, tab32, and any web-based PMS (generic fallback)."));

c.push(h3("2. Central Database (for operational data):"));
c.push(p("All verification results, staffing records, credential status, and claims data live in one database \u2014 the single source of truth that your DSO dashboard reads from, regardless of which PMS each location uses."));

c.push(...code([
  "Location 1 (Dentrix)  \u2500\u2510",
  "Location 2 (Curve)     \u2500\u2524",
  "Location 3 (Dentrix)   \u2500\u253C\u2500\u25B6 EtherAI-Dental Central DB \u2500\u25B6 DSO Dashboard",
  "Location 4 (Open Dental)\u2524",
  "Location 5 (tab32)     \u2500\u2518",
]));

c.push(hr());

c.push(h1("Approval Controls & Data Governance"));

c.push(h3("What happens without approval:"));
c.push(bullet("Insurance verification results are recorded (reading data \u2014 no patient impact)"));
c.push(bullet("Credential expiration dates are checked (reading data \u2014 no patient impact)"));
c.push(bullet("Financial reports are generated (reading data \u2014 no external impact)"));

c.push(h3("What requires approval before it happens:"));
c.push(bullet("Claim resubmission \u2192 Office manager must approve each one"));
c.push(bullet("Patient messages \u2192 Staff reviews before sending"));
c.push(bullet("Shift invitations \u2192 Office manager approves each candidate"));
c.push(bullet("Contractor suspension \u2192 Office manager confirms (or overrides)"));

c.push(h3("Audit trail for every action:"));
c.push(...code([
  "Feb 25, 2026 14:32:08 \u2014 System: Claim #4521 denial analyzed, resubmission recommended",
  "Feb 25, 2026 14:45:22 \u2014 Sarah M. (Office Manager): Approved resubmission",
  "Feb 25, 2026 14:45:23 \u2014 System: Claim #4521 resubmitted to Delta Dental",
  "Feb 26, 2026 09:15:44 \u2014 System: Claim #4521 status updated \u2014 \"In Process\"",
]));
c.push(p("Every entry includes: who, what, when, which location, and the full context. Exportable for compliance reviews."));
c.push(richP([
  { text: "Autonomy is configurable per location. ", bold: true },
  { text: "Your experienced office manager at Main Office might approve batches at once. Your newer manager at the satellite office sees every item individually. You control the dial." },
]));

c.push(hr());

c.push(h1("What It Actually Costs vs. What It Saves"));
c.push(p("For a 5-location DSO at the Enterprise tier ($349/month per location):", { bold: true }));

c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [hCell("", 50), hCell("Monthly", 25), hCell("Annual", 25)] }),
  new TableRow({ children: [cell("EtherAI-Dental subscription", { w: 50, shaded: true }), cell("$1,745/mo (5 x $349)", { w: 25, shaded: true }), cell("$20,940/year", { w: 25, shaded: true })] }),
]}));

c.push(spacer(100));
c.push(p("Estimated annual savings:", { bold: true }));

c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [hCell("Savings Area", 30), hCell("How It\u2019s Calculated", 40), hCell("Annual Estimate", 30)] }),
  new TableRow({ children: [cell("Front desk time", { w: 30, shaded: true }), cell("320-480 hrs/mo x $20/hr x 75% automated", { w: 40, shaded: true }), cell("$57,600-$86,400", { w: 30, shaded: true })] }),
  new TableRow({ children: [cell("Claims recovery", { w: 30 }), cell("3-5% denial rate, 50% unworked, partial recovery", { w: 40 }), cell("$30,000-$60,000", { w: 30 })] }),
  new TableRow({ children: [cell("Staffing efficiency", { w: 30, shaded: true }), cell("Faster fills = fewer unfilled shifts x avg revenue/shift", { w: 40, shaded: true }), cell("$15,000-$30,000", { w: 30, shaded: true })] }),
  new TableRow({ children: [cell("Compliance risk avoidance", { w: 30 }), cell("1 malpractice incident avoided", { w: 40 }), cell("Incalculable", { w: 30 })] }),
  new TableRow({ children: [cell("Total estimated savings", { w: 30, bold: true }), cell("", { w: 40 }), cell("$102,600-$176,400", { w: 30, bold: true })] }),
  new TableRow({ children: [cell("Net ROI", { w: 30, bold: true }), cell("Savings minus cost", { w: 40 }), cell("$81,660-$155,460/year", { w: 30, bold: true })] }),
  new TableRow({ children: [cell("ROI multiple", { w: 30, bold: true }), cell("", { w: 40 }), cell("4.9x \u2014 8.4x", { w: 30, bold: true })] }),
]}));

c.push(spacer(80));
c.push(p("Sources: ADA Practice Monitor (verification call times), MGMA benchmarking data (denial and rework rates). Actual numbers depend on your volume, payer mix, and current efficiency \u2014 which is what our 14-day free trial measures.", { size: 18, color: GRAY, italics: true }));

c.push(hr());

c.push(h1("Pricing"));
c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [hCell("", 25), hCell("Starter", 25), hCell("Professional", 25), hCell("Enterprise", 25)] }),
  new TableRow({ children: [cell("Best for", { w: 25, bold: true, shaded: true }), cell("Single practice", { w: 25, shaded: true }), cell("Multi-location practice", { w: 25, shaded: true }), cell("DSO / 5+ locations", { w: 25, shaded: true })] }),
  new TableRow({ children: [cell("Agents", { w: 25, bold: true }), cell("2 (Verification + Credentials)", { w: 25 }), cell("4 (+ Staffing, Comms)", { w: 25 }), cell("All 6 (+ Claims, Revenue)", { w: 25 })] }),
  new TableRow({ children: [cell("Locations", { w: 25, bold: true, shaded: true }), cell("1", { w: 25, shaded: true }), cell("Up to 5", { w: 25, shaded: true }), cell("Unlimited", { w: 25, shaded: true })] }),
  new TableRow({ children: [cell("AI operations/mo", { w: 25, bold: true }), cell("500", { w: 25 }), cell("2,000/location", { w: 25 }), cell("5,000/location", { w: 25 })] }),
  new TableRow({ children: [cell("Cross-location reporting", { w: 25, bold: true, shaded: true }), cell("N/A", { w: 25, shaded: true }), cell("Yes", { w: 25, shaded: true }), cell("Yes + executive rollup", { w: 25, shaded: true })] }),
  new TableRow({ children: [cell("Support", { w: 25, bold: true }), cell("Email", { w: 25 }), cell("Priority email", { w: 25 }), cell("Dedicated account manager", { w: 25 })] }),
  new TableRow({ children: [cell("Price", { w: 25, bold: true, shaded: true }), cell("$149/mo", { w: 25, shaded: true }), cell("$249/mo per location", { w: 25, shaded: true }), cell("$349/mo per location", { w: 25, shaded: true })] }),
]}));
c.push(p("Volume discounts available for 10+ locations. 14-day free trial with full access \u2014 no credit card required.", { size: 18, italics: true }));

c.push(hr());

c.push(h1("Next Step"));
c.push(richP([
  { text: "We\u2019d like to run EtherAI-Dental on " },
  { text: "one of your locations for 14 days", bold: true },
  { text: " \u2014 no charge, no commitment. At the end of the trial, we\u2019ll show you:" },
]));
c.push(bullet("How many verification hours were saved (with exact patient counts)"));
c.push(bullet("How many denied claims were identified and their total recoverable value"));
c.push(bullet("Any credential gaps found across your contractors"));
c.push(bullet("A sample revenue intelligence report comparing that location\u2019s performance to industry benchmarks"));
c.push(spacer(100));
c.push(p("That data will tell you \u2014 with your own numbers \u2014 whether this makes sense for your organization.", { bold: true }));
c.push(spacer(200));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EtherAI-Dental", size: 28, bold: true, color: TEAL, font: "Calibri" })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Operational Intelligence for Multi-Location Dental Organizations", size: 20, color: GRAY, font: "Calibri", italics: true })] }));

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 20, color: DARK } } } },
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "EtherAI-Dental \u2014 Executive Briefing", size: 16, color: GRAY, font: "Calibri", italics: true })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential \u2014 EtherAI-Dental", size: 14, color: GRAY, font: "Calibri" })] })] }) },
    children: c,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("docs/EtherAI-Dental-Executive-Brochure.docx", buffer);
  console.log("Brochure Word document generated: docs/EtherAI-Dental-Executive-Brochure.docx");
  console.log("File size:", (buffer.length / 1024).toFixed(1), "KB");
});
