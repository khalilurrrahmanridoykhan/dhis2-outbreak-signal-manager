import { useCallback, useState } from 'react'
import { triggerDetectionRun, triggerSync, type DetectionSummary, type SyncResult } from '../lib/outbreakApi'

interface State {
  syncing: boolean
  syncError: string | null
  syncResult: SyncResult | null
  detecting: boolean
  detectionError: string | null
  detectionResult: DetectionSummary | null
}

export interface UseTriggerResult extends State {
  runSync: (routeId: string) => Promise<void>
  runDetection: (routeId: string) => Promise<void>
}

const INITIAL_STATE: State = {
  syncing: false,
  syncError: null,
  syncResult: null,
  detecting: false,
  detectionError: null,
  detectionResult: null,
}

export function useTrigger(): UseTriggerResult {
  const [state, setState] = useState<State>(INITIAL_STATE)

  const runSync = useCallback(async (routeId: string) => {
    setState((prev) => ({ ...prev, syncing: true, syncError: null }))
    try {
      const syncResult = await triggerSync(routeId)
      setState((prev) => ({ ...prev, syncing: false, syncResult }))
    } catch (error) {
      setState((prev) => ({ ...prev, syncing: false, syncError: error instanceof Error ? error.message : String(error) }))
    }
  }, [])

  const runDetection = useCallback(async (routeId: string) => {
    setState((prev) => ({ ...prev, detecting: true, detectionError: null }))
    try {
      const detectionResult = await triggerDetectionRun(routeId)
      setState((prev) => ({ ...prev, detecting: false, detectionResult }))
    } catch (error) {
      setState((prev) => ({ ...prev, detecting: false, detectionError: error instanceof Error ? error.message : String(error) }))
    }
  }, [])

  return { ...state, runSync, runDetection }
}
