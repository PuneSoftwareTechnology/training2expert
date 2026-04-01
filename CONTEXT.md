# SMS Frontend — AI Context File

> This file is the single source of truth for AI assistants working on this codebase.
> Read this before making any changes to understand the domain, rules, and architecture.

---

## 1. What Is This App?

**SMS = Student Management System** for **Pune Software Technology (PST)** — an IT training institute.

The system manages the full student lifecycle:
- Walk-in leads (Enquiries) → Enrollments → Training → Evaluation → Placement

There are **two institutes** under the same system:
- **PST** — Pune Software Technology
- **TCH** — (second institute)

---

## 2. User Roles

| Role | Created By | Auth Flow |
|---|---|---|
| `STUDENT` | Self-signup | Email + Password, email verification required |
| `ADMIN` | Super Admin only | No signup, credentials given by Super Admin |
| `SUPER_ADMIN` | System-level | Same login page, elevated permissions |
| `RECRUITER` | Admin only | No signup, created by admin in Access Management |

---

## 3. Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Routing | React Router DOM v6 (lazy-loaded) |
| Server state | TanStack React Query v5 |
| Client state | Zustand v5 (persisted to localStorage) |
| UI | Shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| HTTP | Axios (JWT Bearer auth interceptor) |
| Charts | Recharts |
| Animations | Framer Motion |
| Toasts | Sonner |
| Testing | Vitest + Testing Library |
| Deployment | Vercel |

**Dev server:** `npm run dev` → `http://localhost:3000`  
**Backend URL:** `VITE_API_BASE_URL` env var (default: `http://localhost:8080`)  
**API base path:** `/api` (all endpoints prefixed)

---

## 4. Project File Structure

```
src/
├── app/
│   ├── App.tsx              # Root: ErrorBoundary > BrowserRouter > Providers > AppRouter
│   ├── providers.tsx        # React Query setup + Sonner toaster
│   └── router.tsx           # Role-based lazy routes + auth guards
│
├── features/
│   ├── auth/                # Login, Signup, ForgotPassword, ResetPassword, VerifyEmail
│   ├── student/             # Student-facing pages
│   ├── admin/               # Admin + Super Admin pages
│   └── recruiter/           # Recruiter-facing pages
│
├── components/
│   ├── atoms/               # Smallest reusable pieces
│   ├── molecules/           # Composed of atoms
│   ├── organisms/           # Complex UI: ProtectedRoute, GuestRoute, ErrorBoundary
│   ├── forms/               # Shared form components
│   ├── tables/              # Table components
│   ├── loaders/             # PageLoader etc.
│   └── ui/                  # Shadcn-generated components
│
├── services/
│   ├── api.ts               # Axios instance, interceptors, extractData(), getErrorMessage()
│   ├── auth.service.ts
│   ├── admin.service.ts     # Largest service (~400 lines)
│   ├── student.service.ts
│   ├── recruiter.service.ts
│   └── super-admin.service.ts
│
├── store/
│   ├── auth.store.ts        # Zustand: user, token, isAuthenticated (persisted)
│   └── ui.store.ts          # Zustand: sidebar state etc.
│
├── types/
│   ├── user.types.ts        # User, LoginCredentials, SignupPayload, etc.
│   ├── common.types.ts      # Enums, Installment, Test, TestQuestion
│   ├── admin.types.ts       # Enquiry, Enrollment, reports, RecruiterAccount
│   ├── student.types.ts     # StudentProfile, Evaluation, PaymentSummary, CV, Tests
│   ├── dashboard.types.ts   # DashboardData, DashboardPeriod
│   ├── super-admin.types.ts # QrCode
│   └── api.types.ts         # ApiResponse<T>, ApiError
│
├── constants/
│   ├── routes.ts            # ROUTES object (all path strings)
│   └── roles.ts             # ROLES enum
│
├── hooks/                   # Shared custom hooks
├── layouts/                 # Layout shells (sidebar layouts per role)
├── lib/                     # cn() utility, etc.
└── styles.css               # Global Tailwind styles
```

---

## 5. Routing Architecture

### Route Groups
```
/              → Navigate to /login
/login         → GuestRoute > LoginPage
/signup        → GuestRoute > SignupPage
/forgot-password → GuestRoute > ForgotPasswordPage
/reset-password  → GuestRoute > ResetPasswordPage
/verify-email    → GuestRoute > VerifyEmailPage

/student/*     → ProtectedRoute [STUDENT] > StudentRoutes
/admin/*       → ProtectedRoute [ADMIN, SUPER_ADMIN] > AdminRoutes
/recruiter/*   → ProtectedRoute [RECRUITER] > RecruiterRoutes
*              → Navigate to /login
```

### Guards
- **`GuestRoute`** — Redirects to home if user is already authenticated
- **`ProtectedRoute`** — Redirects to `/login` if not authenticated; checks allowed roles

---

## 6. Auth & State

### Auth Store (`auth.store.ts`)
- Persisted to `localStorage` key: `auth-storage`
- Fields: `user: User | null`, `token: string | null`, `isAuthenticated: boolean`
- **`login(user, token)`** — clears React Query cache, sets state
- **`logout()`** — clears React Query cache, clears state
- Holds `queryClientRef` so it can clear cache without importing QueryClient at module level

### API Interceptors (`api.ts`)
- **Request**: Reads token from `localStorage["auth-storage"]` and attaches `Authorization: Bearer <token>`
- **Response 401**: If not an auth route and a token exists → clears storage and redirects to `/login`
- **`extractData<T>(response)`** — Unwraps `{ success, data, message }` API envelope

---

## 7. Domain Logic & Business Rules

### Enquiry → Enrollment Flow
1. Admin creates an **Enquiry** (lead) with name, phone, course, institute
2. Lead has `leadStatus`: `PROSPECTIVE | NON_PROSPECTIVE | ENROLLED`
3. When leadStatus = `ENROLLED` → Admin converts the lead to an **Enrollment**
4. Creating enrollment optionally creates a linked Student account

### Student Approval States
```
PENDING_APPROVAL → APPROVED → (optionally REJECTED)
```
- `PENDING_APPROVAL`: Student sees only basic profile info. All other tabs are locked/overlayed.
- `APPROVED`: Full access — profile editing, payments, evaluations, CV, tests
- Admin can approve or reject from the Enrollment page.
- Admin can revert approval.

### Student Constraints (Hard rules)
- Students **cannot** see `trainerRemark` (visible only to admin)
- Students **cannot** edit `technicalMarksScored` or `communicationScore`
- Students **cannot** modify fee/installment data
- Students **cannot** create or modify tests

### Enrollment Rules
- `completionStatus`: `ACTIVE | DROPOUT | COMPLETED`
- `enrollmentStatus`: `NEW | APPROVED | REJECTED`
- If a **batch end date** is updated → all students in that batch are updated

### Payment / Fee
- 3 structured installments per enrollment
- Each installment: amount, payment date, mode (`CASH | UPI`), receipt URL
- `pending_amount` is auto-calculated: `total_fee - paid_amount`
- Admin can send receipt via email

### Evaluations
- Admin/trainer fills: `technicalMarksScored`, `technicalTotalMarks`, `communicationScore`, `scopeForImprovement`, `trainerRemark`
- `scopeForImprovement` is **visible to student**
- `trainerRemark` is **hidden from student**
- Multiple evaluations per student (per course module)

### Tests (MCQ Engine)
- Created by Admin or Super Admin
- Course-based, time-bound, MCQ format
- Admin toggles a test active/inactive (visible to students when active)
- Timer enforced — auto-submits on expiry with whatever was completed
- Score stored per attempt

### Placement
- Each enrollment has `placementStatus`: `PLACED | NOT_PLACED`
- If placed: `companyName` is stored
- Tracked in the Placement Reports page

### QR Code (Payments)
- Super Admin creates/manages QR codes; marks one as active
- Admin can view active QR code
- Students see the active QR code in their Payments tab for making fee payments
- QR metadata: bank name, UPI ID, account number, IFSC code

---

## 8. Role-by-Role Feature Map

### STUDENT pages (`/student/*`)
| Page | Route | Notes |
|---|---|---|
| Profile | `/student/profile` | Editable after approval; locked before |
| CV | `/student/cv` | Upload CV; download course templates |
| Evaluations | `/student/evaluations` | Read-only; trainerRemark hidden |
| Payments | `/student/payments` | Read-only; shows QR for payment |
| Tests | `/student/tests` | List of tests for their course |
| Test Attempt | `/student/tests/:id` | Timed MCQ; auto-submits |

CV templates available per course + experience level:
- Courses: SAP FICO, DA, Cyber Security (and others)
- Experience levels: `FRESHER | EXPERIENCED`

---

### ADMIN pages (`/admin/*`)
| Page | Route | Notes |
|---|---|---|
| Dashboard | `/admin/dashboard` | Stats: enrollments, revenue, placements |
| Enquiry | `/admin/enquiry` | CRUD; filter by date, leadStatus, demoStatus |
| Enrollment | `/admin/enrollment` | Full lifecycle management |
| Fee Dues | `/admin/fee-dues` | Students with pending fees (30/60/90-day buckets) |
| Enrollment Figures | `/admin/enrollment-figures` | Monthly breakdown by course and institute |
| Placement Reports | `/admin/placement` | Placed vs not-placed; date/course filter |
| Candidate Filter | `/admin/candidates` | Filter by course, city, experience, scores; bulk actions |
| QR Code | `/admin/qr-code` | View active QR (read-only) |
| QR Management | `/admin/qr-management` | (Super Admin only) Create/activate QR codes |
| Recruiter Shortlist | `/admin/recruiter-shortlist` | View which students recruiters shortlisted |
| Access Management | `/admin/access` | Create/manage Recruiter accounts |
| Manage Admins | `/admin/manage-admins` | (Super Admin only) Manage admin accounts |
| Test Management | `/admin/tests` | Create, publish, view attempts |

**Admin sidebar nav items:**
Dashboard → Enquiry → Enrollment → Reports (sub-items) → QR Code → Recruiter's Shortlist → Access Management

---

### RECRUITER pages (`/recruiter/*`)
- Browse candidates (filtered by course, scores, city)
- Shortlist candidates for hiring
- View candidate CV

---

### SUPER ADMIN extras (on top of Admin access)
- QR Management (create/activate QR codes)
- Manage Admins (create admin accounts)

---

## 9. Data Models (Key Types)

### User
```ts
{ id, name, email, phone, role: Role, isApproved, isVerified, createdAt, updatedAt }
```

### Enrollment
```ts
{
  id, name, email, phone,
  enrollmentStatus: 'NEW' | 'APPROVED' | 'REJECTED',
  institute: 'PST' | 'TCH',
  course, batch, trainer, startDate, endDate,
  completionStatus: 'ACTIVE' | 'DROPOUT' | 'COMPLETED',
  installments: Installment[],
  placementStatus: 'PLACED' | 'NOT_PLACED',
  companyName?,
}
```

### Enquiry
```ts
{
  id, name, phone, email, course, institute,
  leadStatus: 'PROSPECTIVE' | 'NON_PROSPECTIVE' | 'ENROLLED',
  demoStatus: 'DONE' | 'PENDING',
  enquiryDate,
}
```

### Evaluation
```ts
{
  id, studentId, courseId, courseName,
  technicalMarksScored, technicalTotalMarks,
  communicationScore,
  moduleScores?: ModuleScore[],
  projectSubmission?,
  scopeForImprovement,   // visible to student
  trainerRemark,         // HIDDEN from student
}
```

### PaymentSummary
```ts
{
  total_fee, paid_amount, pending_amount,
  qr_code_url, qr_bank_name, qr_upi_id?,
  installment1_amount?, installment1_date?, installment1_mode?,
  installment2_amount?, installment2_date?, installment2_mode?,
  installment3_amount?, installment3_date?, installment3_mode?,
}
```

### API Response Envelope
```ts
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

---

## 10. Pagination Pattern

Many list endpoints return either a plain array **or** a paginated object.
All services normalize both to:
```ts
{ items: T[], total: number, page: number, totalPages: number }
```

---

## 11. Common Enums

```ts
EmploymentStatus  = 'WORKING' | 'NON_WORKING' | 'FRESHER'
CompletionStatus  = 'ACTIVE' | 'DROPOUT' | 'COMPLETED'
EnrollmentStatus  = 'NEW' | 'APPROVED' | 'REJECTED'
LeadStatus        = 'PROSPECTIVE' | 'NON_PROSPECTIVE' | 'ENROLLED'
DemoStatus        = 'DONE' | 'PENDING'
PaymentMode       = 'CASH' | 'UPI'
PlacementStatus   = 'PLACED' | 'NOT_PLACED'
Institute         = 'PST' | 'TCH'
ApprovalState     = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
```

---

## 12. Courses Offered

- SAP FICO
- SAP PP
- SAP MM
- SAP SD
- Data Analytics (DA)
- Cyber Security

---

## 13. Key Dev Patterns & Conventions

1. **Feature-sliced folders**: `features/<role>/{pages/, components/, schemas/}` — keep things co-located by domain.
2. **Zod schemas** in `/schemas` per feature — used with React Hook Form via `@hookform/resolvers/zod`.
3. **Services return typed data** — always call `extractData<T>(response)` to unwrap.
4. **React Query** for all server state; data is re-fetched when cache becomes stale (5 min stale time).
5. **Never use `window.location` for navigation** — use React Router's `useNavigate()`.
6. **Zustand auth store** is the single source of truth for the logged-in user; don't duplicate user state.
7. **Shadcn/ui** components are in `src/components/ui/` — prefer these over creating raw HTML elements.
8. **Toast notifications** via `sonner` — import `toast` from `'sonner'`.
9. **Error messages** — use `getErrorMessage(error)` from `services/api.ts` for consistent error string extraction.
10. **Role checks** — always use the `ROLES` constant from `@/constants/roles`, not raw strings.
