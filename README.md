# Campus Hub

Campus Hub is an open-source digital community platform for Uganda Technology and Management University (UTAMU). It brings official announcements, clubs, events, sport, student groups and campus conversations into one trusted place.

The project is intentionally being built with students and the UTAMU community. It is currently an early product foundation: the claymorphism frontend is usable as a product prototype, while persistence, authentication and moderation are being connected through the API.

## Stack

- **Frontend:** React 19, Vite, TypeScript and Lucide icons in `frontend/`
- **Backend:** Node.js, Express and MVC-style REST API in `backend/`
- **Database:** Local JSON fallback for development; Supabase/PostgreSQL for configured deployments
- **Design:** Responsive claymorphism UI

## Project structure

The repository keeps application code inside two top-level folders:

```text
frontend/
  index.html
  src/                 React application, API client and styles
backend/
  data/                ignored local development data
  src/
    controllers/       HTTP request handlers
    docs/              OpenAPI definition
    middleware/        authentication and error middleware
    models/            local persistence models
    routes/             API route definitions
    services/          persistence and authentication services
  supabase/
    migrations/        database schema migrations
  tests/               backend API tests
```

Root-level files contain shared project configuration, documentation and
development scripts only. Generated folders such as `dist/` and `.next/` are
not part of this React/Vite project and must not be committed.

## Product areas

- Personalized dashboard
- Verified university announcements
- UTAMU clubs and societies
- Football, netball, volleyball and community events
- Student-created groups
- Admin and super-admin centre
- Moderation and reporting foundations

## Local development

### Requirements

- Node.js 20 or newer
- npm 10 or newer
- Supabase is optional during the current local-development phase

### Setup

```bash
git clone https://github.com/Marcelofury/campus-hub.git
cd campus-hub
npm install
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

The local API starts with seeded UTAMU data and writes changes to the ignored
`backend/data/local.json` file. When `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are configured, the API uses Supabase Auth and the
tables in `backend/supabase/migrations/001_initial_schema.sql`. Never commit
`.env` or a service-role key.

Start the frontend and API together:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API health check: http://localhost:4000/api/health

Run the production checks:

```bash
npm run test
npm run build
npm run lint
npx tsc --noEmit
```

## Supabase setup

1. Create a Supabase project.
2. Run `backend/supabase/migrations/001_initial_schema.sql` in the SQL editor.
3. Create users in Supabase Auth and add matching rows to `profiles`.
4. Copy `.env.example` to `.env` and set the project URL and server-only key.
5. Start the API and confirm `/api/health` reports `"database": "supabase"`.

The server uses the service-role key only on the backend. Row Level Security
is enabled by the migration; expand policies as membership and moderation
features are added.

## Roles

Campus Hub currently models three roles:

- **Student:** discover and participate in campus communities
- **Admin:** publish verified updates and manage moderation
- **Super admin:** all admin abilities plus platform-level administration

The role selector in the prototype is for local UI exploration only. Production authorization must come from Supabase Auth and server-side role checks.

## Contributing

1. Read the relevant issue before starting work.
2. Create a focused branch, for example `feat/club-directory`.
3. Keep changes small and explain the user impact in the pull request.
4. Run `npm run lint` and `npm run build`.
5. Include screenshots for visible UI changes.
6. Never commit secrets, student data or production exports.

AI-assisted contributors must also follow [skills.md](./skills.md), which
covers product context, safety rules, implementation standards, validation and
the one-file-per-commit workflow.

Good first contributions include improving the club directory, adding UTAMU event categories, writing Supabase migrations, improving accessibility, and adding tests for API validation.

## Roadmap after Supabase foundation

The Supabase foundation is now in place. The next implementation order is:

1. Add user profiles, profile editing and account settings.
2. Add club membership, club ownership, verification workflow and member
    management.
3. Complete event workflows: edit/cancel events, attendance limits, duplicate
    registration prevention and calendar-friendly details.
4. Add moderation: reporting, review queues, content status, audit history and
    admin actions.
5. Add notification preferences and in-app notifications for announcements,
    event changes, group activity and moderation outcomes.
6. Add search and filtering across announcements, clubs, events and groups.
7. Improve groups with membership approval, private-group access checks,
    message ownership, message moderation and direct messaging foundations.
8. Add accessibility, low-bandwidth states, pagination and stronger API input
    validation.
9. Add marketplace and campus-service workflows only after trust, reporting
    and moderation foundations are ready.

## Project principles

- Official information must be clearly distinguishable from student content.
- Student safety, privacy and moderation are core features.
- The platform should work well on mobile and low-bandwidth connections.
- Features should be useful before they are clever.
- Documentation and accessibility are part of the product.

## License

This project is intended to be open source for UTAMU students and contributors. A license will be selected with the UTAMU project community before the first public release.
