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