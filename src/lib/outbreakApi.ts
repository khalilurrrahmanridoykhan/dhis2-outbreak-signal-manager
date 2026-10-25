// Every call goes through this DHIS2 instance's own /api/routes/{id}/run,
// never fetch() straight to Outbreak Signal Service -- see README for why
// (the same March 2026 App Hub guideline on external credentials that
// dhis2-fhir-sync-console was built around). Deliberately not using
// @dhis2/app-runtime's engine.query()/engine.mutate() here: that sibling
// app found a real live bug where @dhis2/data-engine's fetchData() only
// calls response.json() when Content-Type is EXACTLY 'application/json'
// (strict equality) and silently returns an unparsed Blob otherwise. This
// service always sends plain 'application/json' (confirmed live against a
// real running instance earlier in this build), so engine.query() would
// likely be fine here too -- but fetch() + manual JSON parsing, with the
// error body read on a non-OK response, is the one tested-and-confirmed
// path, and failure handling (409's from/to, 403, 401) is simpler to get
// right this way regardless.

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface AlertSummary {
  id: number
  seriesId: number
  orgUnitId: number
  orgUnitName: string
  dataElementName: string
  algorithm: string
  periodStart: string
  score: string
  threshold: string
  severity: Severity
  status: AlertStatus
  version: number
  createdAt: string
}

export interface ObservationSummary {
  weekStart: string
  value: string
  fetchedAt: string
}

export interface SeriesSummary {
  id: number
  orgUnitId: number
  orgUnitName: string
  dhis2DataElementUid: string
  name: string
  frequency: string
}

export interface AlertEventSummary {
  fromStatus: AlertStatus
  toStatus: AlertStatus
  note: string | null
  actor: string
  createdAt: string
}

export interface AlertDetail {
  alert: AlertSummary
  history: AlertEventSummary[]
}

export interface NotificationRecipient {
  id: number
  orgUnitId: number
  email: string
  createdAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface AlertFilters {
  status?: AlertStatus
  algorithm?: string
  orgUnitId?: number
  dataElement?: string
  severity?: Severity
  from?: string
  to?: string
  /** Spring Data's own "property,direction" shape, e.g. "score,desc". */
  sort?: string
  page?: number
  size?: number
}

export interface SyncDataElementResult {
  uid: string
  name: string
  succeeded: boolean
  observationsUpserted: number
  errorMessage: string | null
}

export interface SyncResult {
  orgUnitsCreated: number
  weeksRequested: number
  dataElements: SyncDataElementResult[]
}

export interface DetectionRunResult {
  algorithm: string
  seriesEvaluated: number
  alertsCreated: number
}

export interface DetectionSummary {
  runs: DetectionRunResult[]
}

/** RFC 9457 problem response -- the backend's own shape (see its README).
 * `from`/`to` only appear on a 409 for an illegal status transition. */
export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  from?: string
  to?: string
  [extension: string]: unknown
}

export class OutbreakApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetail | null,
  ) {
    super(problem?.detail ?? problem?.title ?? `Outbreak Signal Service request failed: ${status}`)
  }
}

function runUrl(routeId: string, subPath: string, params: Record<string, string | number | undefined>): string {
  const path = subPath ? `/api/routes/${routeId}/run/${subPath}` : `/api/routes/${routeId}/run`
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])),
  ).toString()
  return `${window.location.origin}${path}${query ? `?${query}` : ''}`
}

async function request<T>(
  routeId: string,
  method: 'GET' | 'POST' | 'DELETE',
  subPath: string,
  params: Record<string, string | number | undefined> = {},
  body?: unknown,
): Promise<T> {
  const response = await fetch(runUrl(routeId, subPath, params), {
    method,
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const parsed = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    throw new OutbreakApiError(response.status, parsed as ProblemDetail | null)
  }
  return parsed as T
}

export function listAlerts(routeId: string, filters: AlertFilters): Promise<Page<AlertSummary>> {
  return request<Page<AlertSummary>>(routeId, 'GET', 'api/v1/alerts', {
    status: filters.status,
    algorithm: filters.algorithm,
    orgUnitId: filters.orgUnitId,
    dataElement: filters.dataElement,
    severity: filters.severity,
    from: filters.from,
    to: filters.to,
    sort: filters.sort,
    page: filters.page ?? 0,
    size: filters.size ?? 20,
  })
}

/** All series, unpaged -- used to build the Org unit / Data element filter
 * options from real values rather than a hand-maintained list. ~500 series
 * in the reference deployment, small enough to fetch in one call. */
export function listAllSeries(routeId: string): Promise<SeriesSummary[]> {
  return request<Page<SeriesSummary>>(routeId, 'GET', 'api/v1/series', { size: 2000 }).then((page) => page.content)
}

export function getObservations(routeId: string, seriesId: number): Promise<ObservationSummary[]> {
  return request<ObservationSummary[]>(routeId, 'GET', `api/v1/series/${seriesId}/observations`)
}

export function listNotificationRecipients(routeId: string, orgUnitId?: number): Promise<NotificationRecipient[]> {
  return request<NotificationRecipient[]>(routeId, 'GET', 'api/v1/notification-recipients', { orgUnitId })
}

export function createNotificationRecipient(routeId: string, orgUnitId: number, email: string): Promise<NotificationRecipient> {
  return request<NotificationRecipient>(routeId, 'POST', 'api/v1/notification-recipients', {}, { orgUnitId, email })
}

export function deleteNotificationRecipient(routeId: string, id: number): Promise<void> {
  return request<void>(routeId, 'DELETE', `api/v1/notification-recipients/${id}`)
}

export function getAlert(routeId: string, id: number): Promise<AlertDetail> {
  return request<AlertDetail>(routeId, 'GET', `api/v1/alerts/${id}`)
}

export function acknowledgeAlert(routeId: string, id: number): Promise<AlertSummary> {
  return request<AlertSummary>(routeId, 'POST', `api/v1/alerts/${id}/acknowledge`)
}

export function resolveAlert(routeId: string, id: number): Promise<AlertSummary> {
  return request<AlertSummary>(routeId, 'POST', `api/v1/alerts/${id}/resolve`)
}

export function dismissAlert(routeId: string, id: number, reason: string): Promise<AlertSummary> {
  return request<AlertSummary>(routeId, 'POST', `api/v1/alerts/${id}/dismiss`, {}, { reason })
}

export function triggerSync(routeId: string): Promise<SyncResult> {
  return request<SyncResult>(routeId, 'POST', 'api/v1/sync')
}

export function triggerDetectionRun(routeId: string): Promise<DetectionSummary> {
  return request<DetectionSummary>(routeId, 'POST', 'api/v1/detection/run')
}
