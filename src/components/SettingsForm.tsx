import { Button, CircularLoader, InputField, NoticeBox, Radio, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import { useState } from 'react'
import type { CurrentUserAuthorities } from '../hooks/useCurrentUserAuthorities'
import type { CreateRouteInput, RouteAuthType, UseRouteResult } from '../hooks/useRoute'
import i18n from '../i18n'
import type { SettingsBlob } from '../lib/dataStore'

interface Props {
  settings: SettingsBlob
  onSave: (settings: SettingsBlob) => Promise<void>
  authorities: CurrentUserAuthorities
  route: UseRouteResult
}

export function SettingsForm({ settings, onSave, authorities, route }: Props) {
  const [draft, setDraft] = useState<SettingsBlob>(settings)
  const [showCreateRoute, setShowCreateRoute] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      await onSave(draft)
      setSaved(true)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  const selectedRoute = route.wildcardRoutes.find((r) => r.id === draft.routeId) ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      {saveError && (
        <NoticeBox error title={i18n.t('Could not save settings')}>
          {saveError}
        </NoticeBox>
      )}
      {saved && (
        <NoticeBox valid title={i18n.t('Settings saved')}>
          {i18n.t('Your changes have been saved.')}
        </NoticeBox>
      )}

      <section>
        <h3 style={{ margin: '0 0 8px' }}>{i18n.t('Connection to Outbreak Signal Service')}</h3>
        <p style={{ color: '#6e7a89', fontSize: 13, marginTop: 0 }}>
          {i18n.t(
            'Every call goes through a DHIS2 Route -- this instance makes the outbound call, not your browser, so the bearer token is never exposed client-side.',
          )}
        </p>

        <RoutePicker
          route={route}
          selectedRouteId={draft.routeId}
          onSelect={(id) => setDraft((prev) => ({ ...prev, routeId: id }))}
          canCreateRoutes={authorities.canCreateRoutes}
          showCreateRoute={showCreateRoute}
          onToggleCreateRoute={setShowCreateRoute}
        />

        {selectedRoute && (
          <p style={{ fontSize: 12, color: '#6e7a89', marginTop: 4 }}>
            {i18n.t('Selected route target --')} <code>{selectedRoute.url}</code>
          </p>
        )}
      </section>

      <Button primary onClick={handleSave} loading={saving} disabled={!draft.routeId}>
        {i18n.t('Save settings')}
      </Button>
    </div>
  )
}

function RoutePicker({
  route,
  selectedRouteId,
  onSelect,
  canCreateRoutes,
  showCreateRoute,
  onToggleCreateRoute,
}: {
  route: UseRouteResult
  selectedRouteId: string | null
  onSelect: (id: string) => void
  canCreateRoutes: boolean
  showCreateRoute: boolean
  onToggleCreateRoute: (show: boolean) => void
}) {
  if (route.loading) return <CircularLoader small />

  if (route.error) {
    return (
      <NoticeBox error title={i18n.t('Could not load routes')}>
        {route.error}
      </NoticeBox>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {route.wildcardRoutes.length > 0 ? (
        <div style={{ minWidth: 260, maxWidth: 420 }}>
          <SingleSelectField label={i18n.t('Route')} selected={selectedRouteId ?? ''} onChange={({ selected }) => onSelect(selected)}>
            {route.wildcardRoutes.map((r) => (
              <SingleSelectOption key={r.id} value={r.id} label={r.name} />
            ))}
          </SingleSelectField>
        </div>
      ) : (
        <NoticeBox title={i18n.t('No routes to Outbreak Signal Service found yet')}>
          {i18n.t('Set one up in the Route Manager app, or create one here.')}
        </NoticeBox>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Button small onClick={() => window.open('../route-manager/index.html', '_blank')}>
          {i18n.t('Open Route Manager')}
        </Button>
        {canCreateRoutes && (
          <Button small onClick={() => onToggleCreateRoute(!showCreateRoute)}>
            {showCreateRoute ? i18n.t('Cancel') : i18n.t('Create a route here')}
          </Button>
        )}
      </div>

      {!canCreateRoutes && route.wildcardRoutes.length === 0 && (
        <NoticeBox warning title={i18n.t('You may not have permission to create a route')}>
          {i18n.t(
            'Creating a route needs the "Route" authority (or a superuser role). Ask your DHIS2 administrator, or use Route Manager if you already have access there.',
          )}
        </NoticeBox>
      )}

      {showCreateRoute && canCreateRoutes && <CreateRouteForm route={route} onCreated={onSelect} />}
    </div>
  )
}

function CreateRouteForm({ route, onCreated }: { route: UseRouteResult; onCreated: (id: string) => void }) {
  const [name, setName] = useState('Outbreak Signal Service')
  const [baseUrl, setBaseUrl] = useState('')
  const [authType, setAuthType] = useState<RouteAuthType>('api-headers')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [timeoutSeconds, setTimeoutSeconds] = useState('30')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim() || !baseUrl.trim()) {
      setError(i18n.t('Name and base URL are required.'))
      return
    }
    setError(null)
    setCreating(true)
    try {
      const input: CreateRouteInput = {
        name: name.trim(),
        code: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        baseUrl: baseUrl.trim(),
        authType,
        responseTimeoutSeconds: Number(timeoutSeconds) || 30,
        authConfig:
          authType === 'http-basic'
            ? { username, password }
            : authType === 'api-token'
              ? { token }
              : authType === 'api-headers'
                ? { headers: { Authorization: `Bearer ${token}` } }
                : undefined,
      }
      const id = await route.createRoute(input)
      onCreated(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ border: '1px solid #dbe4ea', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <NoticeBox error title={i18n.t('Could not create route')}>
          {error}
        </NoticeBox>
      )}
      <InputField
        label={i18n.t('Route name')}
        value={name}
        onChange={({ value }) => setName(value ?? '')}
        placeholder={i18n.t('e.g. Outbreak Signal Service')}
      />
      <InputField
        label={i18n.t('Outbreak Signal Service base URL')}
        value={baseUrl}
        onChange={({ value }) => setBaseUrl(value ?? '')}
        placeholder="https://outbreak-signal.example.org"
        helpText={i18n.t('A "/**" wildcard suffix is added automatically -- required to proxy the alerts/sync/detection paths.')}
      />
      <InputField
        label={i18n.t('Response timeout (seconds, max 60)')}
        type="number"
        value={timeoutSeconds}
        onChange={({ value }) => setTimeoutSeconds(value ?? '30')}
      />

      <div>
        <div style={{ marginBottom: 6, fontWeight: 500 }}>{i18n.t('Authentication')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Radio
            label={i18n.t('Bearer token (the resource server\'s JWT)')}
            checked={authType === 'api-headers'}
            onChange={() => setAuthType('api-headers')}
          />
          <Radio
            label={i18n.t('Basic auth (username/password)')}
            checked={authType === 'http-basic'}
            onChange={() => setAuthType('http-basic')}
          />
          <Radio label={i18n.t('API token')} checked={authType === 'api-token'} onChange={() => setAuthType('api-token')} />
          <Radio label={i18n.t('None (unsecured)')} checked={authType === 'none'} onChange={() => setAuthType('none')} />
        </div>
      </div>

      {authType === 'http-basic' && (
        <>
          <InputField label={i18n.t('Username')} value={username} onChange={({ value }) => setUsername(value ?? '')} />
          <InputField
            label={i18n.t('Password')}
            type="password"
            value={password}
            onChange={({ value }) => setPassword(value ?? '')}
          />
        </>
      )}
      {(authType === 'api-token' || authType === 'api-headers') && (
        <InputField
          label={i18n.t('Bearer token')}
          type="password"
          value={token}
          onChange={({ value }) => setToken(value ?? '')}
          helpText={i18n.t(
            'Outbreak Signal Service is an OAuth2 resource server -- its real JWTs are short-lived (the default local Keycloak profile issues ones valid for 5 minutes). A Route cannot refresh this token itself, so use a service-account token from your identity provider configured for a long lifetime, and rotate it here manually when it expires -- the same accepted limitation documented for every other app in this portfolio that goes through a Route this way. Needs ADMIN (to trigger a sync/detection run) or ANALYST (to review alerts only).',
          )}
        />
      )}

      <Button primary small onClick={handleCreate} loading={creating}>
        {i18n.t('Create route')}
      </Button>
    </div>
  )
}
