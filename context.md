✅ STUDENT SIDE – STRUCTURED SPECIFICATION
1️⃣ Authentication Flow
Signup Flow

Student enters:

Name

Email

Phone

Password

System sends email verification link

After verification → redirect to Login

After login → redirect to Profile page

Login

Email + Password

Redirect to dashboard

Forgot Password

Enter email

If exists → send reset email with code

User enters code

Set new password

2️⃣ Profile Page
Initially (Before Admin Approval)

Only:

Name

Email

Phone visible

Rest:

Grayed out

Non-editable

Other tabs blocked with overlay

After Admin Approval

All fields editable:

Basic Details

Name

Phone

Email

City

Area

Profile photo

Education Details

Graduation

Graduation year

Post Graduation

PG year

Certifications (multiple)

Work Experience

Employment status:

Working

Non-working

Fresher

Last worked year

IT Experience:

Years

Months

Non-IT Experience:

Years

Months

Password Update

Change password option

3️⃣ Payments Tab

Display only (no payment gateway integration yet):

Total Fee

Paid Amount

Pending Amount

Admin-provided QR code for payment

4️⃣ Evaluations Tab

Visible after admin approval.

Fields:

Technical Score

Communication Score

Projects Submission (PDF upload)

Scope for Improvement (visible to student)

Trainer Remark (NOT visible to student)

Multiple test forms per course.

5️⃣ CV Upload Section
Download Templates (By Course + Experience)

Courses:

SAP FICO

DA

Cyber

Each has:

Fresher template

Experienced template

Student can:

Download template

Upload CV

6️⃣ Test System (MCQ Engine)

Designed by Admin / Super Admin.

Features:

Google Form style

MCQ questions

Time-bound tests

Admin enables test

Once enabled → visible to all students

Timer enforced

If time expires → auto-submit

Store whatever completed

Store final score

Tests are:

Course-based

Managed by admin

7️⃣ Approval Logic (Critical)

Student Account State:

PENDING_APPROVAL
APPROVED
REJECTED (optional)

Rules:

If PENDING:

Only Profile basic info visible

Other tabs locked

Overlay UI

Fields disabled

If APPROVED:

Full system access

Admin can revert approval anytime.

🔐 System-Level Student Constraints

Student cannot see trainer remarks

Student cannot edit scores

Student cannot modify fee data

Student cannot create or edit tests

This is now cleanly structured.

Do NOT change this unless needed.

Now explain:

Admin Side

Super Admin Side

Recruiter Side (if any)

Be equally structured.

✅ ADMIN SIDE – STRUCTURED SPECIFICATION
🔐 Admin Authentication

No signup

No forgot password

Super Admin creates Admin accounts

Admin login only via credentials created by Super Admin

Admin is desktop-only UI (table-heavy interface).

🖥 ADMIN DASHBOARD – LEFT SIDEBAR MENU

Menu Items:

Enquiry

Enrollment

Reports

QR Code

Recruiter’s Shortlist

Fee Dues

Enrollment Figures

Placement Reports

Access Management (Recruiters)

1️⃣ ENQUIRY MODULE
Data Fields:

Enquiry Date

Name\* (required)

Phone\* (required)

Email

Course

Institute (PST / TCH)

Lead Status:

Prospective

Non-Prospective

Enrolled

Demo Status:

Done

Pending

Features:

Filter section:

From Date

To Date

Lead Status

Demo Done

Prospective

Not Prospective

Add Enquiry button

Convert Lead → Enrollment

When Lead Status becomes "Enrolled" → move to Enrollment module.

2️⃣ ENROLLMENT MODULE

Main candidate management table.

Fields:
Basic Info

Name\*

Email\*

Phone\*

Enrollment Status:

New

Approved

Rejected

Institute (PST / TCH)

Profile (Modal View Only)

Open student profile in read-only mode

Evaluation (View Only)

Technical score

Communication score

Project submission

Scope for improvement

Trainer remark

Course Details

Course

Batch

Trainer

Start Date

End Date

Completion Status:

Active

Dropout

Completed

Important Rule:
If Batch end date is updated → all students in that batch get updated.

Payment Details

Total Fees

Installments (3 structured payments):

For each installment:

Amount

Payment Date

Mode (Cash / UPI)

View Receipt

Send Receipt (Email)

Also:

Pending Amount (auto-calculated)

Certificate

View Certificate

Send via Email

Placement Details

Status (Placed / Not Placed)

Company Name

Editing Behavior

Table row view by default

Left side button to enter "Edit Mode"

Entire row becomes editable

Save action required

Add New Candidate button (top left)

3️⃣ REPORTS MODULE
Candidate Filter Report

Admin can filter by:

Course

City

Years of Experience

Technical Rating

Communication Rating

Table Output:

Name

Remarks

Download CV button

Comment box

Send Email button

Bulk Actions:

Select multiple rows

Download all CVs in one zip

File naming format:
StudentName_Course

Send bulk email

Add bulk comment

4️⃣ FEE DUES REPORT

Filter:

Due > 30 days

Due > 60 days

Due > 90 days

Columns:

Name

Course

Completion Status

Phone

Total Fee

Paid Amount

Pending Amount

No. of Days (Current Date - Last Payment Date)

5️⃣ ENROLLMENT FIGURES

Filter:

Institute (PST / TCH)

Current Year (Jan–Dec only)

Table format:

| Course | Jan | Feb | ... | Dec | Total (YTD) |

Courses:

SAP FICO

SAP PP

SAP MM

SAP SD

DA

Cyber Security

6️⃣ RECRUITER’S SHORTLIST

Fields:

Recruiter ID\*

Course\*

Student Name\*

Date of Shortlist\*

7️⃣ QR CODE MODULE

View only.
Admin updates active QR code.
Students see same QR in their payment tab.

8️⃣ ACCESS MANAGEMENT (Recruiter Creation)

Admin can create Recruiter accounts.

Fields:

Name\*

Username\*

Email

Role

Created At

Delete

No recruiter signup.
Admin-controlled only.

🧠 System Logic Relationships

Enquiry → converts to Enrollment

Enrollment → connects to Student Profile

Batch end date → cascades to all same batch students

Installment payments → auto-calculate pending

Bulk CV download → dynamic zip generation

Trainer remark → hidden from student

Admin approval → unlock student dashboard

🔒 Permissions (So Far)
Feature Admin
Create Enquiry Yes
Convert to Enrollment Yes
Edit Enrollment Yes
Edit Payment Yes
Send Receipts Yes
Create Recruiter Yes
View Profile Yes
Create Tests (You said Admin + Super Admin)

✅ ADMIN SIDE – STRUCTURED SPECIFICATION
🔐 Admin Authentication

No signup

No forgot password

Super Admin creates Admin accounts

Admin login only via credentials created by Super Admin

Admin is desktop-only UI (table-heavy interface).

🖥 ADMIN DASHBOARD – LEFT SIDEBAR MENU

Menu Items:

Enquiry

Enrollment

Reports

QR Code

Recruiter’s Shortlist

Fee Dues

Enrollment Figures

Placement Reports

Access Management (Recruiters)

1️⃣ ENQUIRY MODULE
Data Fields:

Enquiry Date

Name\* (required)

Phone\* (required)

Email

Course

Institute (PST / TCH)

Lead Status:

Prospective

Non-Prospective

Enrolled

Demo Status:

Done

Pending

Features:

Filter section:

From Date

To Date

Lead Status

Demo Done

Prospective

Not Prospective

Add Enquiry button

Convert Lead → Enrollment

When Lead Status becomes "Enrolled" → move to Enrollment module.

2️⃣ ENROLLMENT MODULE

Main candidate management table.

Fields:
Basic Info

Name\*

Email\*

Phone\*

Enrollment Status:

New

Approved

Rejected

Institute (PST / TCH)

Profile (Modal View Only)

Open student profile in read-only mode

Evaluation (View Only)

Technical score

Communication score

Project submission

Scope for improvement

Trainer remark

Course Details

Course

Batch

Trainer

Start Date

End Date

Completion Status:

Active

Dropout

Completed

Important Rule:
If Batch end date is updated → all students in that batch get updated.

Payment Details

Total Fees

Installments (3 structured payments):

For each installment:

Amount

Payment Date

Mode (Cash / UPI)

View Receipt

Send Receipt (Email)

Also:

Pending Amount (auto-calculated)

Certificate

View Certificate

Send via Email

Placement Details

Status (Placed / Not Placed)

Company Name

Editing Behavior

Table row view by default

Left side button to enter "Edit Mode"

Entire row becomes editable

Save action required

Add New Candidate button (top left)

3️⃣ REPORTS MODULE
Candidate Filter Report

Admin can filter by:

Course

City

Years of Experience

Technical Rating

Communication Rating

Table Output:

Name

Remarks

Download CV button

Comment box

Send Email button

Bulk Actions:

Select multiple rows

Download all CVs in one zip

File naming format:
StudentName_Course

Send bulk email

Add bulk comment

4️⃣ FEE DUES REPORT

Filter:

Due > 30 days

Due > 60 days

Due > 90 days

Columns:

Name

Course

Completion Status

Phone

Total Fee

Paid Amount

Pending Amount

No. of Days (Current Date - Last Payment Date)

5️⃣ ENROLLMENT FIGURES

Filter:

Institute (PST / TCH)

Current Year (Jan–Dec only)

Table format:

| Course | Jan | Feb | ... | Dec | Total (YTD) |

Courses:

SAP FICO

SAP PP

SAP MM

SAP SD

DA

Cyber Security

6️⃣ RECRUITER’S SHORTLIST

Fields:

Recruiter ID\*

Course\*

Student Name\*

Date of Shortlist\*

7️⃣ QR CODE MODULE

View only.
Admin updates active QR code.
Students see same QR in their payment tab.

8️⃣ ACCESS MANAGEMENT (Recruiter Creation)

Admin can create Recruiter accounts.

Fields:

Name\*

Username\*

Email

Role

Created At

Delete

No recruiter signup.
Admin-controlled only.

🧠 System Logic Relationships

Enquiry → converts to Enrollment

Enrollment → connects to Student Profile

Batch end date → cascades to all same batch students

Installment payments → auto-calculate pending

Bulk CV download → dynamic zip generation

Trainer remark → hidden from student

Admin approval → unlock student dashboard

🔒 Permissions (So Far)
Feature Admin
Create Enquiry Yes
Convert to Enrollment Yes
Edit Enrollment Yes
Edit Payment Yes
Send Receipts Yes
Create Recruiter Yes
View Profile Yes
Create Tests (You said Admin + Super Admin)

✅ ADMIN SIDE – STRUCTURED SPECIFICATION
🔐 Admin Authentication

No signup

No forgot password

Super Admin creates Admin accounts

Admin login only via credentials created by Super Admin

Admin is desktop-only UI (table-heavy interface).

🖥 ADMIN DASHBOARD – LEFT SIDEBAR MENU

Menu Items:

Enquiry

Enrollment

Reports

QR Code

Recruiter’s Shortlist

Fee Dues

Enrollment Figures

Placement Reports

Access Management (Recruiters)

1️⃣ ENQUIRY MODULE
Data Fields:

Enquiry Date

Name\* (required)

Phone\* (required)

Email

Course

Institute (PST / TCH)

Lead Status:

Prospective

Non-Prospective

Enrolled

Demo Status:

Done

Pending

Features:

Filter section:

From Date

To Date

Lead Status

Demo Done

Prospective

Not Prospective

Add Enquiry button

Convert Lead → Enrollment

When Lead Status becomes "Enrolled" → move to Enrollment module.

2️⃣ ENROLLMENT MODULE

Main candidate management table.

Fields:
Basic Info

Name\*

Email\*

Phone\*

Enrollment Status:

New

Approved

Rejected

Institute (PST / TCH)

Profile (Modal View Only)

Open student profile in read-only mode

Evaluation (View Only)

Technical score

Communication score

Project submission

Scope for improvement

Trainer remark

Course Details

Course

Batch

Trainer

Start Date

End Date

Completion Status:

Active

Dropout

Completed

Important Rule:
If Batch end date is updated → all students in that batch get updated.

Payment Details

Total Fees

Installments (3 structured payments):

For each installment:

Amount

Payment Date

Mode (Cash / UPI)

View Receipt

Send Receipt (Email)

Also:

Pending Amount (auto-calculated)

Certificate

View Certificate

Send via Email

Placement Details

Status (Placed / Not Placed)

Company Name

Editing Behavior

Table row view by default

Left side button to enter "Edit Mode"

Entire row becomes editable

Save action required

Add New Candidate button (top left)

3️⃣ REPORTS MODULE
Candidate Filter Report

Admin can filter by:

Course

City

Years of Experience

Technical Rating

Communication Rating

Table Output:

Name

Remarks

Download CV button

Comment box

Send Email button

Bulk Actions:

Select multiple rows

Download all CVs in one zip

File naming format:
StudentName_Course

Send bulk email

Add bulk comment

4️⃣ FEE DUES REPORT

Filter:

Due > 30 days

Due > 60 days

Due > 90 days

Columns:

Name

Course

Completion Status

Phone

Total Fee

Paid Amount

Pending Amount

No. of Days (Current Date - Last Payment Date)

5️⃣ ENROLLMENT FIGURES

Filter:

Institute (PST / TCH)

Current Year (Jan–Dec only)

Table format:

| Course | Jan | Feb | ... | Dec | Total (YTD) |

Courses:

SAP FICO

SAP PP

SAP MM

SAP SD

DA

Cyber Security

6️⃣ RECRUITER’S SHORTLIST

Fields:

Recruiter ID\*

Course\*

Student Name\*

Date of Shortlist\*

7️⃣ QR CODE MODULE

View only.
Admin updates active QR code.
Students see same QR in their payment tab.

8️⃣ ACCESS MANAGEMENT (Recruiter Creation)

Admin can create Recruiter accounts.

Fields:

Name\*

Username\*

Email

Role

Created At

Delete

No recruiter signup.
Admin-controlled only.

🧠 System Logic Relationships

Enquiry → converts to Enrollment

Enrollment → connects to Student Profile

Batch end date → cascades to all same batch students

Installment payments → auto-calculate pending

Bulk CV download → dynamic zip generation

Trainer remark → hidden from student

Admin approval → unlock student dashboard

🔒 Permissions (So Far)
Feature Admin
Create Enquiry Yes
Convert to Enrollment Yes
Edit Enrollment Yes
Edit Payment Yes
Send Receipts Yes
Create Recruiter Yes
View Profile Yes
Create Tests (You said Admin + Super Admin)

✅ ADMIN SIDE – STRUCTURED SPECIFICATION
🔐 Admin Authentication

No signup

No forgot password

Super Admin creates Admin accounts

Admin login only via credentials created by Super Admin

Admin is desktop-only UI (table-heavy interface).

🖥 ADMIN DASHBOARD – LEFT SIDEBAR MENU

Menu Items:

Enquiry

Enrollment

Reports

QR Code

Recruiter’s Shortlist

Fee Dues

Enrollment Figures

Placement Reports

Access Management (Recruiters)

1️⃣ ENQUIRY MODULE
Data Fields:

Enquiry Date

Name\* (required)

Phone\* (required)

Email

Course

Institute (PST / TCH)

Lead Status:

Prospective

Non-Prospective

Enrolled

Demo Status:

Done

Pending

Features:

Filter section:

From Date

To Date

Lead Status

Demo Done

Prospective

Not Prospective

Add Enquiry button

Convert Lead → Enrollment

When Lead Status becomes "Enrolled" → move to Enrollment module.

2️⃣ ENROLLMENT MODULE

Main candidate management table.

Fields:
Basic Info

Name\*

Email\*

Phone\*

Enrollment Status:

New

Approved

Rejected

Institute (PST / TCH)

Profile (Modal View Only)

Open student profile in read-only mode

Evaluation (View Only)

Technical score

Communication score

Project submission

Scope for improvement

Trainer remark

Course Details

Course

Batch

Trainer

Start Date

End Date

Completion Status:

Active

Dropout

Completed

Important Rule:
If Batch end date is updated → all students in that batch get updated.

Payment Details

Total Fees

Installments (3 structured payments):

For each installment:

Amount

Payment Date

Mode (Cash / UPI)

View Receipt

Send Receipt (Email)

Also:

Pending Amount (auto-calculated)

Certificate

View Certificate

Send via Email

Placement Details

Status (Placed / Not Placed)

Company Name

Editing Behavior

Table row view by default

Left side button to enter "Edit Mode"

Entire row becomes editable

Save action required

Add New Candidate button (top left)

3️⃣ REPORTS MODULE
Candidate Filter Report

Admin can filter by:

Course

City

Years of Experience

Technical Rating

Communication Rating

Table Output:

Name

Remarks

Download CV button

Comment box

Send Email button

Bulk Actions:

Select multiple rows

Download all CVs in one zip

File naming format:
StudentName_Course

Send bulk email

Add bulk comment

4️⃣ FEE DUES REPORT

Filter:

Due > 30 days

Due > 60 days

Due > 90 days

Columns:

Name

Course

Completion Status

Phone

Total Fee

Paid Amount

Pending Amount

No. of Days (Current Date - Last Payment Date)

5️⃣ ENROLLMENT FIGURES

Filter:

Institute (PST / TCH)

Current Year (Jan–Dec only)

Table format:

| Course | Jan | Feb | ... | Dec | Total (YTD) |

Courses:

SAP FICO

SAP PP

SAP MM

SAP SD

DA

Cyber Security

6️⃣ RECRUITER’S SHORTLIST

Fields:

Recruiter ID\*

Course\*

Student Name\*

Date of Shortlist\*

7️⃣ QR CODE MODULE

View only.
Admin updates active QR code.
Students see same QR in their payment tab.

8️⃣ ACCESS MANAGEMENT (Recruiter Creation)

Admin can create Recruiter accounts.

Fields:

Name\*

Username\*

Email

Role

Created At

Delete

No recruiter signup.
Admin-controlled only.

🧠 System Logic Relationships

Enquiry → converts to Enrollment

Enrollment → connects to Student Profile

Batch end date → cascades to all same batch students

Installment payments → auto-calculate pending

Bulk CV download → dynamic zip generation

Trainer remark → hidden from student

Admin approval → unlock student dashboard

🔒 Permissions (So Far)
Feature Admin
Create Enquiry Yes
Convert to Enrollment Yes
Edit Enrollment Yes
Edit Payment Yes
Send Receipts Yes
Create Recruiter Yes
View Profile Yes
Create Tests (You said Admin + Super Admin)

✅ ADMIN SIDE – STRUCTURED SPECIFICATION
🔐 Admin Authentication

No signup

No forgot password

Super Admin creates Admin accounts

Admin login only via credentials created by Super Admin

Admin is desktop-only UI (table-heavy interface).

🖥 ADMIN DASHBOARD – LEFT SIDEBAR MENU

Menu Items:

Enquiry

Enrollment

Reports

QR Code

Recruiter’s Shortlist

Fee Dues

Enrollment Figures

Placement Reports

Access Management (Recruiters)

1️⃣ ENQUIRY MODULE
Data Fields:

Enquiry Date

Name\* (required)

Phone\* (required)

Email

Course

Institute (PST / TCH)

Lead Status:

Prospective

Non-Prospective

Enrolled

Demo Status:

Done

Pending

Features:

Filter section:

From Date

To Date

Lead Status

Demo Done

Prospective

Not Prospective

Add Enquiry button

Convert Lead → Enrollment

When Lead Status becomes "Enrolled" → move to Enrollment module.

2️⃣ ENROLLMENT MODULE

Main candidate management table.

Fields:
Basic Info

Name\*

Email\*

Phone\*

Enrollment Status:

New

Approved

Rejected

Institute (PST / TCH)

Profile (Modal View Only)

Open student profile in read-only mode

Evaluation (View Only)

Technical score

Communication score

Project submission

Scope for improvement

Trainer remark

Course Details

Course

Batch

Trainer

Start Date

End Date

Completion Status:

Active

Dropout

Completed

Important Rule:
If Batch end date is updated → all students in that batch get updated.

Payment Details

Total Fees

Installments (3 structured payments):

For each installment:

Amount

Payment Date

Mode (Cash / UPI)

View Receipt

Send Receipt (Email)

Also:

Pending Amount (auto-calculated)

Certificate

View Certificate

Send via Email

Placement Details

Status (Placed / Not Placed)

Company Name

Editing Behavior

Table row view by default

Left side button to enter "Edit Mode"

Entire row becomes editable

Save action required

Add New Candidate button (top left)

3️⃣ REPORTS MODULE
Candidate Filter Report

Admin can filter by:

Course

City

Years of Experience

Technical Rating

Communication Rating

Table Output:

Name

Remarks

Download CV button

Comment box

Send Email button

Bulk Actions:

Select multiple rows

Download all CVs in one zip

File naming format:
StudentName_Course

Send bulk email

Add bulk comment

4️⃣ FEE DUES REPORT

Filter:

Due > 30 days

Due > 60 days

Due > 90 days

Columns:

Name

Course

Completion Status

Phone

Total Fee

Paid Amount

Pending Amount

No. of Days (Current Date - Last Payment Date)

5️⃣ ENROLLMENT FIGURES

Filter:

Institute (PST / TCH)

Current Year (Jan–Dec only)

Table format:

| Course | Jan | Feb | ... | Dec | Total (YTD) |

Courses:

SAP FICO

SAP PP

SAP MM

SAP SD

DA

Cyber Security

6️⃣ RECRUITER’S SHORTLIST

Fields:

Recruiter ID\*

Course\*

Student Name\*

Date of Shortlist\*

7️⃣ QR CODE MODULE

View only.
Admin updates active QR code.
Students see same QR in their payment tab.

8️⃣ ACCESS MANAGEMENT (Recruiter Creation)

Admin can create Recruiter accounts.

Fields:

Name\*

Username\*

Email

Role

Created At

Delete

No recruiter signup.
Admin-controlled only.

🧠 System Logic Relationships

Enquiry → converts to Enrollment

Enrollment → connects to Student Profile

Batch end date → cascades to all same batch students

Installment payments → auto-calculate pending

Bulk CV download → dynamic zip generation

Trainer remark → hidden from student

Admin approval → unlock student dashboard

🔒 Permissions (So Far)
Feature Admin
Create Enquiry Yes
Convert to Enrollment Yes
Edit Enrollment Yes
Edit Payment Yes
Send Receipts Yes
Create Recruiter Yes
View Profile Yes
Create Tests (You said Admin + Super Admin)

1️⃣ PRODUCT OVERVIEW

This is a single-branch Student Management System with:

Student Portal

Admin Portal

Super Admin Portal

Recruiter Portal

Test Engine

Payment Tracking

CV Management

Reporting System

Download Limit Control

Email Notification System

System Type:

Role-based CRM + LMS + Placement Portal

Deployment:

Frontend: React (Vite)

Backend: Express.js

DB: PostgreSQL (Neon)

Storage: AWS S3

Email: AWS SES

2️⃣ ROLE DEFINITIONS
SUPER_ADMIN

Top-level authority.

Privileges:

Create/Delete Admin

Create/Delete Recruiter

Manage QR codes

Edit everything

Override any restriction

Super Admin account is manually inserted in DB (no signup route).

ADMIN

Operational manager.

Privileges:

Manage Enquiries

Convert Enquiry → Enrollment

Approve Students

Manage Payments

Manage Evaluations

Create Tests

Manage Recruiters

View Reports

Cannot:

Create Admin

Delete Admin

Manage QR

RECRUITER

External hiring entity.

Privileges:

Filter candidates

View limited profile

Download CV (limited)

Shortlist candidate

Contact Admin

Cannot:

See evaluation scores

See payment data

See trainer remarks

Edit anything

STUDENT

Portal user.

Privileges:

Signup (email verification)

Edit profile (after approval)

View payment summary

Upload CV

Take Tests

View own evaluations (except trainer remark)

3️⃣ STUDENT FLOW
Signup

Fields:

Name

Email

Phone

Password

Flow:

Create account (is_approved = false)

Send email verification

After verification → Login

After login → Profile page

Profile Page

Editable fields:

Basic:

Name

Email

Phone

City

Area

Photo

Education:

Graduation + Year

Post Graduation + Year

Multiple Certifications

Work:

Employment Status

Last Work Year

IT Experience (years + months)

Non-IT Experience

Password Update allowed.

Approval Lock Rule

If is_approved = false:

Only basic profile visible

All other tabs blocked

Overlay message: "Waiting for Admin Approval"

Payments Tab

Read-only for student.

Displays:

Total Fee

Paid Amount

Pending Amount

Active QR Code

Evaluation Tab

Shows:

Technical Score

Communication Score

Project Submission status

Scope for Improvement

Does NOT show:

Trainer Remark

CV Section

Download template (based on course & experience)

Upload CV (stored in S3)

Test Engine

Admin creates tests:

MCQs

Time-bound

Course-based

When test active:

Visible to all students

Timer enforced

Auto-submit on timeout

Store score

4️⃣ ADMIN FLOW
Enquiry Module

Fields:

Date

Name

Phone

Email

Course

Institute

Lead Status

Demo Status

Filter by:

Date range

Lead status

Demo status

Convert to Enrollment.

Enrollment Module

Fields:

Basic:

Name

Email

Phone

Status

Institute

Course:

Course

Batch

Trainer

Start Date

End Date

Completion Status

Rule:
Updating batch end date updates all students in same batch.

Payments

3 installments supported.

Each installment:

Amount

Date

Mode

Receipt upload

Send receipt email

Pending auto-calculated.

Reports

Submenus:

Candidate Filter

Filter by:

Course

City

Experience

Ratings

Actions:

Download CV

Bulk Download (zip)

Send Email

Comment

Fee Due

Filter:

30/60/90 days

Columns:

Name

Course

Completion Status

Paid

Pending

Days overdue

Enrollment Figures

Table:
Course × Month (Jan–Dec) + YTD total

Recruiter Shortlist

Display shortlist logs.

5️⃣ RECRUITER FLOW
Candidate Filter

Filters:

Course

City

IT Experience

Ratings

Table:

Name

Limited profile info

Download CV

Shortlist

Download Logic

Limit:

100 downloads free

After limit:
Block download.

Log:

recruiter_id

student_id

timestamp

Send email:

To student

To admin

Shortlist Logic

Store shortlist record.
Send email:

Student notified

Admin notified

6️⃣ SUPER ADMIN FLOW

Everything Admin can do +

Access Management

Create/Delete Admin

Create/Delete Recruiter

QR Management

Fields:

Image

Bank Name

is_active

Rule:
Only one active at a time.

7️⃣ SYSTEM RULES

All roles validated server-side.

JWT-based authentication.

Password hashed with bcrypt.

Only SUPER_ADMIN can create ADMIN.

Only ADMIN + SUPER_ADMIN create RECRUITER.

Student cannot access restricted routes if not approved.

Recruiter cannot see internal data.

Batch update cascades.

Download counter enforced.

Inactive recruiter > 6 months → deactivate.

8️⃣ TECHNICAL ARCHITECTURE
Backend Layers

Routes → Controllers → Services → Repositories → DB

No business logic inside controllers.

Frontend Structure

Feature-based architecture.

State:

Zustand (auth + UI state)

TanStack Query (API)

Reusable components:

Tables

Modals

Forms

Overlays

Filters

9️⃣ SECURITY BEST PRACTICES

Rate limit login

Validate all inputs

Sanitize file uploads

Store files in S3

Role-based middleware

Never trust frontend

Use HTTPS

Restrict S3 to private

🔟 FUTURE EXTENSION READY

Multi-branch scalable

Payment gateway integration possible

Subscription-based recruiter access possible

Analytics dashboards expandable

AI_FRONTEND_CONTEXT.md
SMS Frontend Architecture
================================

You are building a production-grade frontend for a Student Management System.

This is NOT a prototype.
Follow best practices strictly.

1️⃣ TECH STACK (MANDATORY)

React 18+

Vite

TypeScript

Tailwind CSS

shadcn/ui (Radix-based)

Framer Motion (light animations only)

Zustand (auth + UI only)

TanStack Query (server state only)

Axios (API client)

React Hook Form + Zod

React Router v6+

No Redux.
No Context API for auth.
No mixing server state with Zustand.

2️⃣ PROJECT STRUCTURE (STRICT)
src/
├── app/
│ ├── router.tsx
│ ├── providers.tsx
│ └── App.tsx
│
├── layouts/
│ ├── AdminLayout.tsx
│ ├── StudentLayout.tsx
│ ├── RecruiterLayout.tsx
│
├── features/
│ ├── auth/
│ ├── student/
│ ├── recruiter/
│ ├── admin/
│ ├── tests/
│
├── components/
│ ├── atoms/
│ ├── molecules/
│ ├── organisms/
│ ├── tables/
│ ├── forms/
│ ├── loaders/
│ └── animations/
│
├── hooks/
│ ├── useAuth.ts
│ ├── useRole.ts
│ ├── useInvalidate.ts
│
├── services/
│ ├── api.ts
│ ├── auth.service.ts
│ ├── student.service.ts
│ ├── recruiter.service.ts
│ ├── admin.service.ts
│
├── store/
│ ├── auth.store.ts
│ ├── ui.store.ts
│
├── types/
│ ├── api.types.ts
│ ├── user.types.ts
│ ├── student.types.ts
│
├── constants/
│ ├── roles.ts
│ ├── routes.ts
│
└── utils/
├── format.ts
├── cn.ts

No dumping logic into pages.

3️⃣ DESIGN SYSTEM

Define design tokens in Tailwind config:

Primary: Blue-based SaaS tone

Neutral grays

Success / Error semantic colors

Border radius scale

Typography scale

Use:

Clean spacing (8px grid)

Card-based layout

Subtle shadows

Modern SaaS dashboard look

No dark mode.

4️⃣ AUTH ARCHITECTURE

Zustand store:

{
user: User | null
token: string | null
login()
logout()
}

Persist in localStorage.

Axios interceptor:

Attach Bearer token

On 401 → logout + redirect

5️⃣ ROUTING STRATEGY

Single app with role-based layouts:

/login
/signup

/student/_
/admin/_
/recruiter/\*

Use lazy loading per role:

const StudentRoutes = lazy(...)

ProtectedRoute component must:

Check token

Check role

Redirect if unauthorized

6️⃣ SERVER STATE MANAGEMENT

TanStack Query:

Stable caching

No aggressive refetch

Invalidate on mutation

Use Suspense + skeleton loaders

Never store API data in Zustand.

7️⃣ FORM STRATEGY

React Hook Form + Zod.

Patterns:

Inline validation

Disable submit while loading

Show toast on success

Show toast on async failure

8️⃣ LOADING STRATEGY

Use skeleton loaders for:

Tables

Profile cards

Dashboard metrics

No spinner-only UI.

9️⃣ LAYOUT RULES

Admin:

Desktop-focused

Collapsible sidebar

Table-heavy

Student:

Responsive

Mobile-first

Bottom nav on small screens

Recruiter:

Responsive

Clean filter interface

🔟 RBAC UI RULES

Frontend must:

Hide routes user cannot access

Hide sidebar items by role

But still rely on backend enforcement

Never trust UI for security.

11️⃣ PERFORMANCE RULES

Lazy load route trees

React.memo for heavy table rows

Use TanStack Table for admin grids

Avoid unnecessary re-renders

Use useCallback only when necessary

12️⃣ ANIMATION RULES

Framer Motion only for:

Page fade-in

Sidebar collapse

Modal open/close

Small hover effects

No heavy motion.

13️⃣ FEATURE PRIORITY BUILD ORDER

Phase 1:

Auth

Layout

Route protection

Phase 2:

Student profile

Student CV upload

Student test page

Phase 3:

Admin enrollment table

Admin payment modal

Phase 4:

Recruiter candidate filter

Download CV

Shortlist

14️⃣ ERROR HANDLING

Toast for async errors

Inline form errors

Global ErrorBoundary for fatal crash

15️⃣ API CONTRACT USAGE

All API calls must expect:

Success:

{ success: true, message, data }

Failure:

{ success: false, message }

Create a unified API response handler.

16️⃣ ENVIRONMENT SETUP

Use:

.env.development
.env.production

Variables:

VITE_API_BASE_URL

17️⃣ INDUSTRY HARDENING RULES

No console.logs in production

No inline styles

No hardcoded role strings (use constants)

No magic numbers

Strict typing everywhere

No any type usage

18️⃣ VISUAL STYLE DIRECTION

Modern SaaS:

Clean white background

Soft borders

Subtle shadows

Card containers

Clear typography hierarchy

Structured spacing