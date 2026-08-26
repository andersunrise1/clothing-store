import { useLayoutEffect, useRef, useState } from 'react'
import { ASPECT_RATIOS } from '../data/outfitOptions'

// The actual "outfit" visual: each selected item's swatch stacked directly
// against the next, no gap — this is what a stack of real product photos
// (transparent background, cropped tight) would look like glued together.
//
// Each swatch's flex-grow is 1/aspectRatio (not dampened) — this is what
// makes the waist of the pants line up with the hem of the shirt: since
// every block shares the exact same width (the column is stretched to one
// fixed width) and every uploaded photo is cropped to exactly its
// category's aspect ratio, the flex-grow-vs-1/aspect relationship keeps
// each block's rendered aspect a *constant multiple* of its true photo
// aspect — the same multiple for every category. That means object-contain
// fills the same fraction of box width for every block, so the visible
// garment edge lands at the same on-screen width across the whole stack.
// Dampening this (e.g. with a square root) breaks that property — it was
// tried once to shrink how dominant pants looked, but it made pants/shirt
// no longer line up.
function Swatch({ item, aspect }) {
  const style = { flexGrow: 1 / aspect, flexBasis: 0 }
  if (item.image) {
    return (
      // object-contain, not cover: the box's exact proportions are only an
      // approximation (they get scaled to fit the total stack height), so
      // cover would still crop into the photo — contain guarantees the
      // whole garment is always visible, at the cost of a thin neutral
      // margin on whichever axis doesn't fill exactly.
      <div
        className="flex items-center justify-center overflow-hidden border border-black/10 bg-gray-100"
        style={style}
      >
        <img src={item.image} alt={item.label} className="h-full w-full object-contain" />
      </div>
    )
  }
  return (
    <div
      className="flex items-center justify-center border border-black/10"
      style={{
        ...style,
        ...(item.color
          ? { backgroundColor: item.color }
          : {
              background:
                'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)',
            }),
      }}
    >
      <span className="text-base font-medium text-black/60 [text-shadow:0_1px_2px_rgba(255,255,255,0.6)]">
        {item.label}
      </span>
    </div>
  )
}

function OutfitPreview({ shirt, pants }) {
  // Two things were fighting each other in earlier attempts:
  //   1. The preview's HEIGHT should match the carousels column next to it
  //      (the original request — otherwise the page looks lopsided).
  //   2. Every garment photo should reach full width with no side padding
  //      and no top/bottom cropping — which, for a *fixed* width, requires
  //      a specific minimum height (width * sum(1/aspect)). Fixing the
  //      width first and deriving height from it made the preview taller
  //      than the carousels, which is exactly what looked wrong.
  //
  // The fix: stop fixing the width. Let height come from the layout as
  // before (h-full, stretched to match the carousels column), MEASURE
  // that real height, and derive the WIDTH from it instead
  // (width = height / sum(1/aspect)) — same formula, solved for the other
  // variable. That guarantees the preview is always exactly as tall as
  // its neighbor, while still giving every photo the exact amount of
  // width it needs to fill the frame edge to edge.
  const visibleAspects = [ASPECT_RATIOS.shirt, ASPECT_RATIOS.pants]
  const sumInverseAspect = visibleAspects.reduce((sum, aspect) => sum + 1 / aspect, 0)

  const containerRef = useRef(null)
  const [width, setWidth] = useState(320)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const recalcWidth = () => {
      const height = el.getBoundingClientRect().height
      if (height > 0) setWidth(height / sumInverseAspect)
    }
    recalcWidth()
    const observer = new ResizeObserver(recalcWidth)
    observer.observe(el)
    return () => observer.disconnect()
  }, [sumInverseAspect])

  return (
    <div
      ref={containerRef}
      className="flex h-full flex-col items-stretch"
      style={{ width }}
    >
      <Swatch item={shirt} aspect={ASPECT_RATIOS.shirt} />
      <Swatch item={pants} aspect={ASPECT_RATIOS.pants} />
    </div>
  )
}

export default OutfitPreview
