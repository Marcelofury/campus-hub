# Security Policy

## Supported development line

Campus Hub is currently an early development project. The `main` branch is
the supported line for security fixes while the platform is being prepared for
UTAMU use.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Contact the project
maintainers privately through the repository's security contact or GitHub
private vulnerability reporting.

Include:

- A clear description of the issue and its impact.
- The affected route, screen or file.
- Reproduction steps or a minimal proof of concept.
- Any suggested mitigation.

Please do not include real student records, credentials, tokens or other
sensitive data in a report.

## Current limitations

The local development login, role headers and JSON store are not production
authentication or authorization. They exist only to make the prototype
usable before Supabase is connected. Do not deploy them for real student data.

Production work must use Supabase Auth, server-side role verification, row
level security, secret management, input validation, audit logging and
appropriate moderation controls.
