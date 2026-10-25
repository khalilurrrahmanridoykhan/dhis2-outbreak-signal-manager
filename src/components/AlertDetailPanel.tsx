import { Button, CircularLoader, InputField, NoticeBox } from '@dhis2/ui'
import { useCallback, useEffect, useState } from 'react'
import { useAlertActions } from '../hooks/useAlertActions'
import { useObservations } from '../hooks/useObservations'
import i18n from '../i18n'
import { getAlert, OutbreakApiError, type AlertDetail, type AlertSummary, type Severity } from '../lib/outbreakApi'
import { ObservationChart } from './ObservationChart'

const SEVERITY_COLOR: Record<Severity, string> = { HIGH: '#c22a2a', MEDIUM: '#b95000', LOW: '#6e7a89' }

interface Props {
  routeId: string
  alertId: number
  onClose: () => void
  onChanged: () => void
}

export function AlertDetailPanel({ routeId, alertId, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<AlertDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dismissReason, setDismissReason] = useState('')
  const [showDismiss, setShowDismiss] = useState(false)
  const actions = useAlertActions()
  const observations = useObservations(routeId, detail?.alert.seriesId ?? null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setDetail(await getAlert(routeId, alertId))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [routeId, alertId])

  useEffect(() => {
    load()
  }, [load])

  async function afterAction(updated: AlertSummary | null) {
    if (!updated) return
    setShowDismiss(false)
    setDismissReason('')
    await load()
    onChanged()
  }

  if (loading) return <CircularLoader small />
  if (loadError) {
    return (
      <NoticeBox error title={i18n.t('Could not load this alert')}>
        {loadError}
      </NoticeBox>
    )
  }
  if (!detail) return null

  const { alert, history } = detail
  const canReview = alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED'

  return (
    <div style={{ border: '1px solid #dbe4ea', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>
          {alert.orgUnitName} -- {alert.dataElementName}
        </h3>
        <Button small onClick={onClose}>
          {i18n.t('Close')}
        </Button>
      </div>

      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '4px 12px', fontSize: 13, margin: 0 }}>
        <dt style={{ color: '#6e7a89' }}>{i18n.t('Algorithm')}</dt>
        <dd style={{ margin: 0 }}>{alert.algorithm}</dd>
        <dt style={{ color: '#6e7a89' }}>{i18n.t('Period')}</dt>
        <dd style={{ margin: 0 }}>{alert.periodStart}</dd>
        <dt style={{ color: '#6e7a89' }}>{i18n.t('Score / threshold')}</dt>
        <dd style={{ margin: 0 }}>
          {alert.score} / {alert.threshold}
        </dd>
        <dt style={{ color: '#6e7a89' }}>{i18n.t('Severity')}</dt>
        <dd style={{ margin: 0 }}>{alert.severity}</dd>
        <dt style={{ color: '#6e7a89' }}>{i18n.t('Status')}</dt>
        <dd style={{ margin: 0 }}>{alert.status}</dd>
      </dl>

      <div>
        <h4 style={{ margin: '0 0 8px' }}>{i18n.t('Weekly values over time')}</h4>
        {observations.loading && <CircularLoader small />}
        {observations.error && (
          <NoticeBox error title={i18n.t('Could not load the chart')}>
            {observations.error}
          </NoticeBox>
        )}
        {!observations.loading && !observations.error && (
          <ObservationChart
            observations={observations.observations}
            highlightWeekStart={alert.periodStart}
            threshold={Number(alert.threshold)}
            color={SEVERITY_COLOR[alert.severity]}
          />
        )}
      </div>

      {actions.error && (
        <NoticeBox error title={i18n.t('Action failed')}>
          {actions.error instanceof OutbreakApiError && actions.error.status === 409 && actions.error.problem?.from
            ? i18n.t('Cannot go from {{from}} to {{to}} -- {{detail}}', {
                from: actions.error.problem.from,
                to: actions.error.problem.to,
                detail: actions.error.problem.detail ?? '',
              })
            : actions.error.message}
        </NoticeBox>
      )}

      {canReview && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {alert.status === 'OPEN' && (
            <Button small loading={actions.busy} onClick={async () => afterAction(await actions.acknowledge(routeId, alert.id))}>
              {i18n.t('Acknowledge')}
            </Button>
          )}
          <Button small loading={actions.busy} onClick={async () => afterAction(await actions.resolve(routeId, alert.id))}>
            {i18n.t('Resolve')}
          </Button>
          <Button small destructive onClick={() => setShowDismiss(!showDismiss)}>
            {i18n.t('Dismiss')}
          </Button>
        </div>
      )}

      {showDismiss && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <InputField
            label={i18n.t('Reason (required)')}
            value={dismissReason}
            onChange={({ value }) => setDismissReason(value ?? '')}
          />
          <Button
            small
            destructive
            disabled={!dismissReason.trim()}
            loading={actions.busy}
            onClick={async () => afterAction(await actions.dismiss(routeId, alert.id, dismissReason.trim()))}
          >
            {i18n.t('Confirm dismiss')}
          </Button>
        </div>
      )}

      <div>
        <h4 style={{ margin: '0 0 8px' }}>{i18n.t('Review history')}</h4>
        {history.length === 0 ? (
          <p style={{ color: '#6e7a89', fontSize: 13 }}>{i18n.t('Not reviewed yet.')}</p>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #dbe4ea' }}>
                <th style={{ padding: '4px 8px' }}>{i18n.t('When')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Change')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('By')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Note')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((event, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f3f5' }}>
                  <td style={{ padding: '4px 8px' }}>{new Date(event.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {event.fromStatus} &rarr; {event.toStatus}
                  </td>
                  <td style={{ padding: '4px 8px' }}>{event.actor}</td>
                  <td style={{ padding: '4px 8px' }}>{event.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
