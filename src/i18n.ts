// Wraps the auto-generated src/locales/index.js (see ambient.d.ts) instead of
// importing it directly everywhere. See dhis2-fhir-sync-console's own
// src/i18n.ts for why: i18next's Interpolator caches `escapeValue` (default
// true) once at construction, so @dhis2/d2-i18n's init silently HTML-entity-
// escapes every interpolated value unless this is set per-call. Carried
// over here rather than rediscovering the same bug.
import rawI18n from './locales'

const i18n = {
  t: (key: string, options?: Record<string, unknown>): string =>
    rawI18n.t(key, options ? { ...options, interpolation: { escapeValue: false } } : undefined) as string,
}

export default i18n
