import { Button, CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import type { UseAlertsResult } from '../hooks/useAlerts'
import type { AlertStatus } from '../lib/outbreakApi'
import i18n from '../i18n'

const STATUSES: AlertStatus[] = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']

const SEVERITY_COLOR: Record<string, string> = { HIGH: '#c22a2a', MEDIUM: '#b95000', LOW: '#6e7a89' }

interface Props {
  alerts: UseAlertsResult
  onSelect: (id: number) => void
}

export function AlertsTable({ alerts, onSelect }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-end' }}>
        <SingleSelectField
          label={i18n.t('Status')}
          clearable
          selected={alerts.filters.status ?? ''}
          onChange={({ selected }) =>
            alerts.setFilters({ ...alerts.filters, status: (selected as AlertStatus) || undefined, page: 0 })
          }
        >
          {STATUSES.map((status) => (
            <SingleSelectOption key={status} value={status} label={status} />
          ))}
        </SingleSelectField>
      </div>

      {alerts.loading && <CircularLoader small />}
      {alerts.error && (
        <NoticeBox error title={i18n.t('Could not load alerts')}>
          {alerts.error}
        </NoticeBox>
      )}

      {alerts.page && alerts.page.content.length === 0 && (
        <p style={{ color: '#6e7a89', fontSize: 13 }}>{i18n.t('No alerts match this filter.')}</p>
      )}

      {alerts.page && alerts.page.content.length > 0 && (
        <>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #dbe4ea' }}>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Org unit')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Data element')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Algorithm')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Period')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Score')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Severity')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {alerts.page.content.map((alert) => (
                <tr
                  key={alert.id}
                  style={{ borderBottom: '1px solid #f0f3f5', cursor: 'pointer' }}
                  onClick={() => onSelect(alert.id)}
                >
                  <td style={{ padding: '4px 8px' }}>{alert.orgUnitName}</td>
                  <td style={{ padding: '4px 8px' }}>{alert.dataElementName}</td>
                  <td style={{ padding: '4px 8px' }}>{alert.algorithm}</td>
                  <td style={{ padding: '4px 8px' }}>{alert.periodStart}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {alert.score} / {alert.threshold}
                  </td>
                  <td style={{ padding: '4px 8px', color: SEVERITY_COLOR[alert.severity] }}>{alert.severity}</td>
                  <td style={{ padding: '4px 8px' }}>{alert.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <Button
              small
              disabled={alerts.page.number === 0}
              onClick={() => alerts.setFilters({ ...alerts.filters, page: alerts.page!.number - 1 })}
            >
              {i18n.t('Previous')}
            </Button>
            <span style={{ fontSize: 12, color: '#6e7a89' }}>
              {i18n.t('Page {{page}} of {{total}} -- {{count}} alerts', {
                page: alerts.page.number + 1,
                total: Math.max(alerts.page.totalPages, 1),
                count: alerts.page.totalElements,
              })}
            </span>
            <Button
              small
              disabled={alerts.page.number + 1 >= alerts.page.totalPages}
              onClick={() => alerts.setFilters({ ...alerts.filters, page: alerts.page!.number + 1 })}
            >
              {i18n.t('Next')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
