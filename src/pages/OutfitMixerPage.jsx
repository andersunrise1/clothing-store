import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OptionCarousel from '../components/OptionCarousel'
import OutfitPreview from '../components/OutfitPreview'
import { API_URL } from '../config'
import { loadSelectedItems, saveSelectedItems } from '../utils/persistence'

const CATEGORY_TITLES = { shirt: 'Camiseta', pants: 'Calça / Bermuda' }

// Fase 4: real products (marked "usar também no Outfit Mixer?" in Admin —
// Fase 2) instead of the hardcoded test catalog + visitor-facing photo
// upload this page used while the outfit mixer itself was being built.
// Curating which photos appear here is the admin's job now, done once at
// upload time — a shopper browsing this page only selects and previews,
// same as any other part of the storefront. No onAddNew/onEditItem/
// onDeleteItem passed to OptionCarousel below is deliberate, not an
// oversight: those affordances only make sense for an admin, and the
// admin already has that flow on its own page.
function OutfitMixerPage() {
  const [catalogs, setCatalogs] = useState({ shirt: [], pants: [] })
  const [selected, setSelected] = useState({ shirt: null, pants: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/products/outfit-mixer-items`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setCatalogs(data)
        const persisted = loadSelectedItems()
        setSelected({
          shirt: pickValidSelection(data.shirt, persisted?.shirt),
          pants: pickValidSelection(data.pants, persisted?.pants),
        })
      })
      .catch(() => setError('Não foi possível carregar as peças do Outfit Mixer.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    saveSelectedItems(selected)
  }, [selected])

  const select = (category, id) => setSelected((prev) => ({ ...prev, [category]: id }))

  const shirt = catalogs.shirt.find((s) => s.id === selected.shirt)
  const pants = catalogs.pants.find((p) => p.id === selected.pants)
  const hasAnyItems = catalogs.shirt.length > 0 && catalogs.pants.length > 0

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Monte seu look</h1>

      {loading && <p className="text-sm text-gray-500">Carregando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && !hasAnyItems && (
        <p className="max-w-md text-center text-sm text-gray-500">
          Ainda não há camisetas e calças suficientes cadastradas para o Outfit Mixer. Assim que o
          admin marcar produtos com "usar também no Outfit Mixer?", eles aparecem aqui.
        </p>
      )}

      {!loading && !error && hasAnyItems && (
        <>
          {/* Preview on one side, selection carousels on the other, both in
              the same top-to-bottom order (camiseta/calça) so it's obvious
              which carousel controls which block in the stack. */}
          {/* items-stretch: OutfitPreview measures this stretched height
              and computes its OWN width from it (see that component's
              comment), instead of the other way around — so the preview
              always matches the carousels column's height exactly. */}
          <div className="flex w-full flex-col items-center gap-8 md:flex-row md:items-stretch md:justify-center">
            <div className="shrink-0 self-center rounded-xl bg-gray-50 p-8 md:sticky md:top-10 md:self-stretch">
              <OutfitPreview shirt={shirt} pants={pants} />
            </div>

            <div className="flex w-full flex-col items-center gap-8 md:w-auto">
              {Object.entries(CATEGORY_TITLES).map(([key, title]) => (
                <OptionCarousel
                  key={key}
                  title={title}
                  items={catalogs[key]}
                  selectedId={selected[key]}
                  onSelect={(id) => select(key, id)}
                />
              ))}
            </div>
          </div>

          {shirt && pants && (
            <div className="flex gap-3">
              <Link
                to={`/produto/${shirt.id}`}
                className="rounded border border-purple-400 px-5 py-2.5 text-sm font-medium text-purple-600 transition hover:bg-purple-50"
              >
                Ver camiseta na loja
              </Link>
              <Link
                to={`/produto/${pants.id}`}
                className="rounded border border-purple-400 px-5 py-2.5 text-sm font-medium text-purple-600 transition hover:bg-purple-50"
              >
                Ver calça na loja
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function pickValidSelection(items, persistedId) {
  if (items.some((item) => item.id === persistedId)) return persistedId
  return items[0]?.id ?? null
}

export default OutfitMixerPage
