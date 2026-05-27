# Frontend Architecture (SDD-aligned)

Overview
- Purpose: Describe the high-level structure of the SmartChair frontend and how it maps to the Software Design Description (SDD).

Structure
- `src/` — application sources
  - `pages/` — top-level views (Home, About, Submissions)
  - `components/` — reusable UI components (NavBar, form controls)
  - `layouts/` — page layout components (MainLayout)
  - `services/` — integration code (API clients)

Design Principles
- Separation of concerns: UI, layout, and services are separated to enable independent testing and replacement.
- Accessibility: semantic HTML5 elements, `role` attributes, and `aria-*` where appropriate.
- Integration: `services/api.js` centralizes HTTP integration and reads base URL from `VITE_API_BASE_URL`.

SDD Mapping
- Components and pages correspond to SDD modules:
  - Presentation layer: `components/`, `pages/`
  - Layout: `layouts/`
  - Integration layer: `services/` (API client)

Future work
- Add routing with `react-router` or `react-router-dom` once dependency choices are finalized.
- Implement authentication flow and token storage.
- Add unit and integration tests for components and services.

## Planned Modules

- Authentication
- Paper Submission
- Blind Peer Review
- Reviewer Dashboard
- Administration Panel