const STORAGE_KEY = 'outfit-mixer-state-v1'

// originalSrc is a blob: URL (URL.createObjectURL) — those only live as long
// as the tab that created them, so restoring one after a reload would just
// be a dead reference. crop/zoom only mean anything paired with that same
// originalSrc, so they're dropped too. `image` (the already-cropped PNG, a
// real data: URL) is what actually needs to survive, since it's what's
// displayed everywhere in the app.
function stripUnrestorableFields(item) {
  const { originalSrc, crop, zoom, ...rest } = item
  return rest
}

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.catalogs || !parsed?.selected) return null
    return parsed
  } catch {
    // Corrupted JSON, localStorage disabled, or anything else unexpected —
    // fall back to the app's normal defaults instead of crashing on load.
    return null
  }
}

export function savePersistedState({ catalogs, selected }) {
  try {
    const cleanCatalogs = Object.fromEntries(
      Object.entries(catalogs).map(([category, items]) => [
        category,
        items.map(stripUnrestorableFields),
      ]),
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ catalogs: cleanCatalogs, selected }))
  } catch {
    // Most likely QuotaExceededError from too many/too large uploaded
    // photos — fail silently rather than breaking the app. Losing the
    // ability to persist is much less disruptive than a crash.
  }
}
