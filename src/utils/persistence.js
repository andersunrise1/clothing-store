// Fase 4: catalogs now come from the server (real products), so there's
// nothing left to persist except *which* item the visitor last had
// selected per category — a small convenience so returning to the page
// doesn't reset to the first item every time. Simpler than the file this
// replaced, which used to persist the whole (locally-uploaded) catalog
// before real products existed.
const STORAGE_KEY = 'outfit-mixer-selected-v2'

export function loadSelectedItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSelectedItems(selected) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected))
  } catch {
    // localStorage disabled or full — losing this convenience isn't worth
    // breaking the page over.
  }
}
