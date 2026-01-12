# Design Guidelines: Dental Insurance Verification Platform

## Design Approach

**Selected Framework:** Design System Approach (Healthcare SaaS)
**Primary Inspiration:** Linear (structure) + Notion (data organization) + Carbon Design System (enterprise patterns)
**Rationale:** Information-dense, utility-focused B2B healthcare application requiring clarity, efficiency, and trust.

---

## Typography System

**Font Stack:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for IDs, policy numbers)

**Hierarchy:**
- Page Titles: 2.5rem (40px), font-semibold
- Section Headers: 1.875rem (30px), font-semibold
- Card/Module Titles: 1.25rem (20px), font-medium
- Body Text: 0.875rem (14px), font-normal
- Labels/Meta: 0.75rem (12px), font-medium, uppercase tracking-wide
- Data Values: 1rem (16px), font-medium (for emphasis on numbers/percentages)

---

## Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 4, 6, 8, 12, 16
**Common Patterns:**
- Section padding: py-8 px-6
- Card padding: p-6
- Form spacing: space-y-6
- Grid gaps: gap-6
- Button padding: px-6 py-2

**Grid Structure:**
- Dashboard: 12-column grid with 3-4 column sidebar (280-320px fixed)
- Content area: max-w-7xl with responsive breakpoints
- Forms: max-w-2xl centered for optimal readability
- Data tables: full-width with horizontal scroll on mobile

---

## Component Library

### Navigation & Structure

**Top Navigation Bar (60px height):**
- Practice/location selector (dropdown)
- Global search bar (expandable)
- Notification bell with badge
- User profile menu
- Fixed position with subtle bottom border

**Sidebar Navigation (280px):**
- Collapsible on tablet/mobile
- Icon + label format
- Nested menu support for multi-level items
- Active state with left border indicator (4px)
- Badge counts for pending items

**Dashboard Cards:**
- Elevated card design with subtle shadow
- 6px rounded corners
- Header with icon + title + action menu (three dots)
- Content area with clear internal spacing (p-6)
- Footer with metadata or actions

### Data Display

**Status Badges:**
- Pill-shaped (rounded-full)
- Small text (0.75rem)
- Icons preceding text
- States: Verified (checkmark), Needs Verification (warning), In Progress (spinner), Failed (X)

**Progress Indicators:**
- Benefits usage bars: full-width with percentage overlay
- Multi-segment for deductible tracking
- Height: 24px with rounded edges

**Data Tables:**
- Zebra striping for row differentiation
- Sortable column headers with arrow indicators
- Row hover state
- Sticky header on scroll
- Inline action buttons (icon-only, right-aligned)
- Pagination at bottom (items per page + page numbers)

**Stat Cards (Analytics/Dashboard):**
- Large number display (2.5rem, font-bold)
- Label below (0.875rem)
- Trend indicator (arrow + percentage)
- Compact size: 200px × 120px

### Forms & Input

**Form Fields:**
- Label above input (font-medium, 0.875rem)
- Input height: 40px
- Full-width inputs with max-w-md for text fields
- Error states with icon + message below
- Helper text in muted style below input
- Required field indicator (asterisk)

**Input Groups:**
- Phone number with country code dropdown prefix
- Insurance ID with carrier logo prefix
- Date inputs with calendar picker icon

**File Upload:**
- Drag-and-drop zone with dashed border
- Insurance card upload: side-by-side preview (front/back)
- Thumbnail previews with remove button overlay

**Multi-step Forms (Onboarding):**
- Progress stepper at top (numbered circles connected by lines)
- Current step highlighted, completed steps with checkmark
- Back/Next/Save & Continue buttons (right-aligned)

### Actions & Buttons

**Primary Actions:**
- Height: 40px
- Rounded: 6px
- Icon + text or text-only
- Loading state: spinner replaces icon

**Button Hierarchy:**
- Primary: Solid fill (verification trigger, save)
- Secondary: Outline only (cancel, back)
- Tertiary: Text-only with underline on hover (view details)
- Danger: Distinct treatment for destructive actions

**Floating Action Button:**
- Bottom-right corner: "Verify All Pending" or "Add Patient"
- 56px circle with icon
- Elevation shadow

### Modals & Overlays

**Modal Dialogs:**
- Centered overlay with backdrop blur
- Max-width: 600px for forms, 900px for detailed views
- Header with title + close button
- Content padding: p-8
- Footer with actions (right-aligned)

**Slide-over Panels:**
- Right-side panel for patient details (500px width)
- Transitions from right edge
- Close on backdrop click or X button

**Toast Notifications:**
- Top-right corner stacking
- Auto-dismiss after 5 seconds
- Icon (status) + message + close button
- Max-width: 400px

### Specialized Components

**Verification Timeline:**
- Vertical timeline with date/time stamps
- Icons indicating verification method (clearinghouse icon, phone icon)
- Expandable details for each verification event
- Success/failure indicators

**Benefits Breakdown Display:**
- Two-column layout: Benefit category | Coverage details
- Visual hierarchy: Category headers (font-semibold), sub-items indented
- Monetary values right-aligned, large and prominent
- Percentage values in pill badges
- "Last verified" timestamp at top

**Patient Search:**
- Autocomplete dropdown with keyboard navigation
- Results show: Name, DOB, Last 4 SSN, Insurance carrier logo
- Recent patients section above search results
- "Add New Patient" option at bottom

---

## Animations

**Minimal & Purposeful:**
- Page transitions: 200ms ease-in-out
- Dropdown/modal open: 150ms scale + opacity
- Loading spinners: continuous rotation
- NO scroll-triggered animations
- NO parallax effects
- Hover states: instant (no transition)

---

## Images

**Insurance Carrier Logos:**
- Display throughout application (patient profiles, verification results)
- Size: 40px × 40px, contain fit
- Fallback: First two letters of carrier name in circle

**Insurance Card Images:**
- Patient profile: Side-by-side display (front/back)
- Clickable to enlarge in modal
- Max display size: 400px width

**Empty States:**
- Simple icon (from icon library) + message
- "No patients yet" with add patient CTA
- "No pending verifications" with checkmark illustration

---

## Accessibility

- WCAG 2.1 AA compliance minimum
- All interactive elements keyboard-accessible
- Focus indicators: 2px outline offset 2px
- Form labels always visible (no placeholder-only)
- Error messages programmatically associated with inputs
- Loading states announced to screen readers
- Color not sole indicator of status (always pair with icon/text)

---

**Icon Library:** Heroicons (via CDN) - use outline style for navigation, solid for status indicators