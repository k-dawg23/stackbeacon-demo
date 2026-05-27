# StackBeacon Architecture

This document describes the intended system shape for both the public demo and the private production implementation.

## Public Demo Architecture

```text
Browser
  |
  v
React frontend
  |
  +--> mock telemetry state
  |
  +--> simulated AI diagnostics
```

The public demo is intentionally frontend-only.

It demonstrates:

- dashboard layout
- monitoring workflow
- log triage presentation
- AI-assisted explanation flow

It does not connect to:

- real servers
- live logs
- privileged host processes
- production AI providers

## Production Architecture

```text
Browser / React frontend
          |
          v
      Go backend API
          |
          +--> SQLite persistence
          |
          +--> AI provider abstraction
          |
          +--> local Go host-inspection agent
                       |
                       +--> Docker status
                       +--> systemd status
                       +--> domain / SSL checks
                       +--> selected log retrieval
```

## Browser / React Frontend

The frontend is intended to provide:

- operator login flow
- infrastructure overview
- severity-aware triage
- log inspection
- AI-assisted diagnostic summaries
- future operator actions

## Planned Provider Modes

### `mock`

- safe local simulation
- no network calls
- ideal for demos and testing

### `OpenAI`

- external hosted model integration
- structured diagnostic summaries
- controlled log excerpt submission

### `local/Ollama`

- private local-model option
- useful for self-hosted environments
- no third-party model API dependency

### `custom API`

- adapter mode for future model providers
- flexible enterprise or private deployment path

## Planned Deployment

### Docker Compose

The production version is intended to run as a small multi-service deployment with Compose orchestrating the frontend, backend, and persistence setup where appropriate.

### Caddy Or Nginx Reverse Proxy

The stack is expected to sit behind Caddy or Nginx for routing, TLS termination, and host exposure control.

### HTTPS

Production usage should require HTTPS for operator access and secure cookies.

### Local-Only Agent Binding

The Go inspection agent should bind locally so it is not directly exposed to the public network.

### Environment-Based Config

Configuration should be driven through environment variables so deployment targets remain portable and secrets stay outside the repository.
