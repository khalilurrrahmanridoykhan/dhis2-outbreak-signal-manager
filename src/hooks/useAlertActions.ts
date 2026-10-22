import { useCallback, useState } from 'react'
import { acknowledgeAlert, dismissAlert, resolveAlert, OutbreakApiError, type AlertSummary } from '../lib/outbreakApi'

export interface UseAlertActionsResult {
  busy: boolean
  /** Set on a failed action -- a 409 (illegal transition) carries the
   * attempted `from`/`to` in its own error.problem, which the caller
   * should show verbatim rather than a generic message, per the backend's
   * own documented behaviour (see outbreak-signal-service's README: "An
   * illegal move ... returns 409 naming the attempted transition"). */
  error: OutbreakApiError | Error | null
  acknowledge: (routeId: string, id: number) => Promise<AlertSummary | null>
  resolve: (routeId: string, id: number) => Promise<AlertSummary | null>
  dismiss: (routeId: string, id: number, reason: string) => Promise<AlertSummary | null>
}

export function useAlertActions(): UseAlertActionsResult {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<OutbreakApiError | Error | null>(null)

  async function run(action: () => Promise<AlertSummary>): Promise<AlertSummary | null> {
    setBusy(true)
    setError(null)
    try {
      return await action()
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setBusy(false)
    }
  }

  const acknowledge = useCallback((routeId: string, id: number) => run(() => acknowledgeAlert(routeId, id)), [])
  const resolve = useCallback((routeId: string, id: number) => run(() => resolveAlert(routeId, id)), [])
  const dismiss = useCallback((routeId: string, id: number, reason: string) => run(() => dismissAlert(routeId, id, reason)), [])

  return { busy, error, acknowledge, resolve, dismiss }
}
