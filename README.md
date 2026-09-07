# KRICS Console

Build a production-quality KRICS Works & Institutions Management System frontend.

IMPORTANT:
Do NOT create a marketing website or landing page.
Do NOT create a hero section.
Do NOT create a generic SaaS template.
The first screen must be the actual operational dashboard.

PROJECT:
KRICS — Karnataka Residential Educational Institutions Society
Application name: "KRICS Works & Institutions"
Supporting label: "Residential Education Infrastructure Management"

TECH STACK:
- React
- Vite
- TypeScript
- React Router
- Tailwind CSS
- shadcn/ui
- Lucide React
- Framer Motion
- TanStack React Table
- TanStack Query
- Recharts
- React Hook Form
- Zod
- Axios or a typed fetch client

BACKEND:
The backend is Django REST Framework with MySQL.

API base URL must come from:

VITE_API_BASE_URL

Example:

VITE_API_BASE_URL=http://127.0.0.1:8000/api

==================================================
1. DESIGN THE APPLICATION AS A GOVERNMENT
OPERATIONS CONSOLE
==================================================

The UI should feel:

- Professional
- Trustworthy
- Calm
- Data-first
- Modern
- Fast
- Highly usable for daily government-office operations

Visual direction:

Background:
#f5f7f8

Surface:
#ffffff

Muted surface:
#eef3f2

Primary text:
#172126

Muted text:
#66757d

Primary:
#0f766e

Primary dark:
#115e59

Information:
#2563eb

Warning:
#b45309

Danger:
#b42318

Success:
#15803d

Border:
#d8e0e2

Use teal/emerald primarily for actions.

Use:
- Amber for pending/tender/estimate states
- Red only for critical errors/site problems
- Blue for information/progress
- Green for completed/successful states

Do not use purple as the dominant color.

Do not use giant gradients.

Do not use excessive rounded cards.

Do not nest cards inside cards.

Use 6px–10px border radius.

Use thin borders and restrained shadows.

Typography should use Manrope, DM Sans, Source Sans 3, or a similar highly readable font.

Keep dashboard typography compact and professional.

==================================================
2. APPLICATION SHELL
==================================================

Create a persistent application shell.

DESKTOP:

Sidebar width:
250–280px

Sidebar should be fixed/sticky.

MOBILE:

Sidebar becomes a drawer.

TOP BAR:

Include:

- Breadcrumbs
- Page title
- Global search
- Notifications
- Help
- User avatar/menu
- Mobile menu button

The sidebar must be collapsible.

When collapsed:

- Show icons
- Hide labels
- Add tooltips
- Maintain clear active-state indication

Remember expanded sidebar groups in localStorage.

==================================================
3. SIDEBAR NAVIGATION
==================================================

Use the following hierarchy exactly.

Dashboard
  - Overview

Master Management
  - Divisions
  - Districts
  - Taluks
  - Constituencies
  - Hoblis
  - Categories
  - Institution Types
  - Agencies
  - Schemes
  - Academic Years
  - Work Statuses

Institutions
  - All Institutions
  - Residential Schools
  - Hostels
  - PU Colleges
  - Site Available
  - Site Not Available
  - Site Problems

Works Management
  - All Works
  - Ongoing Works
  - Completed Works
  - Tender Stage
  - Estimate Stage
  - Site Problem Works
  - KKRDB Works
  - Works by Agency

Reports
  - Works Summary
  - District Summary
  - Category Summary
  - Financial Progress
  - Physical Progress
  - Institution Coverage

Data Import
  - Import Excel Files
  - Import Batches
  - Source Row Audit

Administration
  - Users
  - Roles and Permissions
  - Application Settings

Do not create separate sidebar items for individual CRUD actions.

Create/edit/export actions belong inside page toolbars.

==================================================
4. ROUTING
==================================================

Implement these routes:

/dashboard

/masters/divisions
/masters/districts
/masters/taluks
/masters/constituencies
/masters/hoblis
/masters/categories
/masters/institution-types
/masters/agencies
/masters/schemes
/masters/academic-years
/masters/work-statuses

/institutions
/institutions/:id
/institutions/schools
/institutions/hostels
/institutions/colleges
/institutions/sites/available
/institutions/sites/not-available
/institutions/sites/problems

/works
/works/:id
/works/ongoing
/works/completed
/works/tender-stage
/works/estimate-stage
/works/site-problems
/works/kkrdb

/reports/works-summary
/reports/district-summary
/reports/category-summary
/reports/financial-progress
/reports/physical-progress
/reports/institution-coverage

/imports/excel
/imports/batches
/imports/audit

/administration/users
/administration/roles
/administration/settings

==================================================
5. DASHBOARD
==================================================

Route:

/dashboard

This must be the default screen.

Header:

Dashboard

Subtitle:

Current institution coverage and construction progress

Controls:

- Academic year/date range
- District selector
- Category selector
- Refresh
- Export summary

METRIC CARDS:

1. Total institutions
2. Residential schools
3. Hostels
4. PU colleges
5. Total works
6. Ongoing works
7. Completed works
8. Site problem records

Each card must have:

- Lucide icon
- Large value
- Label
- Optional previous-period comparison
- Trend indicator where data exists
- Click-through behavior
- Loading skeleton

DASHBOARD CHARTS:

A. Work Status Distribution

Use donut or horizontal bar.

Statuses:

- Ongoing
- Completed
- Tender stage
- Estimate stage
- Site problem
- Not started
- Handed over

B. District-wise Works

Horizontal bar chart.

Clicking a district should navigate to /works with the district filter applied.

C. Financial vs Physical Progress

Show:

- Financial amount in Rs. lakh
- Physical progress in %

Clearly label units.

D. Recent Work Updates

Table columns:

- Work name
- District
- Status
- Physical progress
- Last updated
- Action

E. Site Availability Snapshot

Show three clear counts:

- Available
- Not available
- Problem

Each should link to the corresponding institution page.

Dashboard should use responsive CSS grid.

Desktop:
Metric cards across top.
Charts below in two-column/full-width layout.

Mobile:
Everything stacks vertically.

==================================================
6. MASTER MANAGEMENT
==================================================

Create a reusable Master Management page system.

All 11 master resources should use the same reusable architecture.

Resources:

/masters/divisions/
/masters/districts/
/masters/taluks/
/masters/constituencies/
/masters/hoblis/
/masters/categories/
/masters/institution-types/
/masters/agencies/
/masters/schemes/
/masters/academic-years/
/masters/work-statuses/

Each page must contain:

- Breadcrumb
- Page title
- Record count
- Add New button
- Search
- Active/Inactive filter
- Code filter where relevant
- Export
- Refresh
- Data table

Table columns:

- ID
- Name
- Code
- Status
- Created/updated information if API exposes it
- Actions

Actions:

- View
- Edit
- Activate/deactivate
- Delete only when backend confirms the record is not referenced

FORM:

- Name required
- Code optional
- Active toggle
- Inline validation
- Server duplicate errors
- Cancel
- Save
- Dirty-form warning

SPECIAL RULES:

Taluks:
- District is required
- District selector controls taluk filtering
- Show district column
- Enforce district + name uniqueness

Constituencies:
- District optional
- Show linked district

Hoblis:
- Taluk optional
- District may be derived from taluk

==================================================
7. INSTITUTIONS
==================================================

Route:

/institutions

Toolbar:

- Institutions
- Add Institution
- Import from Excel
- Export
- Search institution name/code
- Institution type
- Category
- District
- Taluk
- Site status
- Academic year
- Clear filters

TABLE:

Columns:

- Select
- Code
- Institution name
- Institution type
- Category
- Division
- District
- Taluk
- Constituency
- Hobli
- Academic year
- Site status
- Student capacity
- Source file
- Actions

Requirements:

- Sorting
- Filtering
- Column visibility
- Sticky header
- Horizontal scrolling
- Server-ready pagination
- 10/25/50/100 page sizes
- URL-synchronized filters
- Row click opens detail
- Selection supports bulk export

INSTITUTION DETAIL:

Show:

Header:
- Institution name
- Code
- Type
- Category
- Status

Location:
- District
- Taluk
- Constituency
- Hobli

Site:
- Site status
- Site details
- Survey/acreage text

Capacity:
- Student capacity

Related works:
- Reusable works table

Source traceability:
- Source file
- Sheet
- Row

Authorized users may see raw source JSON in a collapsible viewer.

SPECIAL VIEWS:

Residential Schools:
institution type filter

Hostels:
institution type filter

PU Colleges:
institution type filter

Site Available:
site_status=available

Site Not Available:
site_status=not_available

Site Problems:
site_status=problem

These must reuse the same institution table component.

==================================================
8. WORKS MANAGEMENT
==================================================

Route:

/works

Toolbar:

- Works
- Add Work
- Import Excel
- Export
- Search
- District
- Taluk
- Category
- Academic year
- Scheme
- Agency
- Status
- Date range
- Physical progress range
- Clear filters

Search fields:

- Work name
- Work code
- Contractor
- Approval reference

TABLE:

Columns:

- Select
- Work code
- Work name
- Work type
- Institution
- District
- Taluk
- Constituency
- Category
- Academic year
- Scheme
- Agency
- Status
- Estimate amount (Rs. lakh)
- Contract amount (Rs. lakh)
- Revised amount (Rs. lakh)
- Financial progress (Rs. lakh)
- Physical progress (%)
- Work order date
- Due date
- Last updated
- Actions

Money:

Use Indian number formatting.

Example:
₹12.50 lakh

Progress:

Show compact progress bar + percentage.

Never communicate status using color alone.

Long text:

Truncate in table and provide tooltip/detail view.

Dates:

DD-MM-YYYY

WORK DETAIL:

A. Summary
- Work name
- Code
- Status
- District
- Taluk
- Category
- Academic year
- Edit
- Export

B. Progress
- Physical progress
- Financial progress
- Estimate
- Contract
- Revised amount
- Completion comparison

C. Lifecycle timeline
- Work order date
- Site handover date
- Start date
- Due date
- Extension date
- Completion date

D. Contract/approval
- Approval reference
- Contractor
- Agency
- Scheme

E. Site/progress notes
- Site details
- Detailed physical progress
- Remarks

F. Source traceability
- Original workbook
- Sheet
- Row
- Raw source JSON

WORK FORM:

Use grouped sections.

Fields should have:

- Numeric validation
- Date pickers
- Searchable selects
- Dependent district → taluk selection
- Server validation errors

Require confirmation when changing a completed work back to active status.

PRE-FILTERED VIEWS:

/works/ongoing
/works/completed
/works/tender-stage
/works/estimate-stage
/works/site-problems
/works/kkrdb

All must reuse the same works table.

==================================================
9. REPORTS
==================================================

Every report must use API data.

Filters must be synchronized with URL.

WORKS SUMMARY:

Show:

- Total works by status
- Total estimated amount
- Total contract amount
- Total financial progress
- Average physical progress

DISTRICT SUMMARY:

Columns:

- District
- Institution count
- Work count
- Ongoing
- Completed
- Site problems
- Estimated amount
- Financial progress
- Average physical progress

CATEGORY SUMMARY:

Include:

- SC
- ST
- BC
- General
- Other source-specific categories

Show institution count, work count, financial totals, physical progress.

FINANCIAL PROGRESS:

Compare:

- Estimate
- Contract
- Revised
- Financial progress

Allow grouping by:

- District
- Category
- Year
- Agency

Use Rs. lakh consistently.

PHYSICAL PROGRESS:

Distribution:

- Below 25%
- 25–50%
- 50–75%
- 75–99%
- 100%

Filters:

- District
- Category
- Year
- Agency
- Status

INSTITUTION COVERAGE:

Show:

- Institutions by type
- Site available
- Site unavailable
- Site problem
- District coverage
- Taluk coverage
- Hobli coverage where available

Reports must have:

- Filters
- Apply
- Clear
- Charts
- Tables
- Export
- Loading
- Empty
- Error
- Accessible chart labels
- Alternative data table

==================================================
10. EXCEL IMPORT
==================================================

Route:

/imports/excel

Build a polished multi-step import workflow.

STAGES:

1. Select files
2. Validate
3. Preview
4. Import
5. Progress
6. Results
7. Error/mapping review

Supported:

.xls
.xlsx

UPLOAD UI:

- Drag/drop
- Browse
- File list
- File size
- Format
- Remove
- Unsupported file validation

PREVIEW:

Show:

- File name
- Worksheet names
- Detected header row
- Estimated rows
- Detected entity type
- Sample rows

Entity types:

- Institution
- Work
- Raw

Warn about:

- Merged headers
- Summary rows
- Ambiguous values

RESULTS:

Show:

- Files processed
- Rows seen
- Rows imported
- Institutions created/updated
- Works created/updated
- Masters created
- Raw rows archived
- Errors
- Warnings

Provide link to batch detail.

IMPORT BATCH:

Show:

- Batch ID
- Started
- Completed
- Source
- File count
- Row count
- Error count
- Status
- File-level errors
- Source-row audit link

AUDIT:

Search by:

- Source file
- Sheet
- Row number
- Entity type

Show:

- Original raw JSON
- Normalized record
- Batch
- Timestamp

==================================================
11. REUSABLE DATA TABLE
==================================================

Create ONE highly reusable DataTable component.

Use TanStack React Table.

Features:

- Sorting
- Multi-column sorting
- Search
- Column filters
- Select filters
- Date filters
- Numeric range filters
- Column visibility
- Row selection
- Sticky headers
- Responsive horizontal scroll
- Server-side pagination
- 10/25/50/100 page sizes
- Empty state
- Loading state
- Error state
- Retry
- Export selected/all
- URL filter synchronization
- Keyboard accessibility

Footer example:

Showing 1–25 of 237 records

Previous | 1 | 2 | 3 | ... | Next

Never render thousands of records when server-side pagination is available.

==================================================
12. API ARCHITECTURE
==================================================

Create a typed API service layer.

Do not place fetch/Axios calls directly inside UI components.

Create:

api-client.ts

query-client.ts

Typed interfaces for:

- Master
- District
- Taluk
- Institution
- Work
- Import batch
- Imported row
- Dashboard summary
- Report rows
- Pagination
- API errors

EXPECTED ENDPOINTS:

Masters:

GET /masters/{resource}/
POST /masters/{resource}/
GET /masters/{resource}/{id}/
PATCH /masters/{resource}/{id}/
DELETE /masters/{resource}/{id}/

Institutions:

GET /institutions/
POST /institutions/
GET /institutions/{id}/
PATCH /institutions/{id}/
DELETE /institutions/{id}/

Works:

GET /works/
POST /works/
GET /works/{id}/
PATCH /works/{id}/
DELETE /works/{id}/

Dashboard:

GET /dashboard/summary/

Reports:

GET /reports/works-summary/
GET /reports/district-summary/
GET /reports/category-summary/
GET /reports/financial-progress/
GET /reports/physical-progress/
GET /reports/institution-coverage/

Imports:

POST /imports/excel/
GET /imports/batches/
GET /imports/batches/{id}/
GET /imports/audit/

LIST RESPONSE:

{
  "count": 237,
  "next": "...",
  "previous": null,
  "results": []
}

ERROR:

{
  "detail": "Readable general error",
  "field_errors": {
    "name": ["This value already exists."]
  }
}

==================================================
13. TANSTACK QUERY
==================================================

Use TanStack Query for:

- API fetching
- Caching
- Refetching
- Mutations
- Loading states
- Error states
- Cache invalidation

Do not manually duplicate loading/error state logic unnecessarily.

After create/update/delete:

- Invalidate appropriate queries
- Show success toast
- Refresh affected tables

==================================================
14. FORMS
==================================================

Use:

React Hook Form + Zod.

Forms should be production quality.

Requirements:

- Client validation
- Server validation
- Field-level errors
- Loading state
- Disabled submit while saving
- Dirty state detection
- Unsaved-change confirmation
- Cancel
- Save
- Success toast
- Error toast

==================================================
15. LOADING EXPERIENCE
==================================================

Use supplied logo asset if available.

Do NOT invent a government emblem.

Create:

LoadingScreen

Use:

- Logo
- Subtle fade/scale
- Thin progress line or minimal motion indicators

Animation:
500–900ms

Only show full-screen loading while bootstrapping.

For normal API requests use:

- Skeleton cards
- Skeleton table rows
- Skeleton charts

Never show a giant spinner unnecessarily.

==================================================
16. MOTION
==================================================

Use Framer Motion carefully.

Allowed:

- Initial app loading
- Page transitions
- Metric card reveal
- Modal/drawer transitions
- Subtle navigation transitions

Metric cards may stagger by maximum 80ms.

Respect:

prefers-reduced-motion

Do not animate every table row.

==================================================
17. UX STATES
==================================================

Every page must support:

- Loading
- Empty
- API error
- Retry
- Success toast
- Error toast
- Confirmation dialog
- Unsaved changes warning

Example messages:

"District created successfully."

"Work updated successfully."

"Import completed with 4 warnings."

"Unable to load works. Retry the request."

Never use browser alert().

==================================================
18. ACCESSIBILITY
==================================================

Use:

- Semantic headings
- Accessible buttons
- Tooltips on icon-only buttons
- Keyboard navigation
- Visible focus states
- Accessible table headers
- Accessible progress values
- Focus-trapped dialogs
- Good color contrast
- Reduced-motion support

Never communicate important information using color alone.

==================================================
19. RESPONSIVE DESIGN
==================================================

Must work at:

1440 × 900
1024 × 768
390 × 844

Desktop:
- Sidebar visible
- Full-width tables
- Two-column charts
- Two-column details

Tablet:
- Collapsible sidebar
- Wrapped filters
- Horizontal table scroll

Mobile:
- Sidebar drawer
- Compact top bar
- Metric cards 1–2 columns
- Filter sheet/drawer
- Horizontally scrollable tables
- Stacked detail sections
- Touch-friendly controls

Do not hide critical information simply because the screen is narrow.

==================================================
20. COMPONENT ARCHITECTURE
==================================================

Use a clean feature-based architecture:

src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      TopBar.tsx
      Breadcrumbs.tsx

    data-table/
      DataTable.tsx
      DataTableToolbar.tsx
      DataTablePagination.tsx
      ColumnVisibilityMenu.tsx

    dashboard/
      MetricCard.tsx
      WorkStatusChart.tsx
      DistrictWorksChart.tsx
      ProgressChart.tsx

    forms/
      MasterForm.tsx
      InstitutionForm.tsx
      WorkForm.tsx

    feedback/
      LoadingScreen.tsx
      PageSkeleton.tsx
      EmptyState.tsx
      ErrorState.tsx

  features/
    dashboard/
    masters/
    institutions/
    works/
    reports/
    imports/
    administration/

  lib/
    api-client.ts
    query-client.ts
    formatters.ts
    permissions.ts
    constants.ts

  types/
    api.ts
    masters.ts
    institutions.ts
    works.ts

  styles/
    globals.css

Do not duplicate table/filter/form logic unnecessarily.

==================================================
21. FORMATTING
==================================================

Money:

Use Indian number formatting.

Example:

₹12.50 lakh

Null values:

Show:

—

Never display:

undefined
null
NaN

Dates:

DD-MM-YYYY

Status labels:

Ongoing
Completed
Tender stage
Estimate stage
Site problem
Not started
Handed over

Category labels:

SC
ST
BC
General

Do not use stereotypical category colors.

Long text:
truncate only in tables.

==================================================
22. MOCK DATA POLICY
==================================================

The final architecture must be API-ready.

Do NOT hard-code fake data into final components.

If the Django backend is unavailable during development:

Create a clearly isolated mock API adapter.

The architecture should make it possible to switch between:

REAL API

and

MOCK API

without rewriting the UI.

Keep mock data clearly labeled as development-only.

==================================================
23. ADMINISTRATION
==================================================

Create functional screens for:

/administration/users
/administration/roles
/administration/settings

Users:
- User list
- Search
- Status
- Role
- Create/edit user UI

Roles:
- Role list
- Permission matrix
- Read/write/delete permissions

Settings:
- API/system settings
- Application preferences
- Configuration sections

If backend endpoints are not yet available, build the UI and service interfaces
without pretending that unsupported backend operations succeeded.

==================================================
24. QUALITY REQUIREMENTS
==================================================

The application should feel like a real enterprise government system.

Avoid:

- Generic dashboard templates
- Excessive gradients
- Huge typography
- Empty hero sections
- Decorative charts without meaning
- Fake buttons
- Dead links
- Placeholder lorem ipsum
- Excessive animations
- Excessive rounded cards
- Inconsistent tables
- Inconsistent filters
- Inconsistent spacing

Prioritize:

- Information density
- Clarity
- Fast navigation
- Reusable components
- Accessibility
- Reliable API state handling
- Strong table UX
- Professional visual hierarchy

==================================================
25. IMPLEMENTATION ORDER
==================================================

Build in this order:

1. Project foundation
2. Theme/design system
3. Application shell
4. Sidebar/top bar
5. Routing
6. Dashboard
7. Reusable DataTable
8. Master Management
9. Institutions
10. Works
11. Reports
12. Excel Import
13. Administration
14. API integration layer
15. Loading/error/empty states
16. Responsive behavior
17. Accessibility
18. Final polish

Do not stop after creating only the dashboard.

Build the complete frontend architecture.

==================================================
26. ACCEPTANCE TEST
==================================================

Before considering the build complete, verify:

[ ] Application runs successfully
[ ] Dashboard is the first actual application screen
[ ] No marketing landing page exists
[ ] Sidebar works
[ ] Nested menus work
[ ] Active routes are highlighted
[ ] Mobile sidebar works
[ ] All 11 master resources exist
[ ] Master CRUD UI exists
[ ] Institution list works
[ ] Institution detail works
[ ] Institution filters work
[ ] Works list works
[ ] Works detail works
[ ] Works filters work
[ ] Progress displays correctly
[ ] Dashboard metrics exist
[ ] Dashboard charts exist
[ ] Recent works exist
[ ] Site snapshot exists
[ ] Reports exist
[ ] Excel import workflow exists
[ ] Import batches exist
[ ] Source-row audit exists
[ ] Administration screens exist
[ ] DataTable is reusable
[ ] Pagination exists
[ ] Sorting exists
[ ] Filtering exists
[ ] Column visibility exists
[ ] Row selection exists
[ ] Export controls exist
[ ] URL filter persistence exists
[ ] API base URL uses VITE_API_BASE_URL
[ ] Typed API layer exists
[ ] TanStack Query is used
[ ] React Hook Form + Zod are used
[ ] Loading states exist
[ ] Empty states exist
[ ] Error states exist
[ ] Retry actions exist
[ ] Toasts exist
[ ] Confirmation dialogs exist
[ ] Unsaved changes warning exists
[ ] Accessibility requirements are met
[ ] Responsive layouts work at desktop/tablet/mobile
[ ] Reduced motion is respected
[ ] No fake final controls remain
[ ] No hard-coded final dataset is embedded in UI components

==================================================
FINAL INSTRUCTION
==================================================

Now build the KRICS Works & Institutions application.

Start directly with the real operational dashboard and application shell.

Prioritize functionality, information architecture, reusable components,
professional government-operations styling, responsive behavior, accessibility,
and API readiness.

Do not simplify the specification into a generic dashboard.

Do not replace requested functionality with placeholders when a real UI can be
implemented.

Where the backend is unavailable, isolate mock adapters rather than embedding
fake data throughout the application.

Make the result feel like a polished production government infrastructure
management system rather than a prototype.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/95b84d1e-f6b8-424c-8cff-c9607b371412).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
