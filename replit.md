# Dental Insurance Verification Platform

A B2B healthcare SaaS application for dental practices to manage patient insurance verification.

## Overview

This platform enables dental practices to:
- Manage patient records with insurance information
- Track insurance verification status across multiple carriers
- View benefits breakdown with coverage percentages and limits
- Monitor upcoming appointments with verification status
- Support multiple insurance carriers with clearinghouse integration

## Project Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter routing
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui, Radix UI primitives
- **Styling**: Tailwind CSS with custom healthcare-focused design tokens

### Directory Structure
```
├── client/src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── app-sidebar.tsx  # Main navigation sidebar
│   │   └── theme-toggle.tsx # Light/dark mode toggle
│   ├── pages/
│   │   ├── dashboard.tsx    # Main dashboard with stats and quick actions
│   │   ├── patients.tsx     # Patients page with 3 tabs (Patients, Verifications, Appointments)
│   │   ├── patient-detail.tsx # Individual patient details with benefits
│   │   ├── carriers.tsx     # Insurance carrier management
│   │   ├── settings.tsx     # Practice settings (5 tabs)
│   │   ├── staffing.tsx     # Staffing calendar and management
│   │   ├── services.tsx     # Service offerings and subscriptions
│   │   └── patient-portal.tsx # Patient payment portal
│   ├── lib/
│   │   ├── queryClient.ts   # React Query configuration
│   │   └── persona-context.tsx # Role-based persona management
│   └── App.tsx              # Main app with routing and providers
├── server/
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # Database storage layer
│   ├── db.ts                # Drizzle database connection
│   └── seed.ts              # Database seeding script
├── shared/
│   └── schema.ts            # Drizzle schema and TypeScript types
└── design_guidelines.md     # UI/UX design system documentation
```

### Navigation Structure

The sidebar navigation is organized as follows:
- **Dashboard** - Main hub with stats and quick actions
- **Patients** - Tabbed view with 3 sub-sections:
  - Patients tab (/patients) - Patient list and management
  - Verifications tab (/patients?tab=verifications) - Insurance verification tracking
  - Appointments tab (/patients?tab=appointments) - Upcoming appointments
- **Staffing Requests** - Multi-role shift management
- **Services** - Subscription service offerings
- **Patient Portal** - Patient payment interface (also accessible via Patient persona)
- **Professionals Hub** - Dental professional profiles and credentials (accessible by office staff and professionals)
- **Settings** - Practice configuration (5 tabs including Carriers)

### Data Models

1. **Insurance Carriers** - Dental insurance companies (Delta Dental, Cigna, etc.)
2. **Patients** - Patient demographics and contact information
3. **Insurance Policies** - Links patients to carriers with policy details
4. **Verifications** - Tracks verification status (pending, in_progress, completed, failed)
5. **Benefits** - Detailed coverage information (maximums, deductibles, percentages)
6. **Appointments** - Scheduled patient appointments
7. **Staff Shifts** - Shift postings with role, date, times, pricing configuration, and assigned professional
8. **Professionals** - Dental professional profiles with credentials, specialties, education, experience
9. **Professional Badges** - Achievement recognition (perfect_attendance, shifts_completed, timeliness, knowledge, teamwork) with bronze/silver/gold levels
10. **Shift Transactions** - Payment records for completed shifts with detailed breakdown

### API Endpoints

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/carriers` - List insurance carriers
- `POST /api/carriers` - Create new carrier
- `GET /api/patients` - List all patients with insurance info
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create patient with insurance
- `GET /api/patients/:id/verifications` - Patient verification history
- `POST /api/patients/:id/verify` - Trigger new verification
- `GET /api/verifications` - List all verifications
- `GET /api/verifications/recent` - Recent verifications for dashboard
- `GET /api/appointments` - Upcoming appointments
- `GET /api/shifts?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get shifts in date range
- `GET /api/shifts/:id` - Get single shift details
- `PATCH /api/shifts/:id` - Update shift
- `POST /api/shifts` - Create new shifts (accepts dates array for multi-date posting)
- `POST /api/shifts/:id/complete` - Complete a shift and create payment transaction
- `GET /api/shifts/:id/transaction` - Get transaction for a shift
- `GET /api/shift-transactions` - List all shift transactions
- `GET /api/shift-transactions/:id` - Get transaction details
- `POST /api/shift-transactions/:id/charge` - Charge a pending transaction
- `GET /api/professionals` - List all professionals with badges
- `GET /api/professionals/:id` - Get professional details with badges
- `POST /api/professionals` - Create new professional
- `PUT /api/professionals/:id` - Update professional
- `POST /api/professionals/:id/badges` - Add badge to professional
- `GET /api/professionals/:id/shifts` - Get shifts assigned to a professional
- `GET /api/professionals/:id/transactions` - Get payment transactions for a professional

## Services & Billing Model

The platform offers a hybrid service model:

### Self-Service (Free/Included)
- **Insurance Verification** - Practice staff handles eligibility checks and benefits breakdown directly in the platform

### Remote Services (Subscription)
- **Insurance Billing** - Daily claims submission, payment posting, appeals and denials management
  - Pricing: $1,199/mo (under $40k) → 2.25%* (above $150k)
- **Patient Billing** - Electronic statements, follow-up letters, collection calls
  - Pricing: $999/mo (under $100k) → 0.3%* (above $500k)

The Services page (`/services`) displays all available services with pricing tiers and subscription management.

## Persona System

The application includes role-based access control with a persona switcher in the sidebar:

1. **System Administrator** - System-wide access & AI configuration (full access)
2. **Practice Administrator** - Full practice access (all features except AI config)
3. **Front Desk Staff** - Patient management, verifications, appointments
4. **Treatment Coordinator** - Benefits, treatment planning, appointments
5. **Billing Manager** - Verification data, reports, carrier management
6. **Patient** - View bills & make payments via Patient Portal
7. **Professional** - Manage profile & view shifts via Professionals Hub

The persona context is managed in `client/src/lib/persona-context.tsx` and navigation filtering is handled in `client/src/components/app-sidebar.tsx`.

## Design System

- **Font**: Inter (Google Fonts)
- **Color Palette**: Healthcare-focused with teal primary, professional grays
- **Theme**: Supports light and dark mode
- **Components**: Uses shadcn/ui with custom healthcare styling

## Development

The application runs on port 5000 with both frontend and backend served together.

### Database Commands
- `npm run db:push` - Push schema changes to database
- `npx tsx server/seed.ts` - Seed database with sample data

### Settings Page Structure

The Settings page follows the EtherAI app design pattern with 4 tabs:

1. **Office Profile** - Photos, office basics (name, address, phone, website), about your office, team composition, break facilities
2. **Practice Information** - Software selection, equipment settings, practice identifiers (NPI, Tax ID), clearinghouse credentials, appearance/theme
3. **Staffing Settings** - Verification automation, notification preferences
4. **Billing** - Subscription management, payment methods, billing history

### Add Shift Page

The Add Shift page (`/staffing/add-shift`) allows practice managers to create new shift postings with:
- Multi-date calendar selection (can select multiple dates at once)
- Time configuration: Arrival time, First patient, End time, Break (unpaid)
- Two pricing modes:
  - **Fixed pricing**: Set one hourly rate
  - **Smart pricing**: Set min/max range, system optimizes daily
- Visual hourly rate slider with fill rate indicator
- Estimated pricing sidebar with detailed cost breakdown:
  - Base wages
  - Payroll fees (expandable breakdown: Social Security, Medicare, Federal/State unemployment, Workers comp, Paid sick leave)
  - EtherAI fee (12%)
  - Hourly total
- Post shifts button with Terms of Service and Privacy Policy links

### Professional Portal

When viewing as a Professional persona, the Professionals Hub displays a personalized portal with:
- Welcome message with the professional's name and avatar
- **My Shifts tab** - View upcoming and completed shifts with role badges, times, and hourly rates
- **My Earnings tab** - View payment history and earnings summary with stats cards:
  - Total Earnings
  - Pending Payments
  - Shifts Completed
- Payment transaction details showing hours worked, hourly rate, and fees

### Recent Changes
- Added Professional Portal with My Shifts and My Earnings views for professionals to track their work and payments
- Added API endpoints for professional-specific data: GET /api/professionals/:id/shifts and /api/professionals/:id/transactions
- Added shift payment transaction system with detailed payment breakdown
- Shift completion creates transactions with: regular pay, service fee (22.5%), convenience fee (3.5%), adjustments, counter cover discounts
- Transaction status workflow: pending → charged
- Clicking shifts on calendar opens detail dialog showing shift info and transaction details for completed shifts
- Added `shift_transactions` database table for immutable payment records
- Extended `staff_shifts` with assignedProfessionalId field
- Renamed "Staffing" to "Staffing Requests" throughout application
- Added specialty requirements to shift creation
- Consolidated Verifications and Appointments into Patients page as tabs with URL-based navigation (/patients?tab=verifications, /patients?tab=appointments)
- Added Insurance Carriers management as 5th tab in Settings page, removed from standalone navigation
- Rebranded application from "DentalVerify" to "EtherAI - Dental Practice Management System" throughout UI
- Enhanced Dashboard with clickable stat cards linking to respective pages and quick action cards for key features (Add Patient, Staffing, Services, Settings)
- Added Patient persona with limited access to Patient Portal only, accessible via sidebar persona switcher
- Connected Add Shift form to backend API with database persistence
- Shifts now display on the staffing calendar with role-colored badges and arrival times
- Added `staff_shifts` database table for storing shift postings
- Added GET/POST `/api/shifts` endpoints for shift management
- Added loading and error states to the staffing calendar
- Added Add Shift page (`/staffing/add-shift`) for creating new shift postings with multi-date selection, time configuration, and dual pricing modes (Fixed/Smart)
- Added Patient Portal (`/portal`) for patients to view balances and make credit card payments via Stripe Checkout
- Integrated Stripe payment processing with proper webhook handling
- Added `patient_billing` and `patient_payments` database tables for tracking patient balances and payment history
- Patient Portal features: balance breakdown (total, insurance portion, patient portion), payment history, secure Stripe Checkout integration
- Added Services page with hybrid billing model (self-service + remote services)
- Three service offerings: Insurance Verification, Insurance Billing, Patient Billing
- Pricing tiers based on production/collections volume
- Subscription management UI with "How It Works" explanations
- Expanded Staffing feature from hygienist-only to multi-role support
- Added role filter dropdown with 6 staff roles: Dentist, Hygienist, Dental Assistant, Office Coordinator, Front Desk, Billing Staff
- Roles grouped into Clinical and Administrative categories with color-coded badges
- Renamed "Hygienist Staffing" to "Staffing" and "Hygienists" tab to "Team"
- Dynamic search placeholders and empty states based on selected role filter
- Settings page redesigned with 4-tab structure based on EtherAI app design
- Added Office Profile tab with photos, team composition, and break facilities
- Added Practice Information tab with software, equipment, and clearinghouse management
- Added Staffing Settings tab with verification automation options
- Added Billing tab with subscription and payment info
- Clearinghouse credentials use vault-based secretId for security
- Initial implementation of full dental insurance verification platform
- Dashboard with verification status tracking
- Patient management with insurance policies
- Benefits breakdown with progress indicators
- Simulated verification process with async status updates
