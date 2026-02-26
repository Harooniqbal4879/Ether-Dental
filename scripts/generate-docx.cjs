const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, Header, Footer, TabStopPosition, TabStopType,
} = require("docx");
const fs = require("fs");

const TEAL = "0D9488";
const DARK = "1E293B";
const GRAY = "64748B";
const LIGHT_BG = "F0FDFA";
const WHITE = "FFFFFF";
const BORDER = "E2E8F0";

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22, color: level === HeadingLevel.HEADING_1 ? TEAL : DARK, font: "Calibri" })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.spacingAfter || 120 },
    alignment: opts.alignment || AlignmentType.LEFT,
    children: [new TextRun({ text, size: opts.size || 20, color: opts.color || DARK, font: "Calibri", bold: opts.bold || false, italics: opts.italics || false })],
  });
}

function richPara(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.spacingAfter || 120 },
    alignment: opts.alignment || AlignmentType.LEFT,
    children: runs.map(r => new TextRun({ text: r.text, size: r.size || 20, color: r.color || DARK, font: "Calibri", bold: r.bold || false, italics: r.italics || false })),
  });
}

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function headerCell(text) {
  return new TableCell({
    borders,
    shading: { type: ShadingType.SOLID, color: TEAL },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: WHITE, font: "Calibri" })], spacing: { before: 40, after: 40 } })],
    width: { size: 25, type: WidthType.PERCENTAGE },
  });
}

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    shading: opts.shaded ? { type: ShadingType.SOLID, color: LIGHT_BG } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text, size: opts.size || 18, color: opts.color || DARK, font: "Calibri", bold: opts.bold || false })],
      spacing: { before: 30, after: 30 },
    })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function painPointTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell("#"), headerCell("Pain Point"), headerCell("Business Impact"), headerCell("EtherAI-Dental Solution")], tableHeader: true }),
      ...rows.map((r, i) => new TableRow({
        children: [
          cell(r.num, { width: 6, shaded: i % 2 === 0 }),
          cell(r.pain, { width: 38, shaded: i % 2 === 0 }),
          cell(r.impact, { width: 28, shaded: i % 2 === 0 }),
          cell(r.solution, { width: 28, shaded: i % 2 === 0 }),
        ],
      })),
    ],
  });
}

const sections = [
  {
    title: "1. Operations & Workflow",
    intro: "Manual, inconsistent processes across locations consume staff time and create operational silos.",
    rows: [
      { num: "1.1", pain: "Front desk staff at each location spend 1-2 hours every morning manually verifying insurance before the first patient arrives", impact: "320-480 labor hours/month across a 5-location DSO", solution: "Overnight batch verification \u2014 all patients verified before staff arrives" },
      { num: "1.2", pain: "Insurance verification is done one patient at a time \u2014 call the payer, navigate the portal, enter patient info, wait, interpret the response, record the result", impact: "8-12 minutes per patient, compounding across 20+ patients/day/location", solution: "Automated clearinghouse calls (DentalXchange + Availity) complete in 1-3 seconds each" },
      { num: "1.3", pain: "Walk-in patients and emergency adds have no verified coverage \u2014 staff scrambles mid-day while other patients wait", impact: "Delayed check-ins, longer wait times, potential uncompensated care", solution: "Chrome Extension verifies eligibility in seconds from the PMS screen \u2014 no tab switching" },
      { num: "1.4", pain: "Each location handles verifications differently \u2014 no standard process, no consistency in how results are recorded", impact: "Unreliable data, no way to compare verification rates across locations", solution: "Single verification workflow across all locations with results stored in one database" },
      { num: "1.5", pain: "Appointment confirmations and patient reminders are inconsistent \u2014 some locations text, some call, some email, some do nothing", impact: "Higher no-show rates at inconsistent locations, lost revenue from empty chairs", solution: "Patient Communication Agent sends standardized, personalized reminders per location" },
      { num: "1.6", pain: "Patient intake forms are filled out on paper at some locations and digitally at others \u2014 no standard across the organization", impact: "Duplicate data entry, transcription errors, slow check-in", solution: "Digital-first patient records with insurance data pre-populated from verification results" },
      { num: "1.7", pain: "When a patient transfers between locations, their verification and benefits information doesn\u2019t follow them", impact: "Re-verification required, patient frustration, wasted staff time", solution: "Central database \u2014 verification results are accessible from any location" },
      { num: "1.8", pain: "Office managers are buried in administrative work instead of managing their teams and patient experience", impact: "Management capacity consumed by routine tasks, staff morale suffers", solution: "AI handles routine operations, surfaces only exceptions and decisions to managers" },
    ],
  },
  {
    title: "2. Revenue & Financial Leakage",
    intro: "Denied claims, aging AR, and missed billing opportunities represent the largest financial drain on DSOs.",
    rows: [
      { num: "2.1", pain: "3-5% of dental claims are denied nationally, and 50-65% of denied claims are never reworked or resubmitted", impact: "For a DSO billing $500K/month: $7,500-$16,250/month in recoverable revenue abandoned", solution: "Claims Follow-Up Agent investigates every denial, categorizes by reason, recommends corrective action" },
      { num: "2.2", pain: "Denied claims sit in a queue that nobody has time to investigate \u2014 they age out and get written off", impact: "Revenue lost permanently after timely filing limits pass (typically 90-180 days)", solution: "Automated aging tracking with alerts at 30/60/90 days \u2014 claims don\u2019t fall through the cracks" },
      { num: "2.3", pain: "Coding errors (wrong CDT code, missing modifier) account for a significant portion of preventable denials", impact: "Each coding error denial costs $150-$1,500+ in lost revenue plus rework time", solution: "System identifies coding-error denials and flags the specific correction needed for resubmission" },
      { num: "2.4", pain: "Missing prior authorizations are discovered after the procedure, not before \u2014 leading to denials that could have been prevented", impact: "One of the top 3 denial reasons in dentistry \u2014 entirely preventable", solution: "Verification process checks PA requirements before the appointment, not after" },
      { num: "2.5", pain: "Patients with inactive coverage receive treatment and then can\u2019t pay \u2014 the practice eats the cost or sends to collections", impact: "Average uncollected patient balance: $200-$500 per incident", solution: "Overnight verification catches inactive coverage before the patient arrives" },
      { num: "2.6", pain: "Fee schedules are not regularly reviewed against payer reimbursement rates \u2014 some locations may be billing below market for years", impact: "Systematic under-billing of 5-15% on certain procedure codes across entire payer contracts", solution: "Revenue Intelligence Agent compares reimbursement rates across locations and against benchmarks" },
      { num: "2.7", pain: "Aging accounts receivable (60+ days) grow because there\u2019s no systematic follow-up process", impact: "Cash flow impact: $50,000-$200,000+ tied up in aging AR for a mid-size DSO", solution: "Automated AR aging reports with prioritized follow-up actions per location" },
      { num: "2.8", pain: "Write-off rates vary wildly by location with no visibility into why one location writes off 4% and another writes off 1.5%", impact: "Hidden operational problems at high-write-off locations go undiagnosed", solution: "Cross-location write-off comparison with root cause analysis" },
      { num: "2.9", pain: "Patient balances go uncollected because statements are sent late, inconsistently, or not at all", impact: "$50-$300 per patient balance that ages beyond 90 days becomes increasingly uncollectable", solution: "Automated patient balance notifications triggered by billing events" },
      { num: "2.10", pain: "No one is tracking the total dollar value of claims sitting in denial across the organization", impact: "DSO leadership has no visibility into the size of the revenue leak", solution: "Real-time denial dashboard showing total recoverable value by location, payer, and denial reason" },
    ],
  },
  {
    title: "3. Staffing & Workforce",
    intro: "Finding, vetting, and managing contract dental professionals across multiple locations is manual, slow, and error-prone.",
    rows: [
      { num: "3.1", pain: "When a hygienist or assistant calls out, the office manager starts a manual phone/text chain that can take hours and often fails", impact: "20-45 minutes per shift fill attempt; unfilled shifts = cancelled patients", solution: "Shift Matchmaker scores and ranks available professionals in seconds, sends invitations with one click" },
      { num: "3.2", pain: "Unfilled shifts mean cancelled patients, lost revenue, and frustrated remaining staff who have to cover", impact: "Average revenue per hygienist hour: $150-$250; one unfilled 8-hour shift = $1,200-$2,000 lost", solution: "Faster, smarter matching reduces unfilled shifts \u2014 system searches across all locations\u2019 professional pools" },
      { num: "3.3", pain: "No central view of which professionals are available across all locations \u2014 each office manager manages their own contacts", impact: "Duplicate effort, missed opportunities when a professional near one location is unknown to that office", solution: "Shared professional pool with availability, location-based distance scoring, and cross-location visibility" },
      { num: "3.4", pain: "Credential verification for temporary and contract staff is manual \u2014 someone has to check each license, certification, and insurance policy", impact: "5-10 minutes per credential check, multiplied across 50-100+ contractors", solution: "Automated daily credential scanning across all contractors \u2014 no manual checks needed" },
      { num: "3.5", pain: "Contractor onboarding takes too long \u2014 by the time paperwork is done, the need has passed", impact: "Days to weeks for manual onboarding vs. hours needed for immediate staffing gaps", solution: "6-step digital onboarding wizard with built-in verification (ID, W-9, agreements, credentials, payment)" },
      { num: "3.6", pain: "No consistent process for verifying 1099 contractor compliance (W-9, agreements, background checks) across locations", impact: "IRS penalties for missing W-9s; liability for unverified contractors", solution: "Onboarding enforces all compliance requirements before a contractor can be assigned shifts" },
      { num: "3.7", pain: "Rate negotiations happen informally \u2014 no data on what the market rate is or what the DSO has paid similar professionals before", impact: "Overpaying for some shifts, losing candidates on others due to below-market offers", solution: "Historical rate data per role, location, and professional \u2014 informs competitive offers" },
      { num: "3.8", pain: "No performance tracking for temporary staff \u2014 office managers rely on memory and word of mouth", impact: "Poor performers get re-hired; good performers aren\u2019t prioritized", solution: "Performance ratings from completed shifts feed into matching algorithm \u2014 top performers rank higher" },
      { num: "3.9", pain: "Scheduling conflicts arise when the same professional is booked at two locations without anyone knowing", impact: "Double-booking leads to last-minute cancellations and scrambling", solution: "Central shift system prevents double-booking across all locations" },
    ],
  },
  {
    title: "4. Compliance & Risk",
    intro: "Credential gaps, missing audit trails, and inconsistent compliance processes expose DSOs to significant legal and regulatory risk.",
    rows: [
      { num: "4.1", pain: "Expired credentials (licenses, malpractice insurance, CPR certifications) are discovered reactively \u2014 after the contractor has already worked shifts", impact: "Legal liability exposure for every shift worked with expired credentials", solution: "Daily automated credential scanning with 60/30/14-day advance warnings" },
      { num: "4.2", pain: "One shift worked by a contractor with expired malpractice insurance exposes the entire DSO to uncovered liability", impact: "Potential six-figure+ liability in a malpractice event with no insurance coverage", solution: "Automatic shift eligibility suspension when credentials expire \u2014 cannot be assigned until renewed" },
      { num: "4.3", pain: "HIPAA compliance training and documentation varies by location \u2014 no centralized tracking", impact: "Potential HIPAA violations carry fines of $100-$50,000 per incident, up to $1.5M/year per category", solution: "Centralized compliance tracking with per-contractor and per-location status" },
      { num: "4.4", pain: "Background checks expire and renewals are missed because no one is tracking the dates", impact: "Working with unverified individuals in a patient care environment", solution: "Credential monitoring tracks background check expiration dates alongside all other credentials" },
      { num: "4.5", pain: "Audit readiness is poor \u2014 if a state board or insurer asks for credential history, it takes days to compile", impact: "Audit response delays raise red flags with regulators and payers", solution: "Complete audit trail with instant filtering by location, date range, contractor, and credential type" },
      { num: "4.6", pain: "No centralized record of who approved what and when \u2014 decisions are made over text, email, and phone calls with no audit trail", impact: "No defensible record if a decision is challenged by a regulator, payer, or in litigation", solution: "Every system action logged with timestamp, actor, location, and full decision context" },
      { num: "4.7", pain: "Immunization records for contractors working with patients are tracked on spreadsheets (or not tracked at all)", impact: "Patient safety risk; potential liability if an unvaccinated contractor transmits illness", solution: "Immunization records tracked as a credential type with expiration monitoring" },
      { num: "4.8", pain: "OSHA compliance documentation is location-dependent with no DSO-level visibility", impact: "Each location is independently liable; DSO leadership can\u2019t verify compliance without site visits", solution: "Centralized compliance dashboard with location-level drill-down" },
    ],
  },
  {
    title: "5. Software & Systems Fragmentation",
    intro: "DSOs frequently operate multiple PMS platforms across locations, creating data silos that prevent unified operations and reporting.",
    rows: [
      { num: "5.1", pain: "Different locations run different Practice Management Systems (PMS) \u2014 Dentrix Ascend at some, Curve Dental at others, Open Dental elsewhere", impact: "No unified view of the organization; each location is an operational silo", solution: "Chrome Extension works on top of any web-based PMS \u2014 detects and integrates with each system" },
      { num: "5.2", pain: "None of these systems talk to each other natively \u2014 no built-in way to share data across locations running different PMS", impact: "Patient transfers, cross-location reporting, and centralized management are manual processes", solution: "Central database serves as the unified data layer regardless of which PMS each location runs" },
      { num: "5.3", pain: "Reporting requires exporting from each PMS into Excel, normalizing the data manually, and building comparison spreadsheets", impact: "Hours of analyst time per report; reports are stale by the time they\u2019re assembled", solution: "Real-time dashboards pull from central database \u2014 no manual exports or normalization needed" },
      { num: "5.4", pain: "Software migrations are risky and expensive \u2014 switching all locations to one PMS could cost $50,000-$100,000+ and months of disruption", impact: "DSOs are locked into fragmented systems because the cost of unification is prohibitive", solution: "No migration required \u2014 EtherAI-Dental adds a layer on top, not a replacement underneath" },
      { num: "5.5", pain: "Each PMS has different terminology, different report formats, and different data structures \u2014 apples-to-apples comparison is nearly impossible", impact: "Executive decisions are made on inconsistent data or no data at all", solution: "Standardized data model normalizes information from all PMS sources into consistent metrics" },
      { num: "5.6", pain: "Cloud-based PMS systems have limited or no API access \u2014 making deep integration difficult or impossible", impact: "Technical barriers prevent building connections between systems", solution: "Chrome Extension uses browser-level data extraction \u2014 works regardless of PMS API availability" },
      { num: "5.7", pain: "Staff training has to cover different software at different locations \u2014 no standardization possible", impact: "Higher training costs, longer ramp-up for new hires, difficulty transferring staff between locations", solution: "EtherAI-Dental interface is consistent across all locations \u2014 staff learns one tool regardless of underlying PMS" },
      { num: "5.8", pain: "Clearinghouse portals (DentalXchange, Availity) require separate logins and manual navigation \u2014 they don\u2019t integrate into the daily workflow", impact: "Context switching wastes time; staff must leave their PMS to verify insurance", solution: "Chrome Extension brings verification into the PMS workflow \u2014 one click from the patient screen" },
      { num: "5.9", pain: "Imaging systems, patient communication tools, payment processors, and the PMS are all separate products that don\u2019t share data", impact: "Information is scattered across 4-6+ systems with no single source of truth", solution: "EtherAI-Dental consolidates verification, communication, staffing, and compliance data into one platform" },
      { num: "5.10", pain: "When the DSO acquires a new practice, integrating their existing software into the organization\u2019s operations takes months", impact: "Acquisition integration delays mean the new location operates as an island", solution: "New location installs Chrome Extension and connects to the central platform \u2014 operational visibility from day one" },
    ],
  },
  {
    title: "6. Reporting & Visibility",
    intro: "DSO leadership lacks real-time, cross-location insight into operational and financial performance.",
    rows: [
      { num: "6.1", pain: "DSO executives rely on monthly P&L statements that are 2-4 weeks old by the time they\u2019re reviewed", impact: "Decisions are based on stale data; problems aren\u2019t caught until they\u2019ve compounded", solution: "Real-time financial dashboards with daily-updated metrics" },
      { num: "6.2", pain: "No real-time visibility into collection rates, denial rates, or AR aging across locations", impact: "Revenue problems at individual locations are invisible until the monthly close", solution: "Live KPI tracking per location with automatic benchmark comparison" },
      { num: "6.3", pain: "Cross-location performance comparison requires manual data compilation \u2014 it happens quarterly at best", impact: "Underperforming locations go undetected for months", solution: "Side-by-side location comparison generated automatically \u2014 collection rate, denial rate, days-to-payment, write-off rate" },
      { num: "6.4", pain: "Identifying underperforming locations depends on anecdotal feedback from office managers rather than data", impact: "Subjective reporting masks operational problems; high performers aren\u2019t recognized", solution: "Data-driven performance ranking with specific metrics and root cause analysis for outliers" },
      { num: "6.5", pain: "Revenue trends and patterns (which payers are problematic, which procedures are denied most) are invisible without dedicated analyst time", impact: "Systemic issues repeat across locations without being identified", solution: "Revenue Intelligence Agent surfaces patterns automatically" },
      { num: "6.6", pain: "Board and investor reporting requires significant manual effort \u2014 data from multiple systems must be pulled, normalized, and presented", impact: "Executive time spent assembling reports instead of acting on insights", solution: "Executive rollup reports generated on demand with export-ready formatting" },
      { num: "6.7", pain: "Benchmarking against industry standards (ADA, MGMA) is done informally or not at all", impact: "No objective measure of whether the DSO is performing above or below market", solution: "Built-in benchmark comparison for collection rate, denial rate, days-to-payment, and other KPIs" },
      { num: "6.8", pain: "No way to answer basic questions quickly: \u201CWhat\u2019s our average days-to-payment by payer across all locations?\u201D", impact: "Leadership operates on intuition rather than data", solution: "Natural-language financial insights with drill-down by location, payer, procedure, and time period" },
      { num: "6.9", pain: "Patient volume trends per location are tracked in the PMS but not visible at the DSO level without manual extraction", impact: "Growth or decline at individual locations goes unnoticed until it hits revenue", solution: "Centralized appointment and patient volume tracking across all locations" },
      { num: "6.10", pain: "Staffing costs as a percentage of revenue vary by location but there\u2019s no easy way to compare", impact: "Labor cost inefficiencies at specific locations are hidden", solution: "Staffing cost analysis per location with revenue-per-labor-hour comparisons" },
    ],
  },
  {
    title: "7. Growth & Scalability",
    intro: "Manual processes and fragmented systems make DSO growth increasingly painful with each new location.",
    rows: [
      { num: "7.1", pain: "Acquiring a new practice means months of operational integration \u2014 different PMS, different workflows, different staff training", impact: "Acquisition ROI is delayed; new locations operate as islands during integration", solution: "Chrome Extension + central platform \u2014 new location is operationally connected within days, not months" },
      { num: "7.2", pain: "There\u2019s no playbook for onboarding a new location \u2014 each acquisition is handled ad hoc", impact: "Inconsistent integration quality; lessons from past acquisitions aren\u2019t captured", solution: "Standardized location onboarding \u2014 same verification, staffing, and compliance setup for every new location" },
      { num: "7.3", pain: "Scaling from 3 to 10 locations multiplies every manual process by the number of locations", impact: "Administrative overhead grows linearly (or worse) with location count", solution: "Automated processes scale without adding headcount \u2014 10 locations use the same system as 3" },
      { num: "7.4", pain: "Centralized oversight becomes impossible beyond 5-7 locations without dedicated operations staff", impact: "DSOs hire regional managers to compensate for lack of systems", solution: "One dashboard covers all locations \u2014 DSO executive has real-time visibility without intermediaries" },
      { num: "7.5", pain: "The DSO has to hire more administrative staff to manage more locations \u2014 overhead grows linearly with location count", impact: "Administrative cost per location stays flat or increases instead of decreasing with scale", solution: "AI handles routine operations at all locations \u2014 incremental cost per location is the subscription, not headcount" },
      { num: "7.6", pain: "Best practices from high-performing locations aren\u2019t systematically shared with underperformers", impact: "Operational excellence depends on individual office managers, not organizational systems", solution: "Cross-location comparison identifies what top locations do differently \u2014 specific, actionable findings" },
      { num: "7.7", pain: "Insurance payer contracts are negotiated per-location instead of leveraging DSO-wide volume", impact: "Missed opportunity to negotiate better reimbursement rates using aggregate volume", solution: "Organization-wide payer analysis shows total volume per payer \u2014 data for contract negotiations" },
    ],
  },
  {
    title: "8. Patient Experience",
    intro: "Patients bear the consequences of operational inefficiency through surprise billing, inconsistent communication, and longer wait times.",
    rows: [
      { num: "8.1", pain: "Patients are told at check-in that their insurance is inactive \u2014 creating surprise, frustration, and sometimes cancellations", impact: "Poor patient experience, negative reviews, lost appointments", solution: "Inactive coverage caught overnight \u2014 patient contacted proactively before their appointment" },
      { num: "8.2", pain: "Benefits are explained in insurance jargon that patients don\u2019t understand \u2014 leading to confusion about what they owe", impact: "Patients delay or decline treatment due to cost uncertainty", solution: "AI-generated plain-English benefits summary: \u201CYour crown is covered at 50%, your estimated cost is $600\u201D" },
      { num: "8.3", pain: "Appointment reminders are generic and don\u2019t include useful information (coverage status, outstanding balance, location address)", impact: "Higher no-show rates, patients arrive unprepared", solution: "Personalized reminders include verified coverage status, balance info, and location-specific details" },
      { num: "8.4", pain: "Patients who visit multiple locations within the DSO have to re-verify insurance and fill out forms each time", impact: "Patient perceives each location as a separate business, not part of a network", solution: "Central patient record \u2014 verification and insurance data follows the patient across locations" },
      { num: "8.5", pain: "Wait times increase when front desk is on the phone verifying insurance instead of checking in patients", impact: "Patients waiting in the lobby while staff is on hold with payers", solution: "Verification done overnight \u2014 front desk is available for patient interaction from the first minute" },
      { num: "8.6", pain: "Patient billing statements are delayed because claims processing and follow-up lag behind", impact: "Patients receive bills months after treatment, leading to disputes and payment resistance", solution: "Faster claims processing and follow-up means statements go out sooner with accurate amounts" },
      { num: "8.7", pain: "No proactive communication when a patient\u2019s insurance status changes between scheduling and appointment date", impact: "Coverage changes discovered at check-in \u2014 appointment may need to be rescheduled or repriced", solution: "System re-verifies scheduled patients periodically and alerts staff if coverage status changes" },
    ],
  },
];

const summaryRows = [
  { cat: "Operations & Workflow", count: "8", impact: "Labor cost, inconsistency, staff burnout" },
  { cat: "Revenue & Financial Leakage", count: "10", impact: "Direct revenue loss, cash flow, write-offs" },
  { cat: "Staffing & Workforce", count: "9", impact: "Unfilled shifts, compliance gaps, overpayment" },
  { cat: "Compliance & Risk", count: "8", impact: "Legal liability, regulatory penalties, audit readiness" },
  { cat: "Software & Systems Fragmentation", count: "10", impact: "Operational silos, no unified visibility, migration cost" },
  { cat: "Reporting & Visibility", count: "10", impact: "Decisions on stale/no data, hidden problems" },
  { cat: "Growth & Scalability", count: "7", impact: "Linear overhead growth, slow acquisition integration" },
  { cat: "Patient Experience", count: "7", impact: "No-shows, confusion, negative perception" },
];

const coverageRows = [
  { cap: "Insurance Verification Agent", points: "1.1, 1.2, 1.3, 1.4, 1.7, 2.4, 2.5, 5.8, 8.1, 8.4, 8.5, 8.7", cats: "Operations, Revenue, Software, Patient Experience" },
  { cap: "Benefits Summarization (AI)", points: "8.2", cats: "Patient Experience" },
  { cap: "Claims Follow-Up Agent", points: "2.1, 2.2, 2.3, 2.4, 2.7, 2.9, 2.10, 8.6", cats: "Revenue, Patient Experience" },
  { cap: "Shift Matchmaker Agent", points: "3.1, 3.2, 3.3, 3.7, 3.8, 3.9", cats: "Staffing" },
  { cap: "Patient Communication Agent", points: "1.5, 8.1, 8.3, 8.5, 8.7", cats: "Operations, Patient Experience" },
  { cap: "Credential Monitoring Agent", points: "3.4, 4.1, 4.2, 4.3, 4.4, 4.7", cats: "Staffing, Compliance" },
  { cap: "Revenue Intelligence Agent", points: "2.6, 2.8, 6.1\u20136.10, 7.6, 7.7", cats: "Revenue, Reporting, Growth" },
  { cap: "Contractor Onboarding", points: "3.5, 3.6, 4.5, 4.6", cats: "Staffing, Compliance" },
  { cap: "Chrome Extension", points: "1.3, 5.1, 5.2, 5.6, 5.7, 5.8", cats: "Operations, Software" },
  { cap: "Central Database & Dashboard", points: "1.4, 1.7, 5.2, 5.3, 5.5, 5.9, 6.1\u20136.10, 7.1\u20137.5, 8.4", cats: "Software, Reporting, Growth, Patient Experience" },
  { cap: "Approval & Audit System", points: "4.5, 4.6, 4.8", cats: "Compliance" },
  { cap: "Multi-Location Architecture", points: "5.4, 5.10, 7.1\u20137.5", cats: "Software, Growth" },
];

const children = [];

children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  children: [new TextRun({ text: "DSO Pain Points Analysis", size: 48, bold: true, color: TEAL, font: "Calibri" })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 40 },
  children: [new TextRun({ text: "Challenges Facing Multi-Location Dental Organizations", size: 28, color: DARK, font: "Calibri" })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "Reference Document \u2014 EtherAI-Dental", size: 22, color: GRAY, font: "Calibri", italics: true })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
  children: [new TextRun({ text: "69 specific pain points across 8 categories, each mapped to a platform capability", size: 20, color: GRAY, font: "Calibri" })],
}));

for (const section of sections) {
  children.push(heading(section.title, HeadingLevel.HEADING_1));
  children.push(para(section.intro, { italics: true, color: GRAY }));
  children.push(painPointTable(section.rows));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
}

children.push(heading("Summary by Category", HeadingLevel.HEADING_1));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Category"), headerCell("Pain Points"), headerCell("Primary Business Impact")], tableHeader: true }),
    ...summaryRows.map((r, i) => new TableRow({
      children: [
        cell(r.cat, { width: 35, shaded: i % 2 === 0, bold: true }),
        cell(r.count, { width: 15, shaded: i % 2 === 0 }),
        cell(r.impact, { width: 50, shaded: i % 2 === 0 }),
      ],
    })),
    new TableRow({
      children: [
        cell("Total", { width: 35, bold: true }),
        cell("69", { width: 15, bold: true }),
        cell("", { width: 50 }),
      ],
    }),
  ],
}));

children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

children.push(heading("Coverage Map: EtherAI-Dental Capabilities vs. Pain Points", HeadingLevel.HEADING_1));
children.push(para("67 of 69 pain points are directly addressed by at least one platform capability.", { bold: true }));
children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Capability"), headerCell("Pain Points Addressed"), headerCell("Categories Covered")], tableHeader: true }),
    ...coverageRows.map((r, i) => new TableRow({
      children: [
        cell(r.cap, { width: 30, shaded: i % 2 === 0, bold: true }),
        cell(r.points, { width: 40, shaded: i % 2 === 0 }),
        cell(r.cats, { width: 30, shaded: i % 2 === 0 }),
      ],
    })),
  ],
}));

children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
children.push(heading("Gaps", HeadingLevel.HEADING_2));
children.push(richPara([
  { text: "1.6 ", bold: true },
  { text: "(Paper vs. digital intake forms) \u2014 Partially addressed through pre-populated data, but full intake form digitization is a PMS function." },
]));
children.push(richPara([
  { text: "1.8 ", bold: true },
  { text: "(Office manager administrative burden) \u2014 Addressed indirectly by reducing the volume of routine tasks, but organizational structure is outside platform scope." },
]));

children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "EtherAI-Dental \u2014 Operational Intelligence for Multi-Location Dental Organizations", size: 18, color: GRAY, font: "Calibri", italics: true })],
}));

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 20, color: DARK } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "EtherAI-Dental \u2014 DSO Pain Points Analysis", size: 16, color: GRAY, font: "Calibri", italics: true })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Confidential \u2014 EtherAI-Dental", size: 14, color: GRAY, font: "Calibri" })],
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("docs/DSO-Pain-Points-Analysis.docx", buffer);
  console.log("Word document generated: docs/DSO-Pain-Points-Analysis.docx");
  console.log("File size:", (buffer.length / 1024).toFixed(1), "KB");
});
