// PRIMARY path: list existing wildcard Routes (GET /api/routes) and let the
// admin pick one -- set up via the official Route Manager app, or by this
// hook's own "create one for me" fallback below. Carried over from
// dhis2-fhir-sync-console's useFhirRoute.ts: the route-picking/creating
// logic there was never actually FHIR-specific, it just happened to live in
// that app first. See that file's own header comments for two real bugs
// already found and fixed here before this app ever ran once: a
// newly-created Route defaults to fully PRIVATE sharing, which this hook
// corrects right after creation (see ROUTE_SHARING_PAYLOAD below), and a
// Route's `auth` config is write-only -- a GET never returns it regardless
// of permissions, so granting read access on the route object itself never
// exposes the bearer token sitting in its auth config.

import { useDataEngine } from '@dhis2/app-runtime'
import { useCallback, useEffect, useState } from 'react'

export type RouteAuthType = 'none' | 'http-basic' | 'api-token' | 'api-headers' | 'api-query-params'

export interface RouteSummary {
  id: string
  name: string
  code: string | null
  url: string
}

interface RoutesListResponse {
  routes: { routes: { id: string; name: string; code: string | null; url: string }[] }
}

interface CreateRouteResponse {
  response: { uid: string }
}

// Read-only public access -- see header comment for why this is safe (a
// Route's auth config is never returned from a GET, regardless of who's
// asking) and why it's necessary (routes default to fully private).
const ROUTE_SHARING_PAYLOAD = {
  object: { publicAccess: 'r-------', userGroupAccesses: [], userAccesses: [] },
}

export interface CreateRouteInput {
  name: string
  code: string
  /** Outbreak Signal Service's own base URL, e.g.
   * "https://outbreak-signal.example.org" -- this hook appends "/**" itself,
   * since a wildcard route is required to proxy an arbitrary REST sub-path
   * (see README). */
  baseUrl: string
  authType: RouteAuthType
  /** Shape depends on authType: http-basic -> {username, password};
   * api-token -> {token}; api-headers -> {headers: {name: value}} (this app
   * uses this for "Authorization: Bearer <token>" -- see SettingsForm);
   * api-query-params -> {queryParams: {name: value}}. */
  authConfig?: Record<string, unknown>
  responseTimeoutSeconds: number
}

export interface UseRouteResult {
  loading: boolean
  error: string | null
  /** Existing routes whose url ends in "/**" -- the only kind this app can
   * actually use, since a non-wildcard route can't proxy an arbitrary
   * sub-path (alerts, sync, detection/run, series, ...). Non-wildcard routes
   * are filtered out here rather than shown and failing later. */
  wildcardRoutes: RouteSummary[]
  refresh: () => Promise<void>
  createRoute: (input: CreateRouteInput) => Promise<string>
}

export function useRoute(): UseRouteResult {
  const engine = useDataEngine()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wildcardRoutes, setWildcardRoutes] = useState<RouteSummary[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = (await engine.query({
        routes: { resource: 'routes', params: { fields: 'id,name,code,url', paging: 'false' } },
      })) as unknown as RoutesListResponse
      const all = response.routes.routes ?? []
      setWildcardRoutes(all.filter((r) => r.url.endsWith('/**')))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [engine])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createRoute = useCallback(
    async (input: CreateRouteInput): Promise<string> => {
      const payload: Record<string, unknown> = {
        name: input.name,
        code: input.code,
        url: `${input.baseUrl.replace(/\/+$/, '')}/**`,
        responseTimeoutSeconds: input.responseTimeoutSeconds,
      }
      if (input.authType !== 'none') {
        payload.auth = { type: input.authType, ...input.authConfig }
      }
      const response = (await engine.mutate({
        resource: 'routes',
        type: 'create',
        data: payload,
      })) as unknown as CreateRouteResponse
      const routeId = response.response.uid
      await engine.mutate({
        resource: `sharing?type=route&id=${routeId}`,
        type: 'create',
        data: ROUTE_SHARING_PAYLOAD,
      })
      await refresh()
      return routeId
    },
    [engine, refresh],
  )

  return { loading, error, wildcardRoutes, refresh, createRoute }
}
