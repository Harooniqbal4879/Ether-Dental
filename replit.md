# Dental Insurance Verification Platform

## Overview
This B2B healthcare SaaS platform for dental practices automates and streamlines patient insurance verification, manages patient and staff records, tracks appointments, and provides detailed benefits breakdowns. It aims to enhance operational efficiency and financial clarity by offering comprehensive practice management tools, including staffing, patient billing, and professional profiles. The platform supports a hybrid service model with self-service options and subscription-based remote services for insurance and patient billing.

## User Preferences
The user prefers clear, concise communication. They value a structured approach to development, favoring iterative changes and prefer to be asked before major architectural or design decisions are implemented. The user also prefers detailed explanations for complex features and changes. Do not make changes to the `design_guidelines.md` file.

## System Architecture
The platform is built on a modern web stack designed for scalability and maintainability.

- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, and Wouter, utilizing shadcn/ui, Radix UI, and Tailwind CSS.
- **Backend**: Express.js with TypeScript for API services.
- **Database**: PostgreSQL with Drizzle ORM.
- **UI/UX**: Features a healthcare-centric design with the Inter font, a teal primary color palette, and professional grays, supporting both light and dark modes. It includes a persona-based access control system with dynamic sidebar navigation.
- **Core Features**:
    - **Patient Management**: Comprehensive records, insurance policy linking, and appointment tracking.
    - **Insurance Verification**: Tracks verification status and provides detailed benefits breakdowns, supporting dual dental (DentalXchange) and medical (Availity) insurance with automated background processing.
    - **Staffing Management**: Multi-role shift postings, calendar views, dual pricing models, and a "Professionals Hub" with online status and shift invitation system.
    - **Professional Hub**: Personalized portal for professionals to manage profiles, view shifts, track earnings, and manage credentials.
    - **Professional Self-Registration**: Professionals can register their own accounts via `/register-professional` with email/password authentication, then login via `/login/professional`. Passwords are hashed using bcrypt.
    - **Contractor Onboarding & Verification Module**: 1099-compliant onboarding system for independent contractors including:
        - **Intuitive 6-step onboarding wizard** at `/app/onboarding` with auto-navigation to first incomplete step:
          1. **Personal Info**: Profile photo upload, date of birth, phone with OTP verification, country of residence, and full address
          2. **Identity Verification**: Government ID upload (front/back based on ID type), selfie photo, and AI-powered facial matching
          3. **W-9 Tax Form**: Tax information with encrypted SSN/EIN (only last-4 stored), option to upload completed IRS W-9 form
          4. **Agreements**: Electronic signature for 6 required agreements (Independent Contractor, Marketplace ToS, Escrow & Dispute, Non-Circumvention, NDA, HIPAA)
          5. **Work Eligibility & Compliance**: Healthcare credentials verification (Professional License, NPI, Malpractice Insurance, Background Check, Immunization Records, CPR/BLS Certification)
          6. **Payment Setup**: Multiple payout method options:
             - Stripe Connect Express
             - Direct Bank Transfer (ACH/SEPA/Wire) with bank details form and void check upload
             - PayPal, Payoneer, Wise (TransferWise), Skrill
             - Platform Escrow
        - **Phone OTP Verification**: Server-side rate-limited OTP (60-second cooldown), 10-minute expiry, Zod validation on all endpoints
        - **Self-navigating UI**: Vertical stepper sidebar with completion indicators, "What's Next" guidance banner, and step-by-step progress tracking
        - Onboarding status tracking: INVITED → IN_PROGRESS → UNDER_REVIEW → VERIFIED → PAYMENT_ELIGIBLE
        - **Integrated verification in Professionals Hub**: Admin users see verification status badges on each professional card. Clicking the badge opens a modal with full verification details and admin actions (approve identity, approve W-9, verify contractor, enable payments, suspend)
        - Payment eligibility enforcement: Payments are blocked for contractors who haven't completed all requirements (identity verified, W-9 approved, agreements signed, verified payment method, admin approval)
        - Full audit logging for compliance
        - **Gap Analysis**: See `docs/contractor-onboarding-gap-analysis.md` for comparison with industry standards (Upwork, Fiverr, GoTu, etc.)
    - **Mobile App API**: JWT-based authentication for mobile apps with endpoints for:
        - Registration and login (`/api/mobile/auth/register`, `/api/mobile/auth/login`)
        - Onboarding status and progress tracking (`/api/mobile/onboarding`)
        - Document upload with multipart/form-data support (`/api/mobile/onboarding/documents/upload`)
        - W-9 submission, agreement signing, and payment method setup
    - **Patient Portal**: Allows patients to view bills and make payments.
    - **Services**: Manages subscription offerings for insurance and patient billing with tiered pricing.
    - **Settings**: Consolidated practice configuration.
    - **Messaging Center**: Real-time messaging system for Practice Admins to communicate with hygienists, including shift invitations.
- **Multi-Location Support**: Enables management of multiple office locations with assignable shifts and appointments.
- **Mobile App Integration**: Provides APIs for a mobile application to manage professional shifts (browsing, claiming, check-in/out, negotiations).
- **API Design**: A RESTful API provides endpoints for all major functionalities.

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **UI Component Libraries**: shadcn/ui, Radix UI
- **Styling Framework**: Tailwind CSS
- **Payment Gateway**: Stripe
- **Mapping/Geocoding**: Google Maps API
- **Font Hosting**: Google Fonts
- **Clearinghouse Integration**: Office Ally (for claims), DentalXchange (for dental eligibility), Availity (for medical eligibility - simulated)
- **Practice Management System Integration**: Dentrix Ascend (for patient data synchronization)