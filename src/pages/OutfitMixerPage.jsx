import { useEffect, useState } from 'react'
import OptionCarousel from '../components/OptionCarousel'
import OutfitPreview from '../components/OutfitPreview'
import UploadCropModal from '../components/UploadCropModal'
import { SHIRTS, PANTS, ASPECT_RATIOS } from '../data/outfitOptions'
import { loadPersistedState, savePersistedState } from '../utils/persistence'

const CATEGORIES = {
  shirt: { title: 'Camiseta', seed: SHIRTS },
  pants: { title: 'Calça / Bermuda', seed: PANTS },
}

const DEFAULT_CATALOGS = { shirt: SHIRTS, pants: PANTS }
const DEFAULT_SELECTED = { shirt: SHIRTS[0].id, pants: PANTS[0].id }

// Builds the actual initial state once, from whatever's in localStorage —
// guards against a `selected` id that no longer exists in its `catalogs`
// list (e.g. leftover state from a category whose seed data changed,
// or a manually-edited/corrupted storage entry) by falling back to that
// category's first item instead of leaving a dangling reference that
// would crash the `.find()` lookups below.
function buildInitialState() {
  const persisted = loadPersistedState()
  const catalogs = persisted?.catalogs ?? DEFAULT_CATALOGS
  const selected = {}
  for (const category of Object.keys(CATEGORIES)) {
    const list = catalogs[category] ?? []
    const persistedId = persisted?.selected?.[category]
    const isValid = list.some((item) => item.id === persistedId)
    selected[category] = isValid ? persistedId : (list[0]?.id ?? DEFAULT_SELECTED[category])
  }
  return { catalogs, selected }
}

function OutfitMixerPage() {
  // Seeded once from localStorage (if present) so uploaded photos and
  // selections survive a reload/restart instead of resetting to the
  // hardcoded defaults every time — see utils/persistence.js.
  const [initialState] = useState(buildInitialState)
  const [catalogs, setCatalogs] = useState(initialState.catalogs)
  const [selected, setSelected] = useState(initialState.selected)
  const [uploadCategory, setUploadCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    savePersistedState({ catalogs, selected })
  }, [catalogs, selected])

  const select = (category, id) => setSelected((prev) => ({ ...prev, [category]: id }))

  const closeModal = () => {
    setUploadCategory(null)
    setEditingItem(null)
  }

  const handleSaveUpload = ({ label, image, originalSrc, crop, zoom }) => {
    const category = uploadCategory
    if (editingItem) {
      setCatalogs((prev) => ({
        ...prev,
        [category]: prev[category].map((item) =>
          item.id === editingItem.id ? { ...item, label, image, originalSrc, crop, zoom } : item,
        ),
      }))
    } else {
      const newItem = { id: `${category}-${Date.now()}`, label, image, originalSrc, crop, zoom }
      setCatalogs((prev) => ({ ...prev, [category]: [...prev[category], newItem] }))
      select(category, newItem.id)
    }
    closeModal()
  }

  const handleDeleteItem = (category, itemId) => {
    const list = catalogs[category]
    const index = list.findIndex((item) => item.id === itemId)
    const newList = list.filter((item) => item.id !== itemId)
    setCatalogs((prev) => ({ ...prev, [category]: newList }))
    if (selected[category] === itemId) {
      const fallback = newList[Math.max(index - 1, 0)]
      select(category, fallback.id)
    }
  }

  const handleEditItem = (category, item) => {
    setUploadCategory(category)
    setEditingItem(item)
  }

  const shirt = catalogs.shirt.find((s) => s.id === selected.shirt)
  const pants = catalogs.pants.find((p) => p.id === selected.pants)

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Monte seu look</h1>

      {/* Preview on one side, selection carousels on the other, both in the
          same top-to-bottom order (camiseta/calça) so it's obvious which
          carousel controls which block in the stack. */}
      {/* items-stretch (back to the original): OutfitPreview now measures
          this stretched height and computes its OWN width from it (see
          that component's comment), instead of the other way around — so
          the preview always matches the carousels column's height exactly,
          with no empty gap and no oversized preview. */}
      <div className="flex w-full flex-col items-center gap-8 md:flex-row md:items-stretch md:justify-center">
        <div className="shrink-0 self-center rounded-xl bg-gray-50 p-8 md:sticky md:top-10 md:self-stretch">
          <OutfitPreview shirt={shirt} pants={pants} />
        </div>

        <div className="flex w-full flex-col items-center gap-8 md:w-auto">
          {Object.entries(CATEGORIES).map(([key, { title }]) => (
            <OptionCarousel
              key={key}
              title={title}
              items={catalogs[key]}
              selectedId={selected[key]}
              onSelect={(id) => select(key, id)}
              onAddNew={() => setUploadCategory(key)}
              onDeleteItem={(id) => handleDeleteItem(key, id)}
              onEditItem={(item) => handleEditItem(key, item)}
            />
          ))}
        </div>
      </div>

      {uploadCategory && (
        <UploadCropModal
          title={CATEGORIES[uploadCategory].title}
          aspect={ASPECT_RATIOS[uploadCategory]}
          editingItem={editingItem}
          onSave={handleSaveUpload}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

export default OutfitMixerPage
