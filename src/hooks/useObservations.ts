import { useEffect, useState } from 'react'
import { getObservations, type ObservationSummary } from '../lib/outbreakApi'

export interface UseObservationsResult {
  loading: boolean
  error: string | null
  observations: ObservationSummary[]
}

export function useObservations(routeId: string | null, seriesId: number | null): UseObservationsResult {
  const [state, setState] = useState<UseObservationsResult>({ loading: true, error: null, observations: [] })

  useEffect(() => {
    if (!routeId || seriesId === null) return
    let cancelled = false
    setState({ loading: true, error: null, observations: [] })
    getObservations(routeId, seriesId)
      .then((observations) => {
        if (!cancelled) setState({ loading: false, error: null, observations })
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: error instanceof Error ? error.message : String(error), observations: [] })
      })
    return () => {
      cancelled = true
    }
  }, [routeId, seriesId])

  return state
}
