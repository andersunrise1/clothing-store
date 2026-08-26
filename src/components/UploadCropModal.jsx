import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImage } from '../utils/cropImage'

// editingItem: pass an existing {label, originalSrc} to re-open the cropper
// on that item's original photo (not the already-cropped result) — so
// editing can pan/zoom back into parts of the photo that a previous crop
// left out, not just what's currently visible.
function UploadCropModal({ title, aspect, onSave, onClose, editingItem }) {
  const [imageSrc, setImageSrc] = useState(editingItem?.originalSrc ?? null)
  const [crop, setCrop] = useState(editingItem?.crop ?? { x: 0, y: 0 })
  const [zoom, setZoom] = useState(editingItem?.zoom ?? 1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [label, setLabel] = useState(editingItem?.label ?? '')
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  const useFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageSrc(URL.createObjectURL(file))
  }

  const handleFileChange = (e) => useFile(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    useFile(e.dataTransfer.files?.[0])
  }

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setSaving(true)
    try {
      const image = await getCroppedImage(imageSrc, croppedAreaPixels)
      onSave({ label: label.trim() || 'Sem nome', image, originalSrc: imageSrc, crop, zoom })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingItem ? 'Editar' : 'Adicionar'} {title}
        </h2>

        {!imageSrc && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition ${
              dragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
            }`}
          >
            <p className="text-sm text-gray-600">
              Arraste uma foto aqui ou clique para escolher do seu computador.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Escolher foto"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
              className="text-sm"
            />
          </div>
        )}

        {imageSrc && (
          <>
            <div className="relative h-96 w-full bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.3}
                maxZoom={3}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                // Dragging the photo to reposition it updates the crop
                // position through a throttled animation frame internally.
                // If you drag and release quickly, onCropComplete can fire
                // (on mouse-up) just BEFORE that last position update lands
                // — so it captures the position from just before your final
                // drop point, not where you actually placed it. The photo
                // visually snaps to the right spot, but the saved crop data
                // doesn't, so Salvar exports the older position — looking
                // exactly like the edit didn't save. onCropAreaChange fires
                // again whenever the crop position itself changes (including
                // that late update), so wiring it to the same handler
                // guarantees we always end up with the true final position.
                onCropAreaChange={onCropComplete}
              />
              {!croppedAreaPixels && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                  Carregando imagem...
                </div>
              )}
            </div>
            <p className="-mt-2 text-xs text-gray-500">
              Encoste a <strong>peça em si</strong> (não braços, mãos ou
              fundo) nas bordas esquerda e direita do quadro — é isso que
              fica com a mesma largura das outras peças no preview. Numa foto
              de modelo, isso normalmente significa dar mais zoom até só a
              roupa aparecer, cortando braços/mãos para fora do quadro de
              propósito. Dê zoom para fora se a peça inteira não couber; se
              não conseguir arrastar para cima/baixo, dê um pequeno zoom para
              dentro.
            </p>

            <input
              type="range"
              min={0.3}
              max={3}
              step={0.05}
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
            />

            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nome (ex: Camiseta Estampada)"
              aria-label="Nome do produto"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!imageSrc || !croppedAreaPixels || saving}
            className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadCropModal
