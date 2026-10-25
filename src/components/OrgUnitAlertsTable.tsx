import { Button, CircularLoader, NoticeBox } from '@dhis2/ui'
import { useEffect, useState } from 'react'
import { listAlerts, type AlertSummary, type Severity } from '../lib/outbreakApi'
import i18n from '../i18n'

const SEVERITY_COLOR: Record<Severity, string> = { HIGH: '#c22a2a', MEDIUM: '#b95000', LOW: '#6e7a89' }

interface Props {
  routeId: string
  orgUnitId: number
  orgUnitName: string
  /** Carried over from whatever period filter was active on the main
   * table -- every other filter (status, algorithm, data element,
   * severity) is deliberately NOT carried over, since the point of this
   * view is "every algorithm's result for this org unit", not a narrower
   * slice of it. */
  from?: string
  to?: string
  onSelectAlert: (id: number) => void
  onClose: () => void
}

export function OrgUnitAlertsTable({ routeId, orgUnitId, orgUnitName, from, to, onSelectAlert, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<AlertSummary[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listAlerts(routeId, { orgUnitId, from, to, size: 200, sort: 'periodStart,asc' })
      .then((page) => {
        if (!cancelled) setRows(page.content)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [routeId, orgUnitId, from, to])

  return (
    <div style={{ border: '1px solid #dbe4ea', borderRadius: 6, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>
          {i18n.t('All algorithms -- {{orgUnit}}', { orgUnit: orgUnitName })}
          {(from || to) && (
            <span style={{ fontSize: 13, color: '#6e7a89', fontWeight: 'normal' }}>
              {' '}
              ({from ?? '...'} &rarr; {to ?? '...'})
            </span>
          )}
        </h3>
        <Button small onClick={onClose}>
          {i18n.t('Back')}
        </Button>
      </div>

      {loading && <CircularLoader small />}
      {error && (
        <NoticeBox error title={i18n.t('Could not load this org unit')}>
          {error}
        </NoticeBox>
      )}
      {!loading && !error && rows.length === 0 && (
        <p style={{ color: '#6e7a89', fontSize: 13 }}>{i18n.t('No alerts for this org unit in this period.')}</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #dbe4ea' }}>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Period')}</th>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Algorithm')}</th>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Data element')}</th>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Score')}</th>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Severity')}</th>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((alert) => (
              <tr
                key={alert.id}
                style={{ borderBottom: '1px solid #f0f3f5', cursor: 'pointer' }}
                onClick={() => onSelectAlert(alert.id)}
              >
                <td style={{ padding: '4px 8px' }}>{alert.periodStart}</td>
                <td style={{ padding: '4px 8px' }}>{alert.algorithm}</td>
                <td style={{ padding: '4px 8px' }}>{alert.dataElementName}</td>
                <td style={{ padding: '4px 8px' }}>
                  {alert.score} / {alert.threshold}
                </td>
                <td style={{ padding: '4px 8px', color: SEVERITY_COLOR[alert.severity] }}>{alert.severity}</td>
                <td style={{ padding: '4px 8px' }}>{alert.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
