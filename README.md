# News Frontend (React + TypeScript + Ant Design + Vite)

A lightweight, mobile‑friendly admin UI for moderating news items, managing keyword filters, and viewing today's news. Built with React, TypeScript, Ant Design, and Vite.

This README explains the entire project: architecture, features, data models, API integration, storage, i18n, UX conventions, and how to run/build/deploy.


## Table of Contents
- Overview
- Features
- Tech Stack
- Quick Start
- Scripts
- Environment Variables
- Project Structure
- Architecture and Modules
  - App Shell and Navigation
  - Auth
  - HTTP Client
  - Internationalization (i18n)
  - Persistence (Local Storage)
  - Regex Utilities
- Pages
  - News Today
  - Digest Edits
  - Filters
  - Moderation
  - Settings
- Widgets and Features
- Data Models and API Contracts
- UX Conventions
- Accessibility and Responsiveness
- Error Handling and Toasts
- Development Tips
- Build and Deployment
- Troubleshooting
- FAQ


## Overview
This application is an internal tool that helps:
- View today's collected news and copy text for further processing.
- Create and manage keyword‑based filters that decide actions for incoming content (publish/reject/send to moderation).
- Moderate items flagged for review (approve or reject) with media preview and keyword highlighting.
- Edit digest inputs and settings.

The target users are authenticated team members. The UI is localized (RU/EN) and optimized for both desktop and mobile.


## Features
- Authenticated, single‑page app with a drawer menu.
- RU/EN localization with persistent language selection.
- News Today list with quick copy tools.
- Filters management: create/edit/delete, activate/deactivate, client‑side validation.
- Moderation queue: client search, optimistic approve/reject, auto‑refresh, media preview, keyword highlighting.
- Settings page to configure defaults.
- Responsive layout and sticky toolbars.


## Tech Stack
- React 19, TypeScript 5, Vite 7
- Ant Design v5 UI components
- ESLint 9, TypeScript ESLint configuration


## Quick Start
Requirements: Node 18+ and npm.

- Install dependencies: npm install
- Run dev server: npm run dev
- Open: http://localhost:5173

For a production build: npm run build, then npm run preview to serve the dist locally, or deploy the dist/ folder.


## Scripts
- npm run dev: Start Vite dev server.
- npm run build: Type-check (tsc -b) and build production bundles (vite build).
- npm run preview: Preview the production build.
- npm run lint: Lint the project.
- npm run deploy: Example deploy script that rsyncs dist/ to /var/www/news-frontend/ (adjust for your environment).


## Environment Variables
Configured via Vite env.

- VITE_API_BASE: Base URL for backend API. Default: /api. See src\shared\api\config.ts.

Example .env.local:
VITE_API_BASE=https://api.example.com


## Project Structure
Root files of note:
- src: Application source code
- public: Static assets
- index.html: HTML entry
- vite.config.ts: Vite configuration
- tsconfig*.json: TypeScript configs

High-level source layout (by feature):
- app: Application shell (header, drawer menu, routing-like navigation)
- pages: Top-level pages (news-today, edit-digest, filters, moderation, settings)
- widgets: Reusable list views and larger UI blocks
- features: Dialogs/components that implement focused user scenarios (e.g., FilterModal)
- entities: Domain models and API clients for news, filters, moderation
- shared: Cross-cutting utilities (HTTP client, i18n, storage, regex, auth hooks, etc.)


## Architecture and Modules

### App Shell and Navigation
- src\app\App.tsx provides the header with a menu button and a Drawer for navigation. The app is designed as a single screen with client-side state deciding which page to render (news | edit | filters | moderation | settings). The guard is implemented at a higher level: if not authenticated, the LoginPage is shown instead.

### Auth
- src\shared\auth\AuthProvider wraps the app and exposes useAuth() with user, loading, and logout. The HTTP client includes credentials and can attach Bearer tokens stored in local storage via our persistence helpers.

### HTTP Client
- src\shared\api\http.ts exposes http<T>(path, options) with JSON defaults, error mapping, and optional Authorization header (auth: true). Token helpers use the persistence utility (lsGet/lsSet/lsRemove). Base URL is resolved via src\shared\api\config.ts (VITE_API_BASE).

### Internationalization (i18n)
- src\shared\i18n\I18nProvider.tsx provides a context with t(key, params), current lang, and setLang. RU and EN dictionaries exist in the same file. The language selection is stored in local storage (key: app_lang) using lsGet/lsSet.

### Persistence (Local Storage)
- src\shared\storage\persist.ts provides safe wrappers for localStorage with SSR safety, JSON helpers, and a generic React hook usePersistentState(key, initial). Common LS keys are centralized in LS_KEYS (e.g., ui.moderation.autoRefresh, ui.filters.onlyActive, ui.filters.actionFilter).

### Regex Utilities
- src\shared\regex\parse.ts parses inputs like /pattern/flags and ensures Unicode flag by default.
- src\shared\regex\highlight.tsx returns React nodes with matched text wrapped in AntD Typography.Text mark. Used to highlight matched keywords/regex in moderation items.


## Pages

### News Today (src\pages\news-today\ui\NewsTodayPage.tsx)
- Fetches and displays today’s news via entities/news/api/fetchToday.ts.
- Provides floating action buttons to copy all text, cloud action stubs, and a shortcut to open Edit Digest.
- Mobile responsive: adjusts card widths on small screens.

### Digest Edits (src\pages\edit-digest\ui\EditDigest.tsx)
- A tool to paste raw input and transform/edit entries before publishing. Strings can be edited inline with save/cancel. Back button provided to return to News Today.

### Filters (src\pages\filters\ui\FiltersPage.tsx)
- Displays filter list with search, action filter, and "Only active" switch.
- Uses usePersistentState to remember action and active-only across sessions.
- Optimistic toggling of active state with server update and rollback on error.
- Opens FilterModal to create/edit filters with client-side validation and a tester.

Widgets:
- src\widgets\filters-list\ui\FiltersList.tsx renders each filter:
  - Keyword, optional notes, action tag with color, updatedAt tag, and toggle/edit/delete buttons.
  - For regex matchType, the UI used to show a Regex viewer; now the list focuses on core info.

### Moderation (src\pages\moderation\ui\ModerationPage.tsx)
- Pulls moderation items via GET /moderation with limit/offset.
- Toolbar: search input with found count, manual refresh, and Auto-refresh switch (persisted in LS). Toolbar is sticky under the app header.
- Client-side search on textHe using includes.
- List items:
  - Display createdAt tag, keyword highlighting in the Hebrew text (dir="rtl").
  - If media exists: show <video controls> for .mp4/.mov/.webm/.mkv; otherwise an <img>.
  - Approve/Reject buttons with Popconfirm. On small screens, actions are arranged to keep UI compact; on larger screens, they align horizontally.
- Approve/Reject performs POSTs to /moderation/:id/approve or /moderation/:id/reject with optimistic removal and toast success/error. No list refetch per item; use Refresh or Auto-refresh instead.
- Filters Map: the page fetches /filters (cached in-memory for 5 minutes) to display the filter keyword/tag and to know how to highlight matches according to matchType (substring/regex). Unknown IDs show a shortened tag with (unknown).
- Auto-refresh: when enabled, polls every ~20s without disrupting user context.

### Settings (src\pages\settings\ui\SettingsPage.tsx)
- Configure app-level settings (e.g., default filter action). Reads/writes via entities/filters/api/storage.ts.


## Widgets and Features
- FilterModal (src\features\filters-modal\ui\FilterModal.tsx): Create/edit filters. Includes a tester area to run testMatch and visualize matches.
- NewsList (src\widgets\news-list\ui\NewsList.tsx): Renders news entries with remove support.


## Data Models and API Contracts

Types:
- Filters (src\entities\filters\model\types.ts):
  - Filter: { id: UUID, keyword: string, action: 'publish'|'reject'|'moderation', priority: number, matchType?: 'substring'|'regex', active?: boolean, notes?: string, updatedAt: string }
  - Settings: { defaultAction }
  - FilterInput: payload for create/update (without id/updatedAt)

- Moderation (src\entities\moderation\model\types.ts):
  - ModerationItem: { id, textHe, createdAt, filterId, media? }

- News (src\entities\news\model\types.ts): shape used by NewsTodayPage.

APIs:
- Filters (src\entities\filters\api\storage.ts):
  - getFilters(): Filter[]
  - createFilter(input): Filter — client-side validation: keyword required (>=2 chars), priority 1..1000, regex validity, no duplicates for active filters with same matchType.
  - updateFilter(id, patch): Filter — merges with current and re-validates.
  - deleteFilter(id): void
  - getSettings()/updateSettings(patch): Settings
  - resolveAction(text): computes action by running active filters; falls back to defaultAction if none match.

- Moderation (src\entities\moderation\api\index.ts):
  - getModeration(limit, offset): ModerationItem[]
  - approveModeration(id): { ok: true }
  - rejectModeration(id): { ok: true }

- News (src\entities\news\api\fetchToday.ts):
  - fetchToday(): News[]

HTTP and Auth:
- http<T>(path, { method, headers, body, auth, signal }): JSON client with error handling and optional Authorization bearer.
- Token helpers: getToken/setToken/clearToken use lsGet/lsSet/lsRemove under key auth_token.


## UX Conventions
- RTL: Hebrew paragraphs use dir="rtl"; metadata and action areas are LTR.
- Sticky toolbar on pages where relevant (Moderation).
- Optimistic UI: Approve/Reject and Toggle Active apply instantly, with message.success on server OK and rollback on error.
- No automatic refetch after single-item actions; rely on manual Refresh or Auto-refresh.


## Accessibility and Responsiveness
- AntD components provide accessible roles and labels; aria-labels are used for critical controls (e.g., menu button).
- Responsive tweaks:
  - Many layouts switch to vertical stacks on small screens (<= 576px) using window resize listeners.
  - Inputs in toolbars adapt to 100% width on phones.
  - Action buttons are kept on one horizontal line where possible; on small screens they may group compactly with Space.


## Error Handling and Toasts
- AntD message and notification are used to inform about success/errors.
- http() converts non-OK responses into Error with best-effort message extraction.
- Common patterns: message.error on network/server errors, optimistic rollback on failure.


## Development Tips
- Type Safety: Keep models in entities/*/model/types.ts.
- Don’t access window.localStorage directly; use shared/storage/persist.ts (SSR-safe, centralized keys in LS_KEYS).
- Regex Safety: Use parseRegexInput and highlightMatches to avoid issues with missing Unicode flags and to prevent infinite loops on zero-length matches.
- i18n: Always go through useI18n().t(key, params). Add new keys in both RU and EN dictionaries.


## Build and Deployment
- Build: npm run build outputs to dist/.
- Preview: npm run preview serves the built app.
- Deploy: Customize npm run deploy. The example uses rsync to /var/www/news-frontend/; adapt to your infrastructure.

Performance notes:
- Vite may warn that some chunks exceed 500 kB. Consider code splitting or reducing heavy dependencies if needed; this warning doesn’t block production use.


## Troubleshooting
- API 401/403: Ensure auth token is present and valid; http options must include auth: true for protected endpoints.
- CORS/Origin issues: Configure VITE_API_BASE to target the correct API and ensure the backend allows credentials if needed.
- Language doesn’t persist: Check local storage availability (private browsing may disable). Keys: app_lang, ui.moderation.autoRefresh, ui.filters.onlyActive, ui.filters.actionFilter, auth_token.
- Regex highlight not visible: Ensure filters cache is loaded and matchType is set; substring highlighting is implemented via a safe escaped regex.


## FAQ
Q: Where do I add a new page?
A: Create a folder under src\pages\<page>\ui, export a component, and wire it into src\app\App.tsx with a new navigation link.

Q: How do I add a new persistent UI state?
A: Use usePersistentState from shared/storage/persist.ts and add a descriptive key in LS_KEYS.

Q: How do I change the API base URL?
A: Set VITE_API_BASE in your environment (e.g., .env.local). See shared/api/config.ts.

Q: How to support another language?
A: Add a new dictionary in I18nProvider and extend the Lang union type. Wire it into the Select in the Drawer.


## Contributing
- Keep PRs small and focused.
- Follow the existing folder structure: shared utilities in shared/, domain logic in entities/, UI on pages/widgets/features.
- Ensure lint passes: npm run lint.
- Prefer optimistic updates for snappy UX; handle rollback on errors.
