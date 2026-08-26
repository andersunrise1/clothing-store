import { useRef, useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

function Thumb({ item }) {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.label}
        className="h-28 w-28 rounded-full border border-black/10 object-cover shadow-sm"
      />
    )
  }
  return (
    <span
      className="h-28 w-28 rounded-full border border-black/10 shadow-sm"
      style={
        item.color
          ? { backgroundColor: item.color }
          : {
              background:
                'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)',
            }
      }
    />
  )
}

// A real SVG chevron as a normal DOM child, not Swiper's default icon-font
// trick (content: 'next'/'prev' on a ::after). Tailwind's own preflight
// resets `content` on every ::before/::after globally (for its
// before:content-[...] utilities), which silently wiped out Swiper's
// arrow glyph — the button box was rendering, just empty inside. Custom
// nav buttons sidestep that cascade fight entirely.
function ChevronIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NavButton({ direction, elRef, disabled }) {
  return (
    <button
      ref={elRef}
      type="button"
      aria-label={direction === 'left' ? 'Anterior' : 'Próximo'}
      disabled={disabled}
      // top-1/2 (center of the whole card, label included) sat visibly
      // below the thumbnail's own center. The card is p-4 (16px) padding
      // then an h-28 (112px) circle, so the circle's true center is
      // 16 + 56 = 72px from the top — that's what these buttons need to
      // line up with, not the card's overall vertical middle.
      className={`absolute top-[72px] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-purple-600 shadow-md ring-1 ring-black/5 transition hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-white ${
        direction === 'left' ? 'left-2' : 'right-2'
      }`}
    >
      <ChevronIcon direction={direction} />
    </button>
  )
}

function OptionCarousel({ title, items, selectedId, onSelect, onAddNew, onDeleteItem, onEditItem }) {
  const swiperRef = useRef(null)
  // Custom nav elements need to exist as real DOM nodes before they can be
  // handed to Swiper's `navigation={{ prevEl, nextEl }}` config — refs
  // alone don't trigger a re-render once they attach, so these are state
  // (the standard pattern for custom navigation in swiper/react).
  const [prevEl, setPrevEl] = useState(null)
  const [nextEl, setNextEl] = useState(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  // Swiper's `initialSlide` only applies on mount, so when `selectedId`
  // changes from outside (e.g. a new photo just got uploaded and
  // auto-selected), the carousel needs to be told explicitly to catch up —
  // otherwise it keeps highlighting whatever was active before.
  useEffect(() => {
    const swiper = swiperRef.current
    if (!swiper) return
    const index = items.findIndex((item) => item.id === selectedId)
    if (index >= 0 && index !== swiper.activeIndex) {
      swiper.slideTo(index)
    }
  }, [selectedId, items])

  return (
    <div className="w-full max-w-sm">
      <div className="mb-2 flex items-center justify-center gap-3">
        <h3 className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            aria-label={`Adicionar ${title}`}
            title={`Adicionar ${title}`}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-purple-400 text-sm leading-none text-purple-500 transition hover:bg-purple-500 hover:text-white"
          >
            +
          </button>
        )}
      </div>

      {/* relative wrapper must be the exact same width as the Swiper
          itself (w-60 on both) — otherwise left-2/right-2 on the nav
          buttons position against this wrapper's edges, not the card's,
          and they'd end up floating out near max-w-sm's boundary instead
          of sitting on the square. */}
      <div className="relative mx-auto w-60">
        <NavButton direction="left" elRef={setPrevEl} disabled={atStart} />
        <NavButton direction="right" elRef={setNextEl} disabled={atEnd} />

        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          modules={[Navigation, Pagination]}
          navigation={{ prevEl, nextEl }}
          pagination={{ clickable: true }}
          slidesPerView={1}
          initialSlide={Math.max(
            items.findIndex((item) => item.id === selectedId),
            0,
          )}
          onSlideChange={(swiper) => {
            onSelect(items[swiper.activeIndex].id)
            setAtStart(swiper.isBeginning)
            setAtEnd(swiper.isEnd)
          }}
          className="w-60"
          style={{
            '--swiper-pagination-bottom': '0px',
            // set via inline style, not a Tailwind class — swiper/css's own
            // `.swiper { padding: 0 }` rule loads after Tailwind's utilities
            // and silently wins the cascade, so pb-8 had no effect here
            paddingBottom: '36px',
          }}
        >
          {items.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full flex-col items-center gap-3 rounded-lg border-2 p-4 transition ${
                    selectedId === item.id ? 'border-purple-500' : 'border-transparent'
                  }`}
                >
                  <Thumb item={item} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </button>
                {item.image && onEditItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditItem(item)
                    }}
                    aria-label={`Editar ${item.label}`}
                    title="Ajustar zoom/enquadramento"
                    className="absolute top-0 right-9 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-purple-500 shadow ring-1 ring-purple-200 transition hover:bg-purple-500 hover:text-white"
                  >
                    ✎
                  </button>
                )}
                {item.image && onDeleteItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteItem(item.id)
                    }}
                    aria-label={`Excluir ${item.label}`}
                    title="Excluir foto"
                    className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-base text-red-500 shadow ring-1 ring-red-200 transition hover:bg-red-500 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default OptionCarousel
