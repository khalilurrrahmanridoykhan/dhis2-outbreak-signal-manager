# Outbreak Signal Manager

A DHIS2 App that gives admins a browser-based way to configure, trigger, and review the statistical surveillance alerts raised by [Outbreak Signal Service](https://github.com/khalilurrrahmanridoykhan/outbreak-signal-service) — an EARS/CUSUM aberration-detection engine that runs against weekly DHIS2 surveillance data.

This app does not detect anything itself. It is a control panel for an engine that already exists, the same relationship [FHIR Sync Console](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-sync-console) has to [its own CLI](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-aggregate-pipeline): DHIS2 makes the outbound call server-side through a DHIS2 Route, so no credential for the external service is ever held client-side.

## Status: built locally, not yet live-verified

Outbreak Signal Service itself is now **done — all 7 phases, `v0.1.0` released**, which is what unblocked this app (see [`docs/PLAN.md`](docs/PLAN.md) for the original gating plan). Settings (Route picker/creator), Trigger (sync + detection run), and Alerts (browse, filter, paginate, and acknowledge/resolve/dismiss with full review history) are all built and compile clean (`npm run build`).

**Not yet done:** a real end-to-end run against an actual DHIS2 instance with a real Route to a real running Outbreak Signal Service. That needs a DHIS2 instance that can reach the backend over the network (not just `localhost` on one machine — see the Route's own base-URL requirement below), which this repository doesn't assume access to on its own. Every other app in this portfolio treats that live click-through as the real "done," not a clean build — this one isn't there yet.

One real architectural finding, confirmed live against the backend's own default local Keycloak profile while building this: Outbreak Signal Service's real JWTs expire in 5 minutes. A DHIS2 Route's bearer-token auth config holds one fixed string and cannot refresh itself, so this app can only ever be as fresh as whatever token was last pasted into the Route. Workable for a service-account token configured for a long lifetime at the identity-provider level, with manual rotation when it does expire — the same accepted limitation [FHIR Sync Console](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-sync-console) already documents for its own static tokens, not a new problem this app invented.

There is also no `series`-mapping screen, unlike the original plan's assumption: `GET /api/v1/series` is read-only (Outbreak Signal Service decides what it syncs from its own `outbreak.dhis2.*` configuration, not from a mapping built in a DHIS2 App), so Settings only needs the Route.

## Screens

| Screen | What it does |
|---|---|
| Settings | Pick or create the Route to Outbreak Signal Service. |
| Trigger | Run a sync or a detection pass on demand, with the result shown inline. |
| Alerts | Browse alerts filterable by status, paginated; open one to see its full review history and acknowledge/resolve/dismiss it (dismiss requires a reason; an illegal transition surfaces the backend's own 409, not a generic error). |

## License

[MIT](LICENSE)
