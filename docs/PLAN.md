# Outbreak Signal Manager — a DHIS2 App control panel for Outbreak Signal Service

A DHIS2 App that gives admins a browser-based way to configure, trigger, and
review Outbreak Signal Service's statistical surveillance (EARS/CUSUM
aberration detection) — the same pattern as FHIR Sync Console, which is a
control panel for the `dhis2-fhir-aggregate-pipeline` CLI, not a
reimplementation of its logic.

**Plan written:** 2026-10-18 · **Status:** not started — blocked, see §0.

---

## 0. The real dependency — read this before anything else

**This app cannot be meaningfully built yet.** Checked against
`~/Documents/AIWORK/plan/Spring Boot/Outbreak Signal Service — Spring Boot — Plan.md`
directly, not from memory: Outbreak Signal Service is at **Phase 1 only**
(scaffold, three DB tables — `org_unit`, `series`, `observation` — and the
public-repo setup). It has:

- No DHIS2 sync yet (Phase 2)
- No detection engine yet (Phase 3) — nothing computes an alert
- No Alerts REST API yet (Phase 4) — no `/api/v1/alerts`, no acknowledge/
  resolve/dismiss, no `POST /sync` or `POST /detection/run` to trigger
- No notifications (Phase 5), no FHIR output (Phase 6)

A manager with nothing to configure and nothing to show is not a smaller
version of this app — it's not this app. **The first real manager work
(Settings + Route) can start once backend Phase 2 ships, but everything an
admin would actually use it for — triggering a run, seeing an alert —
depends on backend Phase 4.** Each manager phase below is gated on the
matching backend phase, not on a calendar date.

This is not a reason to abandon the idea — Outbreak Signal Service is real,
working, honestly-planned software, just not far enough along yet. This plan
exists so the manager's scope is ready the moment the backend catches up,
not so it gets built against a backend that can't support it.

---

## 1. Why this app, and why now (background)

- **A confirmed, genuine gap.** Checked the public DHIS2 App Hub directly
  (`apps.dhis2.org/api/v1/apps`, all 118 listed apps) for anything resembling
  statistical outbreak/aberration detection — nothing exists. The closest
  matches (a growth-chart tool, a Go.Data case-investigation connector, a
  maternal-health-specific risk alert) are unrelated.
- **Zero new detection logic.** The manager does not reimplement EARS/CUSUM —
  it's a browser front end for an engine that already exists and is already
  planned to be properly tested (Outbreak Signal Service's own `RESULTS.md`
  backtest numbers). Same relationship as FHIR Sync Console to its CLI.
- **Matches real, already-demonstrated work.** MORU/Bangladesh EWARS,
  NMCP Map Portal, the published 2026 measles outbreak analysis
  (Zenodo 10.5281/zenodo.20569837), and Outbreak Signal Service itself.
- **Directly strengthens the Oxford DPhil application** to Richard Maude /
  Mostafa Sarker ("From Signal to Action: Agentic AI for Epidemic
  Intelligence and Outbreak Response") — a shipped, App-Hub-approved
  surveillance manager is real evidence, not just a CV line.
- **Fits the Technology Partnership Program's own stated criteria** (Scott
  Russpatrick) — a platform complementary to DHIS2, producing something DHIS2
  natively consumes.

---

## 2. Architecture — the same lesson as FHIR Sync Console, applied here

Outbreak Signal Service's own plan (§4, Phase 4) already decided it will be
an **OAuth2 resource server** — JWT-secured, roles `VIEWER`/`ANALYST`/`ADMIN`.
A browser-based DHIS2 App must **never** hold that service's credentials or
tokens in browser-readable code — this is the exact March 2026 App Hub
guideline FHIR Sync Console was built around, and it applies here with equal
force, for a different external service.

```
 Browser (DHIS2 App) ──▶ DHIS2 Route ──▶ Outbreak Signal Service REST API
                          (server-side,      (JWT required, same place
                           credentials         the resource-server auth
                           encrypted at rest)  already lives per its own
                                                Phase 4 plan)
```

- DHIS2 itself makes the outbound call via a Route — same-origin from the
  browser's point of view, exactly like FHIR Sync Console's own Route.
- The Route's `auth` block holds whatever Outbreak Signal Service's resource
  server needs (a service-account bearer token, rotated the same manual way
  FHIR Sync Console's own README already documents and accepts as a real,
  stated limitation).
- The manager **picks or creates** a Route, same UX as FHIR Sync Console —
  don't reinvent that flow, reuse it.

---

## 3. What the manager actually shows and does (scoped to what the backend will have)

| Screen | What it does | Needs backend phase |
|---|---|---|
| **Settings** | Pick/create the Route to Outbreak Signal Service. Pick which DHIS2 datasets/data elements map to which `series`. | Phase 2 (series exist to map to) |
| **Trigger** | `POST /sync` and `POST /detection/run` buttons, with the resulting run's status shown inline (started/finished, counts). | Phase 4 — Phase 2's `/sync` exists in code but is explicitly unsecured until Phase 4 adds auth; `/detection/run` doesn't exist as a REST endpoint before Phase 4 either. Both are listed together under Phase 4 in the backend's own plan. |
| **Alert list** | `GET /alerts`, filterable by status/org unit/algorithm/date, paginated. | Phase 4 |
| **Alert detail** | One alert's full history (`alert_event` trail), acknowledge/resolve/dismiss actions with the required reason on dismiss. | Phase 4 |
| **Review history** | Past `detection_run`s — which algorithm, which parameters, when. | Phase 3 (data exists) surfaced via Phase 4 (API to read it) |

Deliberately **not** in scope for a v1: webhook/notification configuration
(Phase 5) or the FHIR `DetectedIssue` view (Phase 6) — both are real, but
neither blocks a useful v1, and adding them later is additive, the same
"v1.1, not a breaking redesign" discipline the other apps already use.

---

## 4. Phases — each one explicitly gated on the backend, not just sequenced after it

### Manager Phase 0 — Wait and watch (no build work)

- No code. Re-read Outbreak Signal Service's own `§8 Progress log` before
  starting anything, to confirm which phases actually landed and whether any
  `§8 Deviations` changed the planned API shape (Phase 1 already had five
  real deviations from its own plan — expect more).
- **Done when:** Outbreak Signal Service's progress log shows Phase 2 merged
  and tagged `phase-2` — the earliest point any manager phase below can
  start. (Manager Phase 2 below has its own, later gate on Phase 4.)

### Manager Phase 1 — Settings + Route (S), after backend Phase 2

- Route picker/creator (reused pattern from FHIR Sync Console, not
  rebuilt from scratch — copy the proven component, don't reinvent it).
- Series mapping: read Outbreak Signal Service's actual `series` shape (not
  assumed — fetch a real one against a real running instance before writing
  the mapping UI) and let an admin associate it with a DHIS2 dataset/data
  element/org unit.
- Settings persisted the same dataStore-blob pattern as every sibling app
  (one namespace, one key, read-modify-write).
- **Done when:** a real series created via this app's Settings screen shows
  up correctly when queried directly against Outbreak Signal Service's own
  API.

### Manager Phase 2 — Trigger, alert browsing and the state machine (M), after backend Phase 4

Merged into one phase because both halves genuinely unlock at the same
backend milestone — splitting them implied a staged unlock across backend
Phase 3 and Phase 4 that doesn't actually exist; Phase 3 only adds scheduled
automatic detection, not a securable REST trigger.

- `POST /sync` and `POST /detection/run` buttons with real inline status.
  Live-verify against a real running instance of Outbreak Signal Service
  (not just WireMock/synthetic, which is Outbreak Signal Service's *own*
  test strategy — the manager's job is to prove the real HTTP round trip
  through a real Route works, the same live-verification discipline every
  other app in this portfolio already follows).
- Alert list with filters/pagination; alert detail with full event history.
- Acknowledge/resolve/dismiss actions wired to the real state machine
  (`OPEN → ACKNOWLEDGED → RESOLVED`, or `→ DISMISSED` with a required
  reason) — illegal transitions return `409` per the backend's own plan;
  the UI must surface that error, not hide it.
- Role awareness: a `VIEWER`-token user sees alerts but the action buttons
  are disabled, matching the backend's own `403` behaviour honestly rather
  than letting a click silently fail.
- **Done when:** triggering sync and detection from the manager produces the
  same `detection_run` row visible via a direct API call, **and**
  acknowledging a real alert in the manager, then querying Outbreak Signal
  Service's API directly, shows the identical state and an `alert_event` row
  recording who/when.

### Manager Phase 3 — App Hub submission (S–M)

- Same bar as every other app in this portfolio: user-facing README (not a
  dev log), short plain App Hub description, a name that isn't generic,
  every documented feature verified to actually exist, `tsc` clean, tests
  green, i18n extracted.
- Explicitly document the one real limitation inherited from the backend:
  a manually-rotated service-account token, same category of honest
  disclosure FHIR Sync Console already makes about OAuth2.
- **Done when:** published to the App Hub stable channel and verified live
  via the App Hub's own API, same verification habit as every prior
  release in this portfolio (never trust the CLI's success message alone).

---

## 5. Risks and open questions

| Risk | Handling |
|---|---|
| Outbreak Signal Service's actual Phase 4 API shape differs from what's planned here (very likely, given Phase 1 already had 5 documented deviations) | Re-verify the real API against a running instance at the start of each manager phase, never build against the plan document alone |
| OAuth2/Keycloak token issuance doesn't fit cleanly into a DHIS2 Route's auth block | Spike this specifically at the start of Manager Phase 1 — if a Route genuinely can't carry what the resource server needs, that's a real finding to document, not something to discover mid-build |
| Backend phases 2–4 take a long time, manager plan goes stale | Manager Phase 0's re-check step exists specifically to catch this — don't start Manager Phase 1 or 2 work from a stale assumption about the API |
| Scope creep into reimplementing detection logic or alert state in the DHIS2 App itself | Out of scope by rule, same as FHIR Sync Console never reimplements FHIR mapping logic client-side |

---

## 6. First session checklist (once unblocked)

1. Re-read Outbreak Signal Service's `§8 Progress log` end to end — confirm
   the backend phase this manager phase actually depends on (Phase 2 for
   Manager Phase 1, Phase 4 for Manager Phase 2) is merged and tagged, and
   note every deviation recorded along the way.
2. Stand up a real running instance of Outbreak Signal Service (its own
   `docker compose up`) and call its real API directly (`curl`) before
   writing any manager code — confirm the Alerts API shape matches §3 above,
   or update this plan first.
3. Scaffold the DHIS2 App the same way as FHIR Sync Console
   (`d2-app-scripts`), reusing its Route-picker component rather than
   rebuilding it.
4. Spike the OAuth2-token-through-a-Route question first, before any UI
   work — this is the one real architectural unknown in this plan.
