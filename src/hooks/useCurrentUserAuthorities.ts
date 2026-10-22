import { useDataQuery } from '@dhis2/app-runtime'

const query = {
  me: {
    resource: 'me',
    params: { fields: 'username,authorities' },
  },
}

interface MeResponse {
  me: { username: string; authorities: string[] }
}

export interface CurrentUserAuthorities {
  loading: boolean
  error: string | null
  username: string
  /** Can create a Route (ALL, or one of the two real create authorities the
   * Route schema actually exposes -- confirmed live, not guessed, the same
   * way dhis2-fhir-sync-console's own useCurrentUserAuthorities.ts was:
   * GET /api/schemas/route.json names F_ROUTE_PUBLIC_ADD and
   * F_ROUTE_PRIVATE_ADD, not a literal 'Route' authority. This is only a
   * client-side UI check controlling whether the "create one for me"
   * fallback is offered -- the real, authoritative check is always the
   * server's own 403 on POST /api/routes. */
  canCreateRoutes: boolean
}

export function useCurrentUserAuthorities(): CurrentUserAuthorities {
  const { loading, error, data } = useDataQuery<MeResponse>(query)
  const authorities = data?.me.authorities ?? []
  return {
    loading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    username: data?.me.username ?? '',
    canCreateRoutes:
      authorities.includes('ALL') || authorities.includes('F_ROUTE_PUBLIC_ADD') || authorities.includes('F_ROUTE_PRIVATE_ADD'),
  }
}
