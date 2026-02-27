# Changelog

All notable changes to AthleteOS Enterprise are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.1] — 2025-02-27 — 100 Improvements Release

### Security
- **[Item 1]** Fixed XSS vulnerability in `showToast()` — replaced `innerHTML` with `createElement` + `textContent`
- **[Item 2]** Added Content-Security-Policy meta tag restricting script/style/image sources
- **[Item 3]** Added `crossorigin="anonymous"` to all CDN resources (SRI-ready)
- **[Item 4]** Added `sanitizeInput()` utility for encoding user input
- **[Item 5]** Added null-safety guards throughout all DOM lookup functions

### New Modules (Full Implementations)
- **[Item 6]** **Rosters Module** — Player card grid with search, filter, stats, avatar initials, payment status, CRUD
- **[Item 7]** **Schedule Module** — Interactive calendar with month navigation, event dots, upcoming events list
- **[Item 8]** **Facilities Module** — Facility cards with amenities, availability, booking table
- **[Item 9]** **Commerce Module** — Revenue KPIs, transaction table with Paid/Pending/Overdue status
- **[Item 10]** **Inventory Module** — Stock table, low-stock alerts, +/- adjustment, category filter
- **[Item 11]** **Messaging Module** — Conversation list, threaded messages, real-time send (Enter key)
- **[Item 12]** **Announcements Module** — Broadcast composer, audience targeting, pin, scheduled publishing
- **[Item 13]** **Safety Module** — Certification tracking, incident log with severity, waiver compliance
- **[Item 14]** **Reports Module** — Chart.js line + doughnut charts, program performance table

### Core Functions (Previously Stubs)
- **[Item 15]** `toggleSidebar()` — Real sidebar collapse/expand for mobile
- **[Item 16]** `addPlayer()` / `openAddPlayerModal()` — Full form with validation, edit mode, localStorage save
- **[Item 17]** `createEvent()` / `openCreateEventModal()` — Date/time/type/facility/program selectors
- **[Item 18]** `recordPayment()` / `openRecordPaymentModal()` — Athlete selector, amount, method, date
- **[Item 19]** `sendAnnouncement()` / `openAnnouncementComposer()` — Title, body, audience, pin, schedule date
- **[Item 20]** `openRegistrationWizard()` — 4-step wizard with progress navigation
- **[Item 21]** `offerSpot()` — Confirmation dialog, promotes athlete from Waitlisted to Active
- **[Item 22]** `sendPaymentReminders()` — Counts overdue/pending, confirms before sending
- **[Item 23]** `emailAllParents()` — Compose modal with subject + body, sends to all parents
- **[Item 24]** `printRosters()` — Navigates to rosters then calls `window.print()`
- **[Item 25]** `handleSearch()` — Live search across athletes and events with module navigation

### State & Navigation
- **[Item 26]** URL hash routing (`#dashboard`, `#rosters`, etc.) with `history.replaceState`
- **[Item 27]** `localStorage` persistence for active module on every navigation
- **[Item 28]** Debounced search input (300ms timer)
- **[Item 29]** Throttled resize events using `requestAnimationFrame`
- **[Item 30]** `markAllNotificationsRead()` — clears badge, marks all read

### Accessibility
- **[Item 31]** Skip-to-main-content link (screen-reader friendly, visible on focus)
- **[Item 32]** ARIA labels on user menu, notifications, quick-actions buttons
- **[Item 33]** Semantic `<main>` element with `id="main-content"` and `tabindex="-1"`
- **[Item 34]** Alt text on all avatar images
- **[Item 35]** `role="dialog"` and `aria-modal="true"` on all modals
- **[Item 36]** `aria-live="assertive"` on toast container for screen reader announcements
- **[Item 37]** Visible `:focus-visible` ring with 3px brand-colored outline
- **[Item 38]** `trapFocus()` — keyboard Tab cycling inside open modals
- **[Item 39]** `aria-expanded` attribute updates on notification and quick-action toggles
- **[Item 40]** `aria-current="page"` on active sidebar items

### UI/UX
- **[Item 41]** Dark mode toggle with `localStorage` persistence and moon/sun icon
- **[Item 42]** CSS custom properties (design tokens) for all colors, shadows, radii
- **[Item 43]** Print stylesheet showing only roster grid on `@media print`
- **[Item 44]** SVG favicon via data URI (no external request)
- **[Item 45]** Meta description, keywords, Open Graph tags, `theme-color`
- **[Item 46]** Breadcrumb navigation below header, updates on module switch
- **[Item 47]** Reusable `openModal()` / `closeModal()` / `confirmAction()` system
- **[Item 48]** `renderEmptyState()` component with icon, title, subtitle, optional CTA
- **[Item 49]** `showSkeleton()` shimmer loading animation helper
- **[Item 50]** Real Chart.js dual-axis line chart on dashboard (check-ins + revenue)
- **[Item 51]** Registration trends (line) + revenue by program (doughnut) in Reports
- **[Item 52]** `addTooltips()` — processes `data-tooltip` attributes
- **[Item 53]** `makeSortable()` — clickable table column sorting with asc/desc indicators
- **[Item 54]** `paginateData()` + `renderPagination()` — pagination component
- **[Item 55]** `renderFilterChips()` — accessible toggle-able filter chips

### Data Management
- **[Item 56]** localStorage data store with `storeGet()` / `storeSet()` helpers
- **[Item 57]** Athlete CRUD (add/edit/delete) with form validation
- **[Item 58]** Program data management with seed data
- **[Item 59]** Event CRUD with localStorage persistence
- **[Item 60]** Facility data with booking system
- **[Item 61]** Inventory CRUD with stock adjust buttons
- **[Item 62]** Message threading with real send functionality
- **[Item 63]** CSV export for rosters, payments, and reports (Blob download)
- **[Item 64]** Program capacity enforcement (shows waitlist status on full)
- **[Item 65]** Waitlist auto-promotion (`promoteFromWaitlist()`)
- **[Item 66]** Payment status tracking (Paid / Pending / Overdue)
- **[Item 67]** Real activity feed (persisted to localStorage, updated on actions)
- **[Item 68]** Athlete profile detail modal with payment summary
- **[Item 69]** Program enrollment history visible in athlete profile
- **[Item 70]** Facility availability shown per facility card

### Mobile
- **[Item 71]** Mobile sidebar toggle (show/hide desktop nav on mobile)
- **[Item 72]** Swipe gesture detection (left/right to navigate modules)
- **[Item 73]** Mobile bottom nav active state properly updated
- **[Item 74]** Responsive table wrapper with horizontal scroll
- **[Item 75]** Modal `max-h-[90vh]` + `overflow-y-auto` for small screens
- **[Item 76]** Tablet breakpoint (768px–1024px) with collapsed icon-only sidebar
- **[Item 77]** Mobile FAB button for dark mode toggle
- **[Item 78]** `showActionSheet()` — bottom-sheet modal for mobile contexts

### Performance
- **[Item 79]** `dns-prefetch` and `preconnect` resource hints for all CDN domains
- **[Item 80]** `cacheDOMElements()` — caches sidebar, toast, title, search in `DOM` object
- **[Item 81]** `dismissToast()` uses `requestAnimationFrame` for smooth animation
- **[Item 82]** `will-change: transform` on all animated elements (GPU compositing)
- **[Item 83]** Lazy-initialize Chart.js charts on first module visit
- **[Item 84]** Resize events throttled with `requestAnimationFrame`

### Features
- **[Item 85]** Dynamic weather widget with `refreshWeather()` (5 condition scenarios)
- **[Item 86]** Birthday detection on load — notifies if any athlete has today's birthday
- **[Item 87]** Payment due date alerts — warns about overdue balances on startup
- **[Item 88]** `calculateHealthScore()` — fill rate + payment rate algorithm
- **[Item 89]** `generateCheckInQR()` — QRCode.js modal for event check-in
- **[Item 90]** Full registration form with real-time field validation and capacity check
- **[Item 91]** Low-stock alert banner in inventory (shows item names)
- **[Item 92]** `toggleFacilityMaintenance()` — toggle maintenance status per facility
- **[Item 93]** `markConversationRead()` + `getReadReceipt()` — message read receipts
- **[Item 94]** `processScheduledAnnouncements()` — auto-publishes on scheduled date

### Developer Experience
- **[Item 95]** JSDoc `@typedef` for `Athlete`, `Event`, `Payment` types
- **[Item 96]** `openShortcutsModal()` — keyboard shortcuts reference (Shift+?)
- **[Item 97]** `startOnboardingTour()` — 6-step first-time user tour
- **[Item 98]** App version badge (`v2.0.1`) in sidebar footer
- **[Item 99]** Comprehensive README with features, architecture, data model, security notes
- **[Item 100]** This CHANGELOG

---

## [2.0.0] — 2025-01-01 — Initial Release

### Added
- Dashboard with KPI cards and weather widget
- Registration module with program cards and waitlist queue
- Stub modules for Rosters, Schedule, Facilities, Commerce, Inventory,
  Messaging, Announcements, Safety, Reports
- Mobile-responsive navigation with bottom bar
- Quick Actions modal
- Toast notification system
- Sidebar with module navigation
