import { useCallback, useEffect, useState } from 'react'
import { createNotificationRecipient, deleteNotificationRecipient, listNotificationRecipients, type NotificationRecipient } from '../lib/outbreakApi'

export interface UseNotificationRecipientsResult {
  loading: boolean
  error: string | null
  recipients: NotificationRecipient[]
  refresh: () => Promise<void>
  create: (orgUnitId: number, email: string) => Promise<boolean>
  remove: (id: number) => Promise<boolean>
}

export function useNotificationRecipients(routeId: string | null): UseNotificationRecipientsResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([])

  const refresh = useCallback(async () => {
    if (!routeId) return
    setLoading(true)
    setError(null)
    try {
      setRecipients(await listNotificationRecipients(routeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [routeId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(
    async (orgUnitId: number, email: string) => {
      if (!routeId) return false
      setError(null)
      try {
        await createNotificationRecipient(routeId, orgUnitId, email)
        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return false
      }
    },
    [routeId, refresh],
  )

  const remove = useCallback(
    async (id: number) => {
      if (!routeId) return false
      setError(null)
      try {
        await deleteNotificationRecipient(routeId, id)
        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return false
      }
    },
    [routeId, refresh],
  )

  return { loading, error, recipients, refresh, create, remove }
}
