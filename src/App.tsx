import { CircularLoader, Tab, TabBar } from '@dhis2/ui'
import { useState } from 'react'
import { AlertDetailPanel } from './components/AlertDetailPanel'
import { AlertsTable } from './components/AlertsTable'
import { ErrorBoundary } from './components/ErrorBoundary'
import { NotificationRecipients } from './components/NotificationRecipients'
import { SettingsForm } from './components/SettingsForm'
import { TriggerPanel } from './components/TriggerPanel'
import { useAlerts } from './hooks/useAlerts'
import { useCurrentUserAuthorities } from './hooks/useCurrentUserAuthorities'
import { useNotificationRecipients } from './hooks/useNotificationRecipients'
import { useRoute } from './hooks/useRoute'
import { useSeriesOptions } from './hooks/useSeriesOptions'
import { useSettings } from './hooks/useSettings'
import { useTrigger } from './hooks/useTrigger'
import i18n from './i18n'

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

type TabKey = 'settings' | 'alerts' | 'notifications'

function AppContent() {
  const authorities = useCurrentUserAuthorities()
  const { settings, loading: settingsLoading, saveSettings } = useSettings()
  const route = useRoute()
  const trigger = useTrigger()
  const alerts = useAlerts(settings.routeId)
  const seriesOptions = useSeriesOptions(settings.routeId)
  const notificationRecipients = useNotificationRecipients(settings.routeId)
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null)
  const [tab, setTab] = useState<TabKey>('settings')

  if (settingsLoading || authorities.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <CircularLoader />
      </div>
    )
  }

  const ready = Boolean(settings.routeId)
  const routeId = settings.routeId as string

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabBar>
        <Tab selected={tab === 'settings'} onClick={() => setTab('settings')}>
          {i18n.t('Settings')}
        </Tab>
        <Tab selected={tab === 'alerts'} disabled={!ready} onClick={() => ready && setTab('alerts')}>
          {i18n.t('Alerts')}
        </Tab>
        <Tab selected={tab === 'notifications'} disabled={!ready} onClick={() => ready && setTab('notifications')}>
          {i18n.t('Notifications')}
        </Tab>
      </TabBar>

      <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {tab === 'settings' && (
          <section>
            <SettingsForm settings={settings} onSave={saveSettings} authorities={authorities} route={route} />
            {!ready && (
              <p style={{ color: '#6e7a89', marginTop: 16 }}>
                {i18n.t('Pick or create a route to Outbreak Signal Service above to get started.')}
              </p>
            )}
          </section>
        )}

        {tab === 'alerts' && ready && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <section>
              <h2>{i18n.t('Trigger')}</h2>
              <TriggerPanel
                routeId={routeId}
                trigger={trigger}
                onSyncComplete={() => {}}
                onDetectionComplete={() => alerts.refresh()}
              />
            </section>

            <section>
              <h2>{i18n.t('Alerts')}</h2>
              {selectedAlertId === null ? (
                <AlertsTable routeId={routeId} alerts={alerts} seriesOptions={seriesOptions} onSelect={setSelectedAlertId} />
              ) : (
                <AlertDetailPanel
                  routeId={routeId}
                  alertId={selectedAlertId}
                  onClose={() => setSelectedAlertId(null)}
                  onChanged={() => alerts.refresh()}
                />
              )}
            </section>
          </div>
        )}

        {tab === 'notifications' && ready && (
          <section>
            <h2>{i18n.t('Notifications')}</h2>
            <NotificationRecipients recipients={notificationRecipients} seriesOptions={seriesOptions} />
          </section>
        )}
      </div>
    </div>
  )
}
