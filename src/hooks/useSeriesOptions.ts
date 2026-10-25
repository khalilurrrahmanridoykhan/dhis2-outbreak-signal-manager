import { useEffect, useState } from 'react'
import { listAllSeries } from '../lib/outbreakApi'

export interface OrgUnitOption {
  id: number
  name: string
}

export interface UseSeriesOptionsResult {
  loading: boolean
  error: string | null
  orgUnits: OrgUnitOption[]
  dataElements: string[]
}

/** Distinct org units and data element names, derived from the real series
 * list rather than hand-maintained -- a filter dropdown built from values
 * that don't actually exist is worse than no dropdown at all. */
export function useSeriesOptions(routeId: string | null): UseSeriesOptionsResult {
  const [state, setState] = useState<UseSeriesOptionsResult>({ loading: true, error: null, orgUnits: [], dataElements: [] })

  useEffect(() => {
    if (!routeId) return
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))
    listAllSeries(routeId)
      .then((series) => {
        if (cancelled) return
        const orgUnitsById = new Map<number, string>()
        const dataElementNames = new Set<string>()
        for (const s of series) {
          orgUnitsById.set(s.orgUnitId, s.orgUnitName)
          dataElementNames.add(s.name)
        }
        const orgUnits = [...orgUnitsById.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setState({ loading: false, error: null, orgUnits, dataElements: [...dataElementNames].sort() })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ loading: false, error: error instanceof Error ? error.message : String(error), orgUnits: [], dataElements: [] })
      })
    return () => {
      cancelled = true
    }
  }, [routeId])

  return state
}
