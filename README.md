# AthleteOS Enterprise 2.0

A complete, single-file sports management platform built with vanilla JavaScript, Tailwind CSS, and Chart.js.

## Features

| Module | Status | Description |
|--------|--------|-------------|
| **Dashboard** | ✅ Full | KPIs, weather widget, performance charts, activity feed, schedule |
| **Registration** | ✅ Full | Programs, waitlist queue, registration wizard, capacity enforcement |
| **Rosters** | ✅ Full | Player cards, search/filter, CSV export, CRUD, athlete profiles |
| **Schedule** | ✅ Full | Interactive calendar, event list, check-in, QR codes |
| **Facilities** | ✅ Full | Facility cards, booking system, maintenance toggle |
| **Commerce** | ✅ Full | Payment tracking, CSV export, payment reminders |
| **Inventory** | ✅ Full | Stock management, low-stock alerts, adjust quantities |
| **Messages** | ✅ Full | Conversation list, message threading, send/receive |
| **Announcements** | ✅ Full | Compose, schedule, audience targeting, pin |
| **Safety** | ✅ Full | Certifications, incident log, waiver compliance |
| **Reports** | ✅ Full | Charts (line + doughnut), program performance table |

## Tech Stack

- **UI**: Vanilla JavaScript (ES6+), HTML5
- **Styling**: Tailwind CSS v3 (CDN), Custom CSS variables
- **Charts**: Chart.js
- **QR Codes**: QRCode.js
- **Icons**: Font Awesome 6.4
- **Fonts**: Google Inter
- **Storage**: localStorage (client-side persistence)

## Quick Start

Simply open `index.html` in any modern browser — no build step required.

```bash
git clone <repo-url>
cd athleteos-enterprise
open index.html   # macOS
# or
start index.html  # Windows
# or
xdg-open index.html  # Linux
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search bar |
| `Shift + ?` | Show keyboard shortcuts |
| `Escape` | Close modal / panel |
| `D` | Dashboard |
| `R` | Rosters |
| `S` | Schedule |
| `M` | Messages |

## Key Improvements (v2.0.1)

- **Security**: XSS-safe toast system, Content-Security-Policy, input sanitization
- **Accessibility**: Skip links, ARIA labels, focus rings, keyboard trap in modals
- **Dark Mode**: Full dark theme with localStorage persistence
- **URL Routing**: Hash-based routing (`#dashboard`, `#rosters`, etc.)
- **Data Persistence**: All CRUD operations saved to localStorage
- **CSV Export**: Rosters, payments, and reports downloadable as CSV
- **Real Charts**: Chart.js performance charts with dual axes
- **Onboarding**: First-time user tour (6 steps)
- **Mobile**: Swipe navigation, FAB, action sheets, responsive tables
- **Print Support**: Dedicated print styles for roster printing

## Architecture

```
index.html
├── <head> — Meta tags, CSP, resource hints, CDN scripts
├── <style> — CSS variables, dark mode, animations, print styles
├── <body>
│   ├── Skip-to-main link (accessibility)
│   ├── Mobile navigation bar
│   ├── Desktop sidebar (navigation + user menu)
│   ├── <main> — Module views (dashboard, rosters, etc.)
│   ├── Toast container
│   ├── App modal (reusable)
│   └── Confirm modal (destructive actions)
└── <script>
    ├── Data Store (localStorage helpers)
    ├── Seed Data (12 athletes, 6 events, 6 facilities, etc.)
    ├── App State + Module renderers (one per module)
    ├── Action Functions (all CRUD operations)
    ├── Modal System (openModal/closeModal/confirmAction)
    ├── CSV Export helpers
    ├── Accessibility helpers (trapFocus, ARIA updates)
    ├── Dark mode toggle
    ├── URL hash routing
    ├── Keyboard shortcuts
    ├── Onboarding tour
    └── DOMContentLoaded init
```

## Data Model

All data is stored in `localStorage` under `athleteos_*` keys:

- `athleteos_athletes` — Array of athlete objects
- `athleteos_events` — Array of event/schedule objects
- `athleteos_payments` — Array of payment transactions
- `athleteos_inventory` — Array of inventory items
- `athleteos_announcements` — Array of announcements
- `athleteos_activityFeed` — Recent activity log
- `athleteos_darkMode` — Boolean dark mode preference
- `athleteos_currentModule` — Last visited module
- `athleteos_onboardingDone` — Boolean onboarding completion flag

## Security Notes

- All user-facing text uses `textContent` (not `innerHTML`) to prevent XSS
- `sanitizeInput()` function available for encoding user input
- Content-Security-Policy meta tag restricts script/style sources
- CDN resources have `crossorigin="anonymous"` attributes (SRI-ready)
- In production: add `integrity="sha384-..."` to all CDN `<script>`/`<link>` tags

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
