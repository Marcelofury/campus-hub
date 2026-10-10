# AI Contribution Skills

This guide is for contributors using AI assistants to work on Campus Hub.
It applies to coding agents, chat assistants and code-generation tools.
Human contributors remain responsible for reviewing, testing and understanding
every change submitted to the project.

## Product context

Campus Hub is being built for UTAMU students and staff as a central place for
official announcements, clubs, sports, events, student groups and campus
communication. Official information must remain distinguishable from
student-created content. Privacy, safety, moderation, accessibility and
low-bandwidth use are product requirements, not optional polish.

## Current architecture

- React, Vite and TypeScript in `frontend/`
- Node.js and Express REST API in `backend/src/`
- Backend MVC layers: `routes/`, `controllers/`, `middleware/`, `services/` and `models/`
- Local JSON persistence in `backend/data/local.json` for development
- Supabase production adapter and migrations in `backend/supabase/`
- Claymorphism is the established visual language

Do not introduce Next.js or replace the frontend framework. Supabase work must
include a migration, server-side authorization review and local fallback tests.

## Required workflow

1. Read `README.md`, `CONTRIBUTING.md`, `SECURITY.md` and the relevant source
   files before editing.
2. Search for existing helpers, types, routes and UI patterns before adding
   new ones.
3. Define the user-visible behavior and the authorization rule before coding.
4. Make the smallest complete change that solves the issue.
5. Keep API validation and frontend validation consistent.
6. Add or update tests for changed API behavior and important UI logic.
7. Update directly related documentation.
8. Run all relevant checks before reporting completion.

## Safety rules for AI agents

- Never invent credentials, tokens, student records or private campus data.
- Never commit `.env`, service-role keys, database exports or real user data.
- Treat all browser input, request bodies, headers and URL parameters as
  untrusted.
- Do not trust client-supplied roles, names or author fields for authorization
  or audit records.
- Do not silently catch errors or return success-shaped fallback data.
- Do not weaken authentication, moderation or privacy checks to make a test
  pass.
- Ask for clarification when a requirement affects privacy, permissions,
  data retention, public visibility or moderation policy.

## Implementation standards

### Frontend

- Use existing React, TypeScript and API-client patterns.
- Keep components accessible: semantic controls, labels, keyboard access,
  visible focus states and useful error messages.
- Preserve responsive behavior and the claymorphism design system.
- Represent loading, empty, error and success states explicitly.
- Avoid hard-coded data when an API resource already exists.

### Backend

- Add explicit route validation and clear HTTP status codes.
- Enforce authorization on the server, not only by hiding frontend controls.
- Verify that a resource belongs to the current user before allowing changes.
- Prevent duplicate registrations, duplicate memberships and unauthorized
  group access.
- Keep local JSON behavior deterministic so tests can reset state safely.

### Tests and documentation

- Prefer focused tests for new routes, authorization boundaries and validation.
- Include both an allowed and a denied role case for protected actions.
- Update README or endpoint documentation when setup or behavior changes.
- Do not claim Supabase, realtime messaging or production security exists until
  it is actually implemented and tested.

## Validation commands

Run these from the repository root:

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

For API changes, also exercise the health endpoint and the affected route.
For UI changes, manually check desktop and mobile layouts and verify login,
loading, empty, error and permission states.

## Commit discipline

Every changed file must have its own commit. Do not combine unrelated files in
one commit. Use a clear message such as:

```text
feat: add club membership endpoint
```

Every commit must include:

```text
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

Before finishing, verify:

```bash
git status --short
git log --oneline -n 10
```

Do not reset, discard or overwrite another contributor's uncommitted work.
