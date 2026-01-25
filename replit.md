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
- Platform Settings → Eligibility tab (System Admin only) - Configure DentalXchange credentials
- Patients → Insurance tab (/patients?tab=insurance) - Unified practice-level verification tab for both dental and medical insurance (Practice Admin, Front Desk, Treatment Coordinator, Billing Manager)
- Patient cards display dual insurance status with "D" (dental) and "M" (medical) badges showing per-type verification status
- Legacy URLs (/patients?tab=verifications, /patients?tab=eligibility) redirect to the Insurance tab

### Practice-Level Eligibility Features
- Patient selector with auto-fill of demographics from practice records
- Policy selector with auto-population of insurance details and payer matching
- Provider info auto-populated from practice settings (NPI, Tax ID, organization name)
- Verification results stored with patient/policy links for tracking
- Benefits breakdown display with coverage percentages, deductibles, and maximums

### Key Files
- `server/services/dentalxchange.ts` - DentalXchange API service (dental insurance)
- `server/services/availity.ts` - Availity API service (medical insurance)
- `server/services/verification-automation.ts` - Automated verification queue processor
- `client/src/components/eligibility-check.tsx` - Eligibility check UI component (platform settings)
- `client/src/pages/eligibility.tsx` - Practice-level eligibility verification page

## Automated Verification System (January 2026)
Dual-insurance verification supporting both dental (DentalXchange) and medical (Availity) insurance with automated background processing.

### Dual Insurance Support
- **Dental Insurance**: Verified through DentalXchange API (950+ payers)
- **Medical Insurance**: Verified through Availity API (simulated, ready for production integration)
- Insurance carriers now have `insuranceType` field (dental/medical)
- Patients can have both dental and medical policies

### Automated Verification Features
- Background queue processor runs verifications automatically
- Verification triggers: new_patient, new_appointment, policy_change, scheduled, manual
- Priority-based queue processing (1=highest, 10=lowest)
- Automatic re-verification scheduling (30-day expiry)
- Real-time manual verification still available for immediate checks

### API Endpoints - Automated Verification
- `POST /api/verification/queue` - Queue verification for background processing
- `POST /api/verification/run` - Run immediate real-time verification
- `GET /api/verification/queue/stats` - Get queue statistics
- `POST /api/verification/queue/process` - Trigger manual queue processing
- `GET /api/carriers/:type` - Get carriers by type (dental/medical)
- `GET /api/eligibility/medical-payers` - List medical insurance payers
- `POST /api/eligibility/medical/check` - Check medical insurance eligibility

### Medical Insurance Credentials (Availity)
Set environment variables for live medical eligibility:
- `AVAILITY_CLIENT_ID` - OAuth client ID
- `AVAILITY_CLIENT_SECRET` - OAuth client secret
- `AVAILITY_ENVIRONMENT` - sandbox or production

## Messaging Center (January 2026)
Real-time messaging system for Practice Admins to communicate with hygienists.

### Features
- Practice Admins can view all hygienists with online/offline status indicators
- Start new conversations with any hygienist
- Real-time message history with polling updates (5s for conversations, 3s for messages)
- Green dot = online, grey dot = offline status
- Message bubbles styled differently for sent (right, primary color) vs received (left, muted)

### UI Location
- Sidebar Navigation → Messaging (Practice Admin persona only)
- Route: `/messaging`

### API Endpoints
- `GET /api/messaging/conversations` - List conversations for practice admin
- `POST /api/messaging/conversations` - Create/get conversation with a professional
- `GET /api/messaging/conversations/:id/messages` - Get messages for a conversation
- `POST /api/messaging/conversations/:id/messages` - Send a message
- `POST /api/messaging/conversations/:id/read` - Mark messages as read
- `GET /api/messaging/hygienists` - Get all hygienists with online status
- `POST /api/messaging/status` - Update user online status (heartbeat)

### Database Tables
- `conversations` - Stores conversation records between practice admins and professionals
- `messages` - Stores individual messages within conversations
- `user_online_status` - Tracks online/offline status for users

### Key Files
- `client/src/pages/messaging.tsx` - Messaging center UI
- `server/routes.ts` - Messaging API endpoints (search for "Messaging Center API")
- `server/storage.ts` - Database operations for messaging
- `shared/schema.ts` - Database schema for conversations, messages, userOnlineStatus

## Shift Invitation System (January 2026)
Practice Admins can invite professionals to bid on open shifts through the messaging system.

### Features
- "Invite Professionals to Bid" button appears on open shifts in the staffing page
- Modal displays all professionals matching the shift role
- Select individual professionals or use "Select All"
- Sends formatted invitation messages with shift details (date, time, rate, specialties)
- Invitations appear as messages in the Messaging Center

### UI Location
- Staffing Page → Click on an open shift → "Invite Professionals to Bid" button
- Invitations appear in Messaging Center (/messaging)

### API Endpoints
- `POST /api/shifts/invite` - Send invitation messages to selected professionals
  - Request: `{ shiftId: string, professionalIds: string[] }`
  - Response: `{ success: true, invitesSent: number, message: string }`
  - Validates shift exists and is open
  - Verifies each professional exists before sending

### Key Files
- `client/src/components/shift-invite-modal.tsx` - Modal for selecting professionals to invite
- `client/src/pages/staffing.tsx` - Staffing page with invite button in shift detail dialog

## Dentrix Ascend Integration (January 2026)
Patient data synchronization from Dentrix Ascend practice management system.

### Overview
Integrates with Dentrix Ascend via REST API to import and sync patient data. Supports both bulk sync operations and individual patient imports, with full tracking of sync history. **This is a practice-level integration** - each practice configures their own Dentrix credentials.

### Credentials Required
Configure in Office Settings → Integrations tab (Practice Admin):
- `Client ID` - OAuth 2.0 Client ID from Dentrix Developer Program
- `Client Secret` - OAuth 2.0 Client Secret
- `API Key` - API key from ddp.dentrix.com

### API Endpoints (Practice-Level)
All endpoints accept `practiceId` parameter for practice-level isolation:
- `GET /api/dentrix/config?practiceId=` - Get integration configuration status
- `POST /api/dentrix/config` - Save integration configuration (includes practiceId in body)
- `POST /api/dentrix/test-connection` - Test API connection (includes practiceId in body)
- `POST /api/dentrix/sync/patients` - Start bulk patient sync (includes practiceId in body)
- `POST /api/dentrix/sync/patient/:dentrixPatientId` - Sync single patient
- `GET /api/dentrix/sync/:syncLogId` - Get sync operation status
- `GET /api/dentrix/sync-history` - Get recent sync logs
- `GET /api/dentrix/mapping/:dentrixPatientId` - Get patient mapping
- `GET /api/dentrix/simulated-patients` - Generate test patients
- `POST /api/dentrix/import-simulated` - Import test patients for demo

### Database Tables
- `dentrix_ascend_config` - Stores OAuth credentials and sync settings (practice-level via practiceId)
- `dentrix_sync_log` - Tracks sync operations with statistics
- `dentrix_patient_mapping` - Links Dentrix patient IDs to local patient records

### UI Location
- Office Settings → Integrations tab (Practice Admin, Front Desk, Treatment Coordinator, Billing Manager)
- Configure credentials, enable/disable sync, view sync history
- Import test patients for demonstration

### Key Files
- `server/services/dentrix-ascend.ts` - Dentrix Ascend API service with OAuth handling
- `client/src/pages/settings.tsx` - IntegrationsTab component
- `shared/schema.ts` - Database schema for Dentrix tables