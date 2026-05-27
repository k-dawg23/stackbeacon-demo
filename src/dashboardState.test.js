import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDiagnosticDetails,
  buildMetricCards,
  buildRefreshState,
  buildStatusSummary,
  formatRelativeTime,
  getStatusTone,
  parseLogLine,
} from "./dashboardState.js";

test("getStatusTone maps healthy and critical states", () => {
  assert.equal(getStatusTone({ status: "running", isHealthy: true }), "healthy");
  assert.equal(getStatusTone({ status: "failed", isHealthy: false }), "critical");
  assert.equal(getStatusTone({ status: "pending" }), "unknown");
});

test("buildStatusSummary counts status groups", () => {
  const overview = {
    containers: [{ status: "running", isHealthy: true }, { status: "failed", isHealthy: false }],
    services: [{ status: "warning", isHealthy: false }],
    domains: [{ status: "pending" }],
    health: { status: "healthy", diskUsagePct: 42, cpuUsagePercent: 25 },
    errors: ["agent timeout"],
  };

  const summary = buildStatusSummary(overview, new Date(Date.now() - 12000));
  assert.equal(summary.critical, 1);
  assert.equal(summary.warning, 2);
  assert.equal(summary.healthy, 2);
  assert.equal(summary.unknown, 1);
});

test("buildMetricCards produces four metric cards with severity tones", () => {
  const cards = buildMetricCards(
    {
      cpuUsagePercent: 82,
      memoryUsageMB: 512,
      memoryTotalMB: 1024,
      diskUsagePct: 91,
      uptimeHuman: "3d 4h",
      loadAverage: "1.10 0.90 0.70",
      status: "degraded",
    },
    new Date(),
  );

  assert.equal(cards.length, 4);
  assert.equal(cards[0].tone, "warning");
  assert.equal(cards[2].tone, "critical");
  assert.equal(cards[3].tone, "healthy");
  assert.equal(cards[3].badge, "healthy");
  assert.equal(cards[3].trend.label, "Runtime holding steady");
  assert.equal(cards[0].icon, "CPU");
  assert.equal(cards[2].trend.direction, "up");
});

test("parseLogLine extracts timestamps and severity", () => {
  const parsed = parseLogLine("2026-05-25T12:00:00Z ERROR disk full", 0);
  assert.equal(parsed.timeLabel, "2026-05-25T12:00:00Z");
  assert.equal(parsed.severity, "error");
  assert.equal(parsed.message, "disk full");
  assert.equal(parsed.lineNumber, "001");
});

test("formatRelativeTime returns stable labels", () => {
  assert.equal(formatRelativeTime(null), "just now");
  assert.match(formatRelativeTime(new Date(Date.now() - 90000)), /m ago$/);
});

test("buildRefreshState reflects live and stale refresh windows", () => {
  assert.equal(buildRefreshState(new Date()).tone, "live");
  assert.equal(buildRefreshState(new Date(Date.now() - 120000)).tone, "stale");
});

test("buildDiagnosticDetails derives structured guidance from summary and target scope", () => {
  const details = buildDiagnosticDetails(
    {
      severity: "high",
      evidence: ["2026-05-25T12:00:00Z ERROR upstream timeout"],
      nextSteps: ["Inspect the upstream service health."],
      createdAt: new Date(),
    },
    "api",
    {
      containers: [],
      services: [{ target: "api", name: "API service" }],
      domains: [],
    },
    [parseLogLine("2026-05-25T12:00:00Z ERROR upstream timeout", 0)],
  );

  assert.equal(details.confidence, "High");
  assert.equal(details.affectedScope, "Service: API service");
  assert.match(details.probableCause, /timeout/i);
});
