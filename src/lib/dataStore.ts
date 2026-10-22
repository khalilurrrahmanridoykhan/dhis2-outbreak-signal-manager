// Same read-modify-write pattern confirmed working in every sibling app's
// own lib/dataStore.ts: a 'create' mutation rejects an `id` property at
// runtime even though the TS type allows it, so first-ever key creation
// embeds the key directly in `resource` instead (see useSettings.ts).
//
// Deliberately small: unlike FHIR Sync Console, there is no per-series
// mapping to persist here. Outbreak Signal Service decides what it syncs
// from its own `outbreak.dhis2.*` configuration (see its README), not from
// a mapping an admin builds in this app -- `GET /api/v1/series` lists
// what already exists, read-only. The only real setting is which Route
// reaches it.

export const NAMESPACE = 'outbreakSignalManager'
export const RESOURCE = `dataStore/${NAMESPACE}`
export const SETTINGS_KEY = 'settings'

export const CURRENT_SCHEMA_VERSION = 1 as const

export interface SettingsBlob {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION
  routeId: string | null
}

export function emptySettingsBlob(): SettingsBlob {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, routeId: null }
}

export function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /404|not\s*found/i.test(error.message)
}
