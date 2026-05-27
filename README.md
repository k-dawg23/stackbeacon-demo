# StackBeacon Demo

This repository contains the public demo/MVP version of StackBeacon. It uses mock diagnostics and safe sample data for portfolio and demonstration purposes. The private production repository includes live server integrations, backend services, authenticated operator flows, and deployment material.

## What is included

- the dashboard UI
- mock infrastructure status data
- sample log triage output
- local Vite development workflow

## What is intentionally not included

- live VPS or container inspection
- backend APIs and session handling
- deployment scripts and host configuration
- production secrets, databases, or operational runbooks

## Local run

1. Install dependencies with `npm install`.
2. Start the demo with `npm run dev`.
3. Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```
