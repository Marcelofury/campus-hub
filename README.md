# Campus Hub

Campus Hub is an open-source digital community platform for Uganda Technology and Management University (UTAMU). It brings official announcements, clubs, events, sport, student groups and campus conversations into one trusted place.

The project is intentionally being built with students and the UTAMU community. It is currently an early product foundation: the claymorphism frontend is usable as a product prototype, while persistence, authentication and moderation are being connected through the API.

## Stack

- **Frontend:** React 19, Vite, TypeScript and Lucide icons
- **Backend:** Node.js, Express and REST endpoints
- **Database:** Local JSON for development; Supabase/PostgreSQL planned for production
- **Design:** Responsive claymorphism UI

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
`server/data/local.json` file. Supabase values can be added later using the
examples in `.env.example`; never commit `.env` or a service-role key.

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

## Supabase setup (planned)

The Express API expects an `announcements` table with these initial columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` or `uuid` | Primary key |
| `title` | `text` | Required |
| `category` | `text` | Academic, Sports, Campus, etc. |
| `source` | `text` | Publishing office or club |
| `priority` | `text` | Important, Update or Opportunity |
| `published_at` | `timestamptz` | Defaults to `now()` |

Row Level Security should be enabled before production use. The service role key belongs only on the server. Authentication and user-scoped policies are part of the next implementation milestone.

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

## Roadmap before Supabase

Supabase is intentionally deferred while the product workflows are made
complete against the local API. The next implementation order is:

1. Replace client-trusted role headers with a signed local session model and
   server-derived current users.
2. Add user profiles, persistent sessions, profile editing and account
   settings.
3. Add club membership, club ownership, verification workflow and member
   management.
4. Complete event workflows: edit/cancel events, attendance limits, duplicate
   registration prevention and calendar-friendly details.
5. Add moderation: reporting, review queues, content status, audit history and
   admin actions.
6. Add notification preferences and in-app notifications for announcements,
   event changes, group activity and moderation outcomes.
7. Add search and filtering across announcements, clubs, events and groups.
8. Improve groups with membership approval, private-group access checks,
   message ownership, message moderation and direct messaging foundations.
9. Add accessibility, low-bandwidth states, pagination and stronger API input
   validation.
10. Add marketplace and campus-service workflows only after trust, reporting
    and moderation foundations are ready.

## Supabase phase

After the local workflows above are stable, migrate resource by resource:

1. Create the relational schema and migrations.
2. Move authentication to Supabase Auth.
3. Add server-side role claims and Row Level Security.
4. Migrate announcements, clubs, events, groups and messages.
5. Add realtime subscriptions and production notifications.
6. Run a controlled data migration and remove local demo authorization.

## Project principles

- Official information must be clearly distinguishable from student content.
- Student safety, privacy and moderation are core features.
- The platform should work well on mobile and low-bandwidth connections.
- Features should be useful before they are clever.
- Documentation and accessibility are part of the product.

## License

This project is intended to be open source for UTAMU students and contributors. A license will be selected with the UTAMU project community before the first public release.
