import { useCallback, useEffect, useState } from 'react'
import { listAlerts, type AlertFilters, type Page, type AlertSummary } from '../lib/outbreakApi'

interface State {
  loading: boolean
  error: string | null
  page: Page<AlertSummary> | null
}

export interface UseAlertsResult extends State {
  filters: AlertFilters
  setFilters: (filters: AlertFilters) => void
  refresh: () => Promise<void>
}

const DEFAULT_FILTERS: AlertFilters = { page: 0, size: 20 }

export function useAlerts(routeId: string | null): UseAlertsResult {
  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_FILTERS)
  const [state, setState] = useState<State>({ loading: false, error: null, page: null })

  const refresh = useCallback(async () => {
    if (!routeId) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const page = await listAlerts(routeId, filters)
      setState({ loading: false, error: null, page })
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : String(error), page: null })
    }
  }, [routeId, filters])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, filters, setFilters, refresh }
}
