# Dental Insurance Verification Platform

## Overview
This project is a B2B healthcare SaaS application designed for dental practices. It aims to streamline patient insurance verification, manage patient records, track verification statuses across multiple carriers, display detailed benefits breakdowns, and monitor upcoming appointments. The platform provides a comprehensive solution for dental practice management, including staffing, patient billing, and professional profiles, with a vision to enhance operational efficiency and financial clarity for dental practices. It also supports a hybrid service model offering both self-service and subscription-based remote services like insurance and patient billing.

## User Preferences
The user prefers clear, concise communication. They value a structured approach to development, favoring iterative changes and prefer to be asked before major architectural or design decisions are implemented. The user also prefers detailed explanations for complex features and changes. Do not make changes to the `design_guidelines.md` file.

## System Architecture
The platform is built with a modern web stack:
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query for data fetching, and Wouter for routing. UI components leverage shadcn/ui and Radix UI primitives, styled with Tailwind CSS using custom healthcare-focused design tokens.
- **Backend**: Express.js with TypeScript for robust API services.
- **Database**: PostgreSQL, managed with Drizzle ORM for type-safe interactions.
- **UI/UX**: Features a healthcare-focused design with an Inter font, a teal primary color palette, and professional grays. It supports both light and dark modes. The application uses a persona-based access control system (System Admin, Practice Admin, Front Desk, Treatment Coordinator, Billing Manager, Patient, Professional) with a dynamic sidebar navigation that adapts based on the active persona.
- **Core Features**:
    - **Patient Management**: Comprehensive patient records, insurance policy linking, and appointment tracking.
    - **Insurance Verification**: Tracks verification status (pending, in_progress, completed, failed) and provides detailed benefits breakdown.
    - **Staffing Management**: Multi-role shift postings, calendar views, and a dual pricing model (fixed/smart pricing) for shift compensation, including detailed payroll cost breakdowns.
    - **Professional Hub**: Personalized portal for dental professionals to manage profiles, view shifts, and track earnings.
    - **Patient Portal**: Allows patients to view bills and make payments via Stripe Checkout.
    - **Services**: Manages subscription offerings for insurance and patient billing with tiered pricing.
    - **Settings**: Consolidated practice configuration across multiple tabs (Office Profile, Practice Information, Staffing Settings, Billing).
- **Data Models**: Key entities include Insurance Carriers, Patients, Insurance Policies, Verifications, Benefits, Appointments, Staff Shifts, Professionals, Professional Badges, Shift Transactions, Platform Settings, and Platform State Tax Rates.
- **API Design**: A RESTful API provides endpoints for all major functionalities, including dashboard statistics, CRUD operations for carriers, patients, shifts, and professionals, and specific actions like triggering verifications or completing shifts.

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **UI Component Library**: shadcn/ui, Radix UI
- **Styling Framework**: Tailwind CSS
- **Payment Gateway**: Stripe (for Patient Portal payments)
- **Mapping/Geocoding**: Google Maps API (implied for address lookups/display)
- **Font Hosting**: Google Fonts (for Inter font)
- **Clearinghouse Integration**: (Specific clearinghouse not named, but integrated for insurance claim submissions)

## Platform Settings (System Admin Only)
The Platform Settings page (`/platform-settings`) allows System Administrators to configure global fee rates and state-specific tax rates:
- **Platform Fees**: Service fee rate, convenience fee rate, platform fee (EtherAI fee), payroll tax rate, federal unemployment (FUTA), workers compensation, paid sick leave
- **State Tax Rates**: State-specific unemployment, income tax, and additional tax rates for all 50 US states plus DC
- Fee rates are stored as decimals (e.g., 0.12 for 12%) but displayed as percentages in the UI
- Persona persistence is handled via localStorage to maintain access control across page reloads
- API Endpoints: `GET/PATCH /api/settings/platform`, `GET/POST /api/settings/state-tax-rates`, `GET /api/fees/resolved`

## Practice Onboarding & Registration
The platform supports two practice onboarding flows:

### Self-Service Registration (`/register`)
- Public page accessible without authentication
- Multi-section form with practice details, address, and owner information
- Full Zod validation on both frontend (react-hook-form + zodResolver) and backend
- Required fields: practice name, city, state, ZIP, phone, email, owner details, terms acceptance
- Submissions create practices with `registrationStatus: "pending"` and `registrationSource: "self_registration"`
- Success confirmation shows next steps and approval timeline

### Practice Management (`/practices`) - System Admin Only
- Table view of all practices with registration status and source badges
- Status badges: Pending (yellow), Approved (green), Rejected (red)
- Source badges: Self-Registered, Admin Added
- Inline approve/reject actions for pending practices
- Rejection requires mandatory reason field
- View Details dialog with complete practice and owner information

### API Endpoints
- `POST /api/practices/register` - Public endpoint for self-registration (with Zod validation)
- `GET /api/practices` - List all practices
- `PATCH /api/practices/:id` - Update practice (for approval/rejection)

### Schema Fields (practices table)
- `registrationStatus`: pending, approved, rejected
- `registrationSource`: admin, self_registration
- `ownerFirstName`, `ownerLastName`, `ownerEmail`, `ownerPhone`: Owner contact info
- `approvedBy`, `approvedAt`: Approval tracking
- `rejectionReason`: Required when rejecting

## Multi-Location Support
The platform supports practices with multiple office locations. Each practice can manage multiple locations, and shifts/appointments can be assigned to specific locations.

### Practice Locations (`practice_locations` table)
- `id`: Unique location identifier
- `practiceId`: Reference to parent practice
- `name`: Location display name (e.g., "Main Office", "Downtown Branch")
- `address`, `city`, `stateCode`, `zipCode`: Location address
- `phone`, `email`: Location contact info
- `isPrimary`: Boolean indicating the main/primary location
- `isActive`: Boolean for soft delete functionality

### Location Management
- **Settings Page**: The Locations tab (`/settings` → Locations tab) allows Practice Admins to add, edit, and manage office locations
- **Shift Creation**: When creating shifts at `/staffing/add-shift`, staff can select which location the shift is for
- **Location Switcher**: Practice-related personas (Practice Admin, Front Desk, Treatment Coordinator, Billing Manager) can switch between locations using a dropdown in the sidebar navigation. The selected location persists across sessions via localStorage.
- **Appointments**: Appointments can be linked to specific locations (future enhancement)

### API Endpoints
- `GET /api/practices/:practiceId/locations` - List all locations for a practice
- `POST /api/practices/:practiceId/locations` - Create a new location
- `PATCH /api/practices/:practiceId/locations/:id` - Update a location
- `DELETE /api/practices/:practiceId/locations/:id` - Soft delete a location

### Known Limitations (MVP)
- **Hardcoded practiceId**: Currently using `practiceId = "practice-1"` as a placeholder in several components. This should be replaced with auth/context-based practice resolution for multi-tenant production deployment.
- **Nullable locationId**: The `locationId` field in `staffShifts` and `appointments` tables is currently nullable for backward compatibility. For production, consider adding a migration to backfill with default primary location and then enforce NOT NULL.
- **Default Demo Practice**: A demo practice with ID "practice-1" is seeded with two sample locations (Main Office, Downtown Branch) for testing purposes.

## Mobile App Integration (Shift Management)
The platform provides APIs for a mobile app (Expo React Native) that allows dental professionals to browse available shifts, claim shifts, and manage their assignments.

### Mobile API Endpoints
- `GET /api/shifts/available` - List open shifts with optional filters (startDate, endDate, role, locationId)
  - Returns: `StaffShiftWithLocation[]` - shifts with embedded location details
- `GET /api/shifts/:id/details` - Get detailed shift information including location
  - Returns: `StaffShiftWithLocation` - shift with embedded location object
- `POST /api/shifts/:id/claim` - Claim an open shift (professional accepts)
  - Body: `{ professionalId: string }`
  - Returns: `{ success: boolean, shift?: StaffShift, error?: string }`
  - Error codes: 409 (conflict) if shift already claimed or unavailable
- `POST /api/shifts/:id/release` - Release a claimed shift
  - Body: `{ professionalId: string }`
  - Returns: `{ success: boolean, shift?: StaffShift, error?: string }`
  - Error codes: 409 (conflict) if not assigned to this professional or completed

### Shift Workflow
1. Practice Admin creates shifts via `/staffing/add-shift` (status: "open")
2. Professional claims shift via mobile app POST `/api/shifts/:id/claim` (status: "filled")
3. Professional can release shift via POST `/api/shifts/:id/release` (status returns to "open")
4. Practice completes shift after work is done (status: "completed") - cannot be released

### Type Definitions
- `StaffShiftWithLocation`: Extends `StaffShift` with `location: PracticeLocation | null`