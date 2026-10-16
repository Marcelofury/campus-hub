# Campus Hub

Campus Hub is an open-source community platform for **Uganda Technology and Management
University (UTAMU)**. It brings official announcements, clubs, events, sport, student
groups and campus conversations together in one calm, trusted place.

It is built **with students, for students** — and we would love your help to make it
better. You do not need to be an expert: this guide walks you through everything.

- **Live app:** https://campus-hub-frontend-sigma.vercel.app
- **API:** https://campus-hub-qi98.onrender.com/api/health

---

## What you can do

- Read **verified announcements** from the university
- Browse **clubs and societies**, and open a club to see its details
- Follow **events and sport** fixtures, and register for them
- Join or create **student groups** and chat inside them
- Use the **admin centre** to publish updates (admin accounts)
- See an **AI campus brief** — a short summary of what is happening, written by Gemma

---

## Tech stack

| Part | What we use |
| --- | --- |
| Frontend (`frontend/`) | React 19, Vite, TypeScript, Lucide icons |
| Backend (`backend/`) | Node.js, Express, a simple MVC structure |
| Database | Supabase (PostgreSQL) in production, a local JSON file during development |
| AI | **Gemma** through Google AI Studio (online) or Ollama (local) |
| Design | Responsive "claymorphism" UI |

---

## Getting started

### 1. What you need

- [Node.js 20 or newer](https://nodejs.org) and npm 10 or newer
- [Git](https://git-scm.com)
- A code editor such as [VS Code](https://code.visualstudio.com)

That's it. **Supabase is optional** while you are just exploring — the app works with
seed data out of the box.

### 2. Set up the project

```bash
git clone https://github.com/Marcelofury/campus-hub.git
cd campus-hub
npm install
copy .env.example .env
```

> On macOS or Linux use `cp .env.example .env` instead of `copy`.

You do **not** need to fill in any keys to start. The defaults are fine for local work.

### 3. Run it

```bash
npm run dev
```

This starts both parts at once:

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/health

### 4. Log in

The local database comes seeded with demo accounts. These are **for the demo only** —
change them before any real deployment.

| Role | Email | Password |
| --- | --- | --- |
| Student | `ada@utamu.ac.ug` | `Utamu#Student1` |
| Admin | `admin@utamu.ac.ug` | `Utamu#Admin1` |
| Super admin | `superadmin@utamu.ac.ug` | `Utamu#Owner1` |

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the frontend and API together |
| `npm run dev:client` | Run only the frontend |
| `npm run dev:server` | Run only the API |
| `npm test` | Run the backend tests |
| `npm run lint` | Check the code style |
| `npx tsc --noEmit` | Check TypeScript types |
| `npm run build` | Make a production build |
| `npm run seed` | Seed the Supabase database |

---

## Project structure

```text
frontend/            React app (the website people see)
  index.html
  src/               Pages, components, API client and styles

backend/             Express API (the server)
  src/
    controllers/     Handle each request
    routes/          API URLs
    middleware/      Login and error handling
    models/          Local JSON storage for development
    services/        Database and AI (Gemma) helpers
  supabase/
    migrations/      Database schema
  scripts/           Seed and smoke-test helpers
  tests/             Backend tests

Root files           Shared config, docs and scripts only
```

Generated folders such as `dist/` are built automatically — please do not commit them.

---

## Keeping secrets safe

Campus Hub is public and open source, so **real keys must never end up in the code or in
Git**. A few simple rules:

- Never commit your `.env` file — it is already ignored by Git.
- Never put a secret in a `VITE_...` variable. Anything starting with `VITE_` is baked
  into the website and visible to everyone in the browser.
- API keys live **only on the server**. The browser talks to our backend, and the backend
  talks to Gemma. That is why the live app works for everyone without exposing a key.
- `.env.example` shows the *shape* of the config using fake placeholders. Keep it that way.

If you ever commit a key by accident, treat it as leaked: revoke it, make a new one, and
tell a maintainer. See [SECURITY.md](./SECURITY.md).

---

## The AI campus brief (Gemma)

The brief is a friendly 2–3 sentence summary of the campus data, written by a **Gemma**
model. Gemma can run in two ways.

### Online (recommended — this is how the live site works)

Gemma is served by **Google AI Studio** over the Gemini API. This means it runs on
Google's servers, so it works for anyone who visits the site — no installation needed.

1. Get a free API key at https://aistudio.google.com/apikey.
2. Put it in your `.env`:

   ```dotenv
   GEMINI_API_KEY=your-real-key
   ```

3. That's it. The server uses the key; it never reaches the browser.

On the deployed backend, add `GEMINI_API_KEY` in the Render dashboard (it is already
listed in `render.yaml`). Without a key the app still works — it falls back to a simple,
readable summary instead of the AI-written one.

> Note: the current Gemma models are "thinking" models, so a brief can take 15–20 seconds
> the first time. Results are cached for a few minutes to keep it fast afterwards.

### Local (optional — works offline, no key)

If you would rather run Gemma on your own machine:

1. Install [Ollama](https://ollama.com) and pull a model:

   ```bash
   ollama pull gemma3:4b
   ```

2. Point the backend at it in your `.env`:

   ```dotenv
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=gemma3:4b
   ```

The backend prefers the online key if both are set, and otherwise uses Ollama.

---

## How to contribute

Anyone is welcome — students, first-time contributors and experienced developers alike.

### Quick version

1. **Pick a task.** Look through the open issues, or scroll to *Good first issues* below.
2. **Fork and clone** the repository (or ask a maintainer for access).
3. **Create a branch** with a short, clear name:

   ```bash
   git checkout -b feat/club-directory
   ```

4. **Make your change.** Keep it focused on one thing.
5. **Run the checks** before you commit:

   ```bash
   npm test
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

6. **Commit and push**, then **open a pull request**. Describe what you changed and why,
   and add a screenshot if it changes the UI.

### Good first issues

- Improve accessibility and keyboard navigation
- Add UTAMU clubs, sports or event categories
- Add or improve API validation and tests
- Improve mobile and low-bandwidth behaviour
- Write or tidy documentation

### Commit style

We keep history easy to read. Use short, imperative messages:

```text
feat: add club membership endpoint
fix: prevent duplicate event registration
docs: explain how to run Gemma locally
```

### Before you open a pull request

- [ ] The change does one thing and I explained the user impact
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass
- [ ] No secrets, student data or production exports are included
- [ ] I updated the docs if setup or behaviour changed

Please also read [CONTRIBUTING.md](./CONTRIBUTING.md) and our
[Code of Conduct](./CODE_OF_CONDUCT.md). If you are contributing with AI assistance,
follow [skills.md](./skills.md).

---

## Testing

```bash
npm test            # backend API tests
npm run test:smoke  # end-to-end check against a configured Supabase project
```

The smoke test needs a configured Supabase project; the regular tests run fully offline.

---

## Deployment (for maintainers)

The frontend and backend deploy separately.

**Backend → Render** (`render.yaml`):

- Build: `npm install` · Start: `npm start`
- Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ORIGIN`
  and `GEMINI_API_KEY` in the dashboard (`sync: false` means provide them yourself).

**Frontend → Vercel**:

- Keep the root directory at the repository root; `vercel.json` handles the rest.
- Set `VITE_API_URL` to the Render API **including** `/api`, for example
  `https://campus-hub-qi98.onrender.com/api`.

---

## Roles

- **Student** — discover and take part in campus life
- **Admin** — publish verified updates and manage moderation
- **Super admin** — everything an admin can do, plus platform administration

---

## Roadmap

1. User profiles and account settings
2. Club membership, ownership and a verification workflow
3. Full event workflows (edit, cancel, limits, duplicate-prevention)
4. Moderation: reporting, review queues and audit history
5. Notifications for announcements, events and group activity
6. Search and filtering across everything
7. Richer groups: membership approval, private access and message moderation
8. Accessibility, low-bandwidth states and stronger input validation

---

## Project principles

- Official information must be clearly distinguishable from student content.
- Student safety, privacy and moderation are core features, not afterthoughts.
- It should work well on mobile and slow connections.
- Features should be useful before they are clever.
- Documentation and accessibility are part of the product.

---

## License

This project is intended to be open source for UTAMU students and contributors. A license
will be selected with the UTAMU project community before the first public release.
