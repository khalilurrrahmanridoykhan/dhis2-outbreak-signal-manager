# Outbreak Signal Manager

A DHIS2 App that gives admins a browser-based way to configure, trigger, and review the statistical surveillance alerts raised by [Outbreak Signal Service](https://github.com/khalilurrrahmanridoykhan/outbreak-signal-service) — an EARS/CUSUM aberration-detection engine that runs against weekly DHIS2 surveillance data.

This app does not detect anything itself. It is a control panel for an engine that already exists, the same relationship [FHIR Sync Console](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-sync-console) has to [its own CLI](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-aggregate-pipeline): DHIS2 makes the outbound call server-side through a DHIS2 Route, so no credential for the external service is ever held client-side.

## Status: built and live-verified against a real DHIS2 instance

Outbreak Signal Service itself is now **done — all 7 phases, `v0.1.0` released**, which is what unblocked this app (see [`docs/PLAN.md`](docs/PLAN.md) for the original gating plan). Settings (Route picker/creator), Trigger (sync + detection run), and Alerts (browse, filter, paginate, and acknowledge/resolve/dismiss with full review history) are all built, compile clean (`npm run build`), and have now been proven end to end against a real, locally running DHIS2 2.44 instance (the official Sierra Leone demo database) with a real Route to a real, separately running Outbreak Signal Service -- not two things that merely both build.

**What was actually run, for real:** a Route created against `http://app:8080/**` (Outbreak Signal Service on the same Docker network, reached by its internal service name, never a public address), with a real Keycloak-issued bearer token. Through that Route: `GET api/v1/alerts?status=OPEN&size=3` returned real paginated alert data (957 real open alerts, from the real detection run exercised earlier in this build), and `POST api/v1/alerts/83/acknowledge` changed that alert's real status from `OPEN` to `ACKNOWLEDGED` (`version` incremented 0 to 1) -- the same request shape, method, and URL pattern `src/lib/outbreakApi.ts` itself uses. The built app bundle was also installed into that DHIS2 instance (`POST /api/apps`) and its `index.html` confirmed to serve correctly with the right asset references. A real browser click-through inside DHIS2's own UI was not available in the environment this was verified from, so that one last step is still open -- everything the browser's JavaScript would call has been exercised directly, by the exact method/URL/header shape it uses, but not by literally clicking the buttons.

Two real, non-obvious things found while actually standing up a test DHIS2 instance for this, neither a bug in this app's own code:

- **DHIS2 Routes default to allowing only `https://*` origins** (`route.remote_servers_allowed` in `dhis.conf`). A Route to a plain-`http` internal Docker service name (exactly the kind of address this app's own README recommends for reaching a self-hosted backend) is rejected with `409 Route URL is not permitted` until a server administrator explicitly adds that origin to the allowlist. Worth knowing before assuming a Route "should just work."
- **The Sierra Leone demo database's own "Superuser" role does not actually carry the `ALL` authority**, nor either of the two Route-management authorities (`F_ROUTE_PUBLIC_ADD`/`F_ROUTE_PRIVATE_ADD`) -- confirmed by reading its real authority list from a running instance, not assumed from its name. `useCurrentUserAuthorities.ts`'s own `canCreateRoutes` check already treats "looks like an admin" and "actually has the authority" as different things for exactly this reason.

One real architectural finding, confirmed live against the backend's own default local Keycloak profile while building this: Outbreak Signal Service's real JWTs expire in 5 minutes. A DHIS2 Route's bearer-token auth config holds one fixed string and cannot refresh itself, so this app can only ever be as fresh as whatever token was last pasted into the Route. Workable for a service-account token configured for a long lifetime at the identity-provider level, with manual rotation when it does expire -- the same accepted limitation [FHIR Sync Console](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-sync-console) already documents for its own static tokens, not a new problem this app invented.

There is also no `series`-mapping screen, unlike the original plan's assumption: `GET /api/v1/series` is read-only (Outbreak Signal Service decides what it syncs from its own `outbreak.dhis2.*` configuration, not from a mapping built in a DHIS2 App), so Settings only needs the Route.

## Screens

| Screen | What it does |
|---|---|
| Settings | Pick or create the Route to Outbreak Signal Service. |
| Trigger | Run a sync or a detection pass on demand, with the result shown inline. |
| Alerts | Browse alerts filterable by status, paginated; open one to see its full review history and acknowledge/resolve/dismiss it (dismiss requires a reason; an illegal transition surfaces the backend's own 409, not a generic error). |

## License

[MIT](LICENSE)
