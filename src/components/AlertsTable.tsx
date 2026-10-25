import { Button, CircularLoader, InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import { useObservations } from '../hooks/useObservations'
import type { UseAlertsResult } from '../hooks/useAlerts'
import type { UseSeriesOptionsResult } from '../hooks/useSeriesOptions'
import type { AlertStatus, AlertSummary, Severity } from '../lib/outbreakApi'
import { Sparkline } from './Sparkline'
import i18n from './../i18n'

const STATUSES: AlertStatus[] = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']
const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH']
const ALGORITHMS = ['MOVING_AVERAGE_Z', 'EARS_C1', 'EARS_C2', 'EARS_C3', 'CUSUM']

const SEVERITY_COLOR: Record<Severity, string> = { HIGH: '#c22a2a', MEDIUM: '#b95000', LOW: '#6e7a89' }

const SORT_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: i18n.t('Period (default)') },
  { value: 'score,desc', label: i18n.t('Highest score first') },
  { value: 'score,asc', label: i18n.t('Lowest score first') },
]

interface Props {
  routeId: string
  alerts: UseAlertsResult
  seriesOptions: UseSeriesOptionsResult
  onSelect: (id: number) => void
}

export function AlertsTable({ routeId, alerts, seriesOptions, onSelect }: Props) {
  const f = alerts.filters

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <SingleSelectField
          label={i18n.t('Status')}
          clearable
          selected={f.status ?? ''}
          onChange={({ selected }) => alerts.setFilters({ ...f, status: (selected as AlertStatus) || undefined, page: 0 })}
        >
          {STATUSES.map((s) => (
            <SingleSelectOption key={s} value={s} label={s} />
          ))}
        </SingleSelectField>

        <SingleSelectField
          label={i18n.t('Org unit')}
          clearable
          selected={f.orgUnitId ? String(f.orgUnitId) : ''}
          onChange={({ selected }) => alerts.setFilters({ ...f, orgUnitId: selected ? Number(selected) : undefined, page: 0 })}
        >
          {seriesOptions.orgUnits.map((ou) => (
            <SingleSelectOption key={ou.id} value={String(ou.id)} label={ou.name} />
          ))}
        </SingleSelectField>

        <SingleSelectField
          label={i18n.t('Algorithm')}
          clearable
          selected={f.algorithm ?? ''}
          onChange={({ selected }) => alerts.setFilters({ ...f, algorithm: selected || undefined, page: 0 })}
        >
          {ALGORITHMS.map((a) => (
            <SingleSelectOption key={a} value={a} label={a} />
          ))}
        </SingleSelectField>

        <SingleSelectField
          label={i18n.t('Data element')}
          clearable
          selected={f.dataElement ?? ''}
          onChange={({ selected }) => alerts.setFilters({ ...f, dataElement: selected || undefined, page: 0 })}
        >
          {seriesOptions.dataElements.map((name) => (
            <SingleSelectOption key={name} value={name} label={name} />
          ))}
        </SingleSelectField>

        <SingleSelectField
          label={i18n.t('Severity')}
          clearable
          selected={f.severity ?? ''}
          onChange={({ selected }) => alerts.setFilters({ ...f, severity: (selected as Severity) || undefined, page: 0 })}
        >
          {SEVERITIES.map((s) => (
            <SingleSelectOption key={s} value={s} label={s} />
          ))}
        </SingleSelectField>

        <InputField
          label={i18n.t('Period from')}
          type="date"
          value={f.from ?? ''}
          onChange={({ value }) => alerts.setFilters({ ...f, from: value || undefined, page: 0 })}
        />
        <InputField
          label={i18n.t('Period to')}
          type="date"
          value={f.to ?? ''}
          onChange={({ value }) => alerts.setFilters({ ...f, to: value || undefined, page: 0 })}
        />

        <SingleSelectField
          label={i18n.t('Sort')}
          selected={f.sort ?? ''}
          onChange={({ selected }) => alerts.setFilters({ ...f, sort: selected || undefined, page: 0 })}
        >
          {SORT_OPTIONS.map((opt) => (
            <SingleSelectOption key={opt.label} value={opt.value ?? ''} label={opt.label} />
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
                <th style={{ padding: '4px 8px' }}>{i18n.t('Trend')}</th>
                <th style={{ padding: '4px 8px' }}>{i18n.t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {alerts.page.content.map((alert) => (
                <AlertRow key={alert.id} routeId={routeId} alert={alert} onSelect={onSelect} />
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <Button
              small
              disabled={alerts.page.number === 0}
              onClick={() => alerts.setFilters({ ...f, page: alerts.page!.number - 1 })}
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
              onClick={() => alerts.setFilters({ ...f, page: alerts.page!.number + 1 })}
            >
              {i18n.t('Next')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function AlertRow({ routeId, alert, onSelect }: { routeId: string; alert: AlertSummary; onSelect: (id: number) => void }) {
  // Last ~12 weeks leading up to (and including) this alert's own period --
  // enough to see the shape of the rise without fetching the series' whole
  // history for every visible row.
  const { observations } = useObservations(routeId, alert.seriesId)
  const trend = observations
    .filter((o) => o.weekStart <= alert.periodStart)
    .slice(-12)
    .map((o) => Number(o.value))

  return (
    <tr style={{ borderBottom: '1px solid #f0f3f5', cursor: 'pointer' }} onClick={() => onSelect(alert.id)}>
      <td style={{ padding: '4px 8px' }}>{alert.orgUnitName}</td>
      <td style={{ padding: '4px 8px' }}>{alert.dataElementName}</td>
      <td style={{ padding: '4px 8px' }}>{alert.algorithm}</td>
      <td style={{ padding: '4px 8px' }}>{alert.periodStart}</td>
      <td style={{ padding: '4px 8px' }}>
        {alert.score} / {alert.threshold}
      </td>
      <td style={{ padding: '4px 8px', color: SEVERITY_COLOR[alert.severity] }}>{alert.severity}</td>
      <td style={{ padding: '4px 8px' }}>
        <Sparkline values={trend} color={SEVERITY_COLOR[alert.severity]} />
      </td>
      <td style={{ padding: '4px 8px' }}>{alert.status}</td>
    </tr>
  )
}
