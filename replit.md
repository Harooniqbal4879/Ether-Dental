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
│   │   ├── dashboard.tsx    # Main dashboard with stats and verifications
│   │   ├── patients.tsx     # Patient list view
│   │   ├── patient-detail.tsx # Individual patient details with benefits
│   │   ├── appointments.tsx # Upcoming appointments view
│   │   ├── carriers.tsx     # Insurance carrier management
│   │   └── settings.tsx     # Practice settings
│   ├── lib/
│   │   └── queryClient.ts   # React Query configuration
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

### Data Models

1. **Insurance Carriers** - Dental insurance companies (Delta Dental, Cigna, etc.)
2. **Patients** - Patient demographics and contact information
3. **Insurance Policies** - Links patients to carriers with policy details
4. **Verifications** - Tracks verification status (pending, in_progress, completed, failed)
5. **Benefits** - Detailed coverage information (maximums, deductibles, percentages)
6. **Appointments** - Scheduled patient appointments

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

The Settings page follows the Teero app design pattern with 4 tabs:

1. **Office Profile** - Photos, office basics (name, address, phone, website), about your office, team composition, break facilities
2. **Practice Information** - Software selection, equipment settings, practice identifiers (NPI, Tax ID), clearinghouse credentials, appearance/theme
3. **Staffing Settings** - Verification automation, notification preferences
4. **Billing** - Subscription management, payment methods, billing history

### Recent Changes
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
- Settings page redesigned with 4-tab structure based on Teero app design
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
