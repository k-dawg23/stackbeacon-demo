# StackBeacon Security Model

The public demo exists to show the product safely.

## Demo Safety Model

The demo version does not run privileged commands.

It does not include:

- arbitrary command execution
- `sudo` access
- real server mutation
- committed secrets
- live host inspection
- real AI diagnostic requests

The diagnostics shown in the demo are mocked for safety.

## Production Design Intent

The private production design is intended to use allowlisted checks and carefully scoped actions rather than broad shell access.

Examples of intended allowlisted production checks/actions:

- Docker container status
- systemd service status
- selected log retrieval
- domain and SSL inspection
- explicit restart operations

## Log Handling

Logs should be redacted before AI analysis.

AI requests should send only selected log excerpts, not full raw logs.

This reduces privacy exposure, lowers token cost, and narrows the blast radius of mistakes.

## Destructive Actions

Destructive or operationally significant actions should require:

- explicit operator confirmation
- audit logging
- scoped authorization

## Secret Hygiene

No secrets should be committed to the repository.

Production configuration should be provided through environment-based deployment settings or secret management outside version control.

## Why The Public Demo Is Limited

The public demo intentionally avoids privileged server access and destructive actions for safety and security reasons.

That limitation is a design decision, not an omission.
