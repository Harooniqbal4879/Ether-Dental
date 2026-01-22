# Dental Insurance Verification Platform

## Overview
This project is a B2B healthcare SaaS platform for dental practices. Its core purpose is to automate and streamline patient insurance verification, manage patient and staff records, track appointments, and provide detailed benefits breakdowns. The platform aims to enhance operational efficiency and financial clarity for dental practices by offering comprehensive practice management tools, including staffing, patient billing, and professional profiles. It supports a hybrid service model with both self-service options and subscription-based remote services for insurance and patient billing.

## User Preferences
The user prefers clear, concise communication. They value a structured approach to development, favoring iterative changes and prefer to be asked before major architectural or design decisions are implemented. The user also prefers detailed explanations for complex features and changes. Do not make changes to the `design_guidelines.md` file.

## System Architecture
The platform is built on a modern web stack designed for scalability and maintainability.

- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, and Wouter. UI components are built with shadcn/ui and Radix UI, styled using Tailwind CSS and custom healthcare-focused design tokens.
- **Backend**: Express.js with TypeScript for robust API services.
- **Database**: PostgreSQL, managed with Drizzle ORM for type-safe interactions.
- **UI/UX**: Features a healthcare-centric design with the Inter font, a teal primary color palette, and professional grays, supporting both light and dark modes. It implements a persona-based access control system (System Admin, Practice Admin, Front Desk, Treatment Coordinator, Billing Manager, Patient, Professional) with dynamic sidebar navigation.
- **Core Features**:
    - **Patient Management**: Comprehensive records, insurance policy linking, and appointment tracking.
    - **Insurance Verification**: Tracks verification status and provides detailed benefits breakdowns.
    - **Staffing Management**: Multi-role shift postings, calendar views, and a dual pricing model for compensation with payroll cost breakdowns.
    - **Professional Hub**: Personalized portal for professionals to manage profiles, view shifts, and track earnings.
    - **Patient Portal**: Allows patients to view bills and make payments via Stripe Checkout.
    - **Services**: Manages subscription offerings for insurance and patient billing with tiered pricing.
    - **Settings**: Consolidated practice configuration across multiple tabs.
- **Multi-Location Support**: Practices can manage multiple office locations, with shifts and appointments assignable to specific locations. A location switcher is available for relevant personas.
- **Mobile App Integration**: Provides APIs for a mobile application (Expo React Native) to manage professional shifts, including browsing available shifts, claiming/releasing shifts, check-in/check-out with GPS, and shift rate negotiations.
- **Professional Preferences & Credentials**: Supports comprehensive professional profiles, including preferences for intelligent shift matching and tracking of six credential types (Certifications, Skills, Experience, Education, Awards, Training). A shift matching algorithm scores professionals based on preference compatibility.
- **API Design**: A RESTful API provides endpoints for all major functionalities, including dashboard statistics, CRUD operations, and specific actions like triggering verifications or managing shifts.

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **UI Component Libraries**: shadcn/ui, Radix UI
- **Styling Framework**: Tailwind CSS
- **Payment Gateway**: Stripe (for Patient Portal payments)
- **Mapping/Geocoding**: Google Maps API
- **Font Hosting**: Google Fonts
- **Clearinghouse Integration**: Office Ally SFTP for claims, DentalXchange for eligibility

## DentalXchange Integration (January 2026)
Real-time dental insurance eligibility verification through DentalXchange XConnect API.

### Credentials Required
Set these environment variables to enable live API calls:
- `DENTALXCHANGE_USERNAME` - DentalXchange account username
- `DENTALXCHANGE_PASSWORD` - DentalXchange account password
- `DENTALXCHANGE_API_KEY` - Optional API key

### API Endpoints
- `POST /api/eligibility/check` - Check patient eligibility (returns simulated data if credentials not configured)
- `GET /api/eligibility/verifications` - List recent eligibility verifications
- `GET /api/eligibility/verifications/:id` - Get verification with benefits breakdown
- `GET /api/eligibility/payers` - List supported insurance payers (950+ dental payers)
- `POST /api/eligibility/payers/sync` - Sync payer list to database
- `GET /api/patients/:id/eligibility` - Get eligibility history for a patient
- `GET /api/policies/:id/eligibility` - Get eligibility history for a policy
- `GET /api/eligibility/service-types` - Get CDT service type codes
- `GET /api/eligibility/relationship-codes` - Get subscriber relationship codes

### Database Tables
- `eligibility_verifications` - Stores verification requests and responses
- `eligibility_benefits` - Stores detailed benefits breakdown (co-insurance, deductibles, maximums, limitations)
- `dentalxchange_payers` - Cache of supported payers

### UI Location
Platform Settings → Eligibility tab (System Admin only)

### Key Files
- `server/services/dentalxchange.ts` - DentalXchange API service
- `client/src/components/eligibility-check.tsx` - Eligibility check UI component