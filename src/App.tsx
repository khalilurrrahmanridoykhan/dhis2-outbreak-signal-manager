import { CircularLoader } from '@dhis2/ui'
import { useState } from 'react'
import { AlertDetailPanel } from './components/AlertDetailPanel'
import { AlertsTable } from './components/AlertsTable'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SettingsForm } from './components/SettingsForm'
import { TriggerPanel } from './components/TriggerPanel'
import { useAlerts } from './hooks/useAlerts'
import { useCurrentUserAuthorities } from './hooks/useCurrentUserAuthorities'
import { useRoute } from './hooks/useRoute'
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

function AppContent() {
  const authorities = useCurrentUserAuthorities()
  const { settings, loading: settingsLoading, saveSettings } = useSettings()
  const route = useRoute()
  const trigger = useTrigger()
  const alerts = useAlerts(settings.routeId)
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null)

  if (settingsLoading || authorities.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <CircularLoader />
      </div>
    )
  }

  const ready = Boolean(settings.routeId)

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <h2>{i18n.t('Settings')}</h2>
        <SettingsForm settings={settings} onSave={saveSettings} authorities={authorities} route={route} />
      </section>

      {ready && (
        <>
          <section>
            <h2>{i18n.t('Trigger')}</h2>
            <TriggerPanel
              routeId={settings.routeId as string}
              trigger={trigger}
              onSyncComplete={() => {}}
              onDetectionComplete={() => alerts.refresh()}
            />
          </section>

          <section>
            <h2>{i18n.t('Alerts')}</h2>
            {selectedAlertId === null ? (
              <AlertsTable alerts={alerts} onSelect={setSelectedAlertId} />
            ) : (
              <AlertDetailPanel
                routeId={settings.routeId as string}
                alertId={selectedAlertId}
                onClose={() => setSelectedAlertId(null)}
                onChanged={() => alerts.refresh()}
              />
            )}
          </section>
        </>
      )}

      {!ready && <p style={{ color: '#6e7a89' }}>{i18n.t('Pick or create a route to Outbreak Signal Service above to get started.')}</p>}
    </div>
  )
}
