# Outbreak Signal Manager

A DHIS2 App that gives admins a browser-based way to configure, trigger, and review the statistical surveillance alerts raised by [Outbreak Signal Service](https://github.com/khalilurrrahmanridoykhan/outbreak-signal-service) — an EARS/CUSUM aberration-detection engine that runs against weekly DHIS2 surveillance data.

This app does not detect anything itself. It is a control panel for an engine that already exists, the same relationship [FHIR Sync Console](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-sync-console) has to [its own CLI](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-aggregate-pipeline): DHIS2 makes the outbound call server-side through a DHIS2 Route, so no credential for the external service is ever held client-side.

## Status: not started

Outbreak Signal Service is currently at **Phase 1 of 7** of its own build (scaffold and three database tables — `org_unit`, `series`, `observation` — plus the public repository setup). It has no DHIS2 sync, no detection engine, and no Alerts REST API yet.

This app cannot be meaningfully built against a backend that has nothing to configure and nothing to show. The full plan — including exactly which phase of this app depends on which phase of the backend, and why — is in [`docs/PLAN.md`](docs/PLAN.md). Build work on this repository starts once that document's own gating conditions are met, not on a calendar date.

## What it will do, once unblocked

| Screen | What it does |
|---|---|
| Settings | Pick or create the Route to Outbreak Signal Service. Map DHIS2 datasets/data elements to the backend's `series`. |
| Trigger | Manually run a sync or a detection pass, with the resulting run's status shown inline. |
| Alert list | Browse alerts, filterable by status, org unit, algorithm, and date. |
| Alert detail | An alert's full event history, with acknowledge/resolve/dismiss actions. |
| Review history | Past detection runs — which algorithm, which parameters, when. |

## License

[MIT](LICENSE)
