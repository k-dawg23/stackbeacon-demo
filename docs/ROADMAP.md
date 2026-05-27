# StackBeacon Roadmap

## Phase 1: Public Demo

- responsive dashboard
- mock status data
- mock AI diagnostics
- portfolio documentation

## Phase 2: Read-Only Production MVP

Implemented in the private repository. Remaining work is focused on production readiness.

Completed:

- Go backend API
- local Go agent
- SQLite persistence
- Docker/container status
- systemd status
- log retrieval
- domain/SSL checks

Remaining for Phase 2 closure:

- production VPS validation
- deployment verification on the target host
- failure-case hardening
- broader integration and operational test coverage

## Phase 3: AI Diagnostics

- provider abstraction
- structured AI summaries
- severity classification
- evidence extraction
- suggested next actions
- cost/usage tracking

## Phase 4: Operator Actions

- restart service/container
- deployment history
- backup checks
- role-based access

## Practical Priority Order

1. Finish the public-facing documentation and screenshots.
2. Complete production validation and hardening for the private Phase 2 MVP.
3. Add provider-backed AI diagnostics behind a clear abstraction.
4. Introduce carefully scoped operator actions with audit trails.
