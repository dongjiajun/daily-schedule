# AGENTS.md

## Cursor Cloud specific instructions

Daily Schedule Management system. Three services, all needed for full end-to-end use:

- **MySQL 8.0** (port 3306) — root / `123456`; dev DB `daily_schedule_dev`, test DB `daily_schedule_test`.
- **Backend** — Spring Boot 3.4 / Java 21 / Maven, in `backend/`, runs on port 8080. Flyway auto-migrates schema on startup.
- **Frontend** — React 19 + Vite, in `frontend/`, dev server on port 5173 (proxies `/api` → `http://localhost:8080`, see `vite.config.ts`).

Standard commands live in `frontend/package.json` (`dev` / `build` / `lint`), `backend/pom.xml`, `README.md`, and `CLAUDE.md`. Notes below are the non-obvious bits.

### Startup (services are NOT auto-started by the update script)
- MySQL: `sudo service mysql start` (then reachable on `127.0.0.1:3306`). The non-root shell user can only reach MySQL over **TCP** (`mysql -uroot -p123456 -h127.0.0.1`); the unix socket is root-only.
- Backend dev config `backend/src/main/resources/application-dev.yml` is **gitignored** and required to run. If missing, create it from `application-dev.example.yml` with the dev password `123456` (datasource → `jdbc:mysql://localhost:3306/daily_schedule_dev`).
- Backend: `cd backend && mvn spring-boot:run` (default profile `dev`; Flyway migrates `V1`–`V4`). Swagger at `/swagger-ui.html`, OpenAPI JSON at `/api-docs`. REST base path is `/api/v1`.
- Frontend: `cd frontend && npm run dev`. The dev server must run alongside the backend for `/api` calls to work.

### KNOWN BLOCKER — frontend is broken on the repo's pinned Vite 8 (Rolldown)
`react-big-calendar/lib/addons/dragAndDrop` is a CommonJS module (`exports.default = fn`). Vite 8's Rolldown bundler pre-bundles/builds it as `export default require_dragAndDrop()`, i.e. it exports the **module namespace** `{ default: fn, __esModule: true }` instead of unwrapping `.default`. So `import withDragAndDrop from '...'` is an object, and `CalendarView.tsx` throws `TypeError: withDragAndDrop is not a function` at module load. Because `CalendarView` is eagerly imported, the **entire app renders a blank page** — in both `npm run dev` AND the production `vite build` runtime. CI only runs `npm run build` + `npm run lint` (never runs the app), so CI stays green despite this.
- `optimizeDeps.include`/`exclude` of the addon does **not** fix it; the bug spans all of Vite 8.x (tested 8.0.11 and 8.1.0). Downgrading to Vite 7 also requires downgrading `@vitejs/plugin-react` (it peer-requires `vite ^8`).
- Minimal source fix (one line) if you need the frontend to render: in `frontend/src/components/calendar/CalendarView.tsx`, unwrap the interop before use, e.g. `const f = (withDragAndDrop as any).default ?? withDragAndDrop; const DnDCalendar = f<CalendarEvent>(Calendar<CalendarEvent>)`. This was verified to make login + calendar + event creation work end-to-end, but is an app-code change (left uncommitted by default).

### Tests / lint / build
- Backend tests: `cd backend && mvn test` — JUnit, 134 tests; the `test` profile points at MySQL `daily_schedule_test` (env-overridable via `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`), so MySQL must be up.
- Frontend: `npm run lint` (ESLint) and `npm run build` (`tsc -b && vite build`) both pass. There is no frontend test script.
