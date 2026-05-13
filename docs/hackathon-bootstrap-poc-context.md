# Hackathon POC Context: No-Controller Dashboard Bootstrap

## Goal

Build a demo-grade flow where running Juju dashboard in a no-controller environment launches a bootstrap UI, starts bootstrap, and auto-handoffs the user to the real dashboard URL.

## Non-goals (for POC)

- No production hardening.
- No progress streaming/job lifecycle model.
- No broad provider coverage.
- No deep refactor of existing dashboard app architecture.
- No tests — focus on implementation only.

## Confirmed technical constraints

- Existing controller API facades are not available before a controller exists.
- Bootstrap is CLI-side logic in Juju code paths.
- A no-controller flow must use a local Juju bridge path, not controller facades.

## Product experience

1. User runs Juju dashboard command.
2. If controller exists, use normal dashboard behavior.
3. If no controller exists, open bootstrap-only UI.
4. User submits bootstrap input and starts bootstrap.
5. On success, auto-redirect to real dashboard URL.

## POC architecture

- Juju side:
  - Add or extend dashboard command to detect no-controller mode.
  - Start localhost HTTP bridge with short-lived token.
  - Provide one endpoint that runs bootstrap and returns dashboard URL.
- Dashboard side:
  - Add bootstrap-only scene/page.
  - Call local bridge endpoint.
  - Redirect immediately on success.

## Minimal API contract

### POST /bootstrap/run

Request JSON:
{
"cloud": "aws",
"region": "us-east-1",
"controllerName": "ctrl-1",
"dashboardType": "machine",
"credentialName": "default"
}

Success JSON:
{
"ok": true,
"dashboardUrl": "https://example-dashboard/",
"controllerName": "ctrl-1"
}

Failure JSON:
{
"ok": false,
"error": "bootstrap failed: reason"
}

## Security minimum (POC)

- Localhost bind only.
- Bearer token required.
- Single in-flight request guard.

## 6-hour implementation slices

1. Juju command path and no-controller detection.
2. Local bridge server and token middleware.
3. POST /bootstrap/run wired to bootstrap path.
4. Bootstrap-only UI page and submit flow.
5. Auto-redirect to dashboardUrl on success.
6. Basic failure UI and manual demo script.

## Cut list if time slips

- Cut provider generalization.
- Cut advanced validation.
- Cut retries.
- Keep only one cloud/provider path that demonstrates feasibility.

## Starter prompt for any new model window

Use this exact instruction:

Implement the hackathon POC described in this file. Keep scope strict: no progress/jobs, no production hardening, one bootstrap endpoint, and auto-handoff redirect only. Preserve existing dashboard behavior when a controller exists. First, produce a concrete file-by-file change plan, then implement in small commits.
