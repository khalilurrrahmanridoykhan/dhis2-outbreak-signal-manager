import { Button, CircularLoader, InputField, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import { useMemo, useState } from 'react'
import type { UseNotificationRecipientsResult } from '../hooks/useNotificationRecipients'
import type { UseSeriesOptionsResult } from '../hooks/useSeriesOptions'
import i18n from '../i18n'

interface Props {
  recipients: UseNotificationRecipientsResult
  seriesOptions: UseSeriesOptionsResult
}

export function NotificationRecipients({ recipients, seriesOptions }: Props) {
  const [orgUnitId, setOrgUnitId] = useState('')
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)

  const orgUnitName = useMemo(() => {
    const byId = new Map(seriesOptions.orgUnits.map((ou) => [String(ou.id), ou.name]))
    return (id: number) => byId.get(String(id)) ?? `#${id}`
  }, [seriesOptions.orgUnits])

  async function handleAdd() {
    if (!orgUnitId || !email.trim()) return
    setAdding(true)
    const ok = await recipients.create(Number(orgUnitId), email.trim())
    setAdding(false)
    if (ok) setEmail('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <p style={{ color: '#6e7a89', fontSize: 13, margin: 0 }}>
        {i18n.t(
          'Everyone here gets an email for every alert raised against their org unit, in addition to the fixed ops address Outbreak Signal Service always notifies.',
        )}
      </p>

      <section style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 220 }}>
          <SingleSelectField label={i18n.t('Org unit')} selected={orgUnitId} onChange={({ selected }) => setOrgUnitId(selected)}>
            {seriesOptions.orgUnits.map((ou) => (
              <SingleSelectOption key={ou.id} value={String(ou.id)} label={ou.name} />
            ))}
          </SingleSelectField>
        </div>
        <InputField label={i18n.t('Email')} value={email} onChange={({ value }) => setEmail(value ?? '')} />
        <Button primary small disabled={!orgUnitId || !email.trim()} loading={adding} onClick={handleAdd}>
          {i18n.t('Add')}
        </Button>
      </section>

      {recipients.error && (
        <NoticeBox error title={i18n.t('Could not save that')}>
          {recipients.error}
        </NoticeBox>
      )}

      {recipients.loading && <CircularLoader small />}

      {!recipients.loading && recipients.recipients.length === 0 && (
        <p style={{ color: '#6e7a89', fontSize: 13 }}>{i18n.t('No recipients registered yet.')}</p>
      )}

      {!recipients.loading && recipients.recipients.length > 0 && (
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #dbe4ea' }}>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Org unit')}</th>
              <th style={{ padding: '4px 8px' }}>{i18n.t('Email')}</th>
              <th style={{ padding: '4px 8px' }} />
            </tr>
          </thead>
          <tbody>
            {recipients.recipients.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f3f5' }}>
                <td style={{ padding: '4px 8px' }}>{orgUnitName(r.orgUnitId)}</td>
                <td style={{ padding: '4px 8px' }}>{r.email}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <Button small destructive onClick={() => recipients.remove(r.id)}>
                    {i18n.t('Remove')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
