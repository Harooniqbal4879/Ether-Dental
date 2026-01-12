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

### Recent Changes
- Initial implementation of full dental insurance verification platform
- Dashboard with verification status tracking
- Patient management with insurance policies
- Benefits breakdown with progress indicators
- Simulated verification process with async status updates
