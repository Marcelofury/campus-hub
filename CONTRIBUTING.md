# Contributing to Campus Hub

Thank you for helping build a useful, safe and open platform for UTAMU students.

## Before you start

1. Read the [README](./README.md) and check existing issues or discussions.
2. Keep personal information, credentials and production exports out of commits.
3. For a significant feature, open an issue first so the scope is clear.

## Development workflow

```bash
npm install
copy .env.example .env
npm run dev
```

Use `cp .env.example .env` on macOS or Linux. The current development API uses
seeded local JSON data, so Supabase is not required yet.

Before opening a pull request, run:

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

## Pull requests

- Use a focused branch such as `feat/club-directory` or `fix/login-validation`.
- Explain the user problem, the solution and how you tested it.
- Include screenshots or a short recording for visible UI changes.
- Update documentation when behavior, setup or API contracts change.
- Preserve the distinction between official information and student-created content.
- Follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Commit convention

Campus Hub keeps file history easy to review: each changed file should be
committed separately. Use clear, imperative commit messages, for example:

```text
feat: add club membership endpoint
```

## Good first contributions

- Improve accessibility and keyboard navigation.
- Add UTAMU clubs, sports or event categories.
- Add API validation and tests.
- Improve low-bandwidth and mobile behavior.
- Prepare Supabase migrations without committing secrets.
