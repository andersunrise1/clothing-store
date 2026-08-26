export const SHIRTS = [
  { id: 'white', label: 'Branca', color: '#f9fafb' },
  { id: 'black', label: 'Preta', color: '#111827' },
  { id: 'red', label: 'Vermelha', color: '#dc2626' },
  { id: 'blue', label: 'Azul', color: '#2563eb' },
  { id: 'green', label: 'Verde', color: '#16a34a' },
  { id: 'yellow', label: 'Amarela', color: '#eab308' },
]

// Calça e bermuda dividem o mesmo carrossel (mesma parte do corpo / mesmo slot)
export const PANTS = [
  { id: 'gray', label: 'Calça Cinza', color: '#4b5563' },
  { id: 'black', label: 'Calça Preta', color: '#1f2937' },
  { id: 'blue', label: 'Calça Jeans', color: '#3b5b8c' },
  { id: 'brown', label: 'Calça Marrom', color: '#5c4433' },
  { id: 'khaki-shorts', label: 'Bermuda Cáqui', color: '#a3906b' },
  { id: 'black-shorts', label: 'Bermuda Preta', color: '#1f2937' },
  { id: 'blue-shorts', label: 'Bermuda Jeans', color: '#3b5b8c' },
]

// Aspect ratio (width / height) the crop tool locks to per category, so any
// uploaded photo comes out a consistent shape for that slot.
//
// OutfitPreview now derives its WIDTH from the (fixed, carousel-matched)
// height instead of the other way around, so — unlike an earlier version
// of this file — picking a taller/more-portrait aspect here no longer
// risks making the *whole preview* balloon in size; it only changes how
// much of that fixed total height each category's block gets.
//
// pants is taller than shirt on purpose, and specifically by ~1.5x (not
// 1x, not 2x) — the goal (per explicit user direction) isn't "avoid
// cropping the photo" or "keep blocks visually similar," it's "look like
// it's actually worn on a body." Classic figure-drawing proportion (the
// 8-heads-tall reference used in fashion illustration) puts the torso
// (shoulder to waist) at roughly 2.5-3 head-heights and the leg (waist to
// ankle) at roughly 4 head-heights — a leg:torso ratio of about 1.5:1.
// Since each block's height here is proportional to 1/aspect, matching
// that ratio means pantsAspect = shirtAspect / 1.5.
//
// This is a middle point between two earlier attempts: 0.75 (square-ish)
// cropped most full-body pants photos down to just thigh-to-knee, since
// the crop tool can't zoom out past the photo's own pixel width to reveal
// more — see UploadCropModal.jsx's crop-window-size comment. 0.5 (2x
// ratio) fixed that but looked exaggerated rather than body-like. 0.65 is
// closer to a real body's proportions and still shows most of a typical
// full-body photo (some very full-length shots may need a bit more zoom
// care to avoid the crop tool clipping the last bit of ankle).
export const ASPECT_RATIOS = {
  shirt: 1,
  pants: 0.65,
}
