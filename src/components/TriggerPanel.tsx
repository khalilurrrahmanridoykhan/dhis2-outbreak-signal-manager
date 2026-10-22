import { Button, NoticeBox } from '@dhis2/ui'
import type { UseTriggerResult } from '../hooks/useTrigger'
import i18n from '../i18n'

interface Props {
  routeId: string
  trigger: UseTriggerResult
  onSyncComplete: () => void
  onDetectionComplete: () => void
}

export function TriggerPanel({ routeId, trigger, onSyncComplete, onDetectionComplete }: Props) {
  async function handleSync() {
    await trigger.runSync(routeId)
    onSyncComplete()
  }

  async function handleDetection() {
    await trigger.runDetection(routeId)
    onDetectionComplete()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={handleSync} loading={trigger.syncing}>
          {i18n.t('Run sync')}
        </Button>
        <Button onClick={handleDetection} loading={trigger.detecting}>
          {i18n.t('Run detection')}
        </Button>
      </div>

      {trigger.syncError && (
        <NoticeBox error title={i18n.t('Sync failed')}>
          {trigger.syncError}
        </NoticeBox>
      )}
      {trigger.syncResult && (
        <NoticeBox valid title={i18n.t('Sync finished')}>
          {i18n.t('{{orgUnits}} org units, {{weeks}} weeks requested per data element.', {
            orgUnits: trigger.syncResult.orgUnitsCreated,
            weeks: trigger.syncResult.weeksRequested,
          })}
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {trigger.syncResult.dataElements.map((de) => (
              <li key={de.uid}>
                {de.name}: {de.succeeded ? i18n.t('{{count}} observations upserted', { count: de.observationsUpserted }) : de.errorMessage}
              </li>
            ))}
          </ul>
        </NoticeBox>
      )}

      {trigger.detectionError && (
        <NoticeBox error title={i18n.t('Detection run failed')}>
          {trigger.detectionError}
        </NoticeBox>
      )}
      {trigger.detectionResult && (
        <NoticeBox valid title={i18n.t('Detection run finished')}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {trigger.detectionResult.runs.map((run) => (
              <li key={run.algorithm}>
                {run.algorithm}: {i18n.t('{{evaluated}} series evaluated, {{created}} alerts created', {
                  evaluated: run.seriesEvaluated,
                  created: run.alertsCreated,
                })}
              </li>
            ))}
          </ul>
        </NoticeBox>
      )}
    </div>
  )
}
