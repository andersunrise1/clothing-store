import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandCarousel from '../components/BrandCarousel'
import ProductCard from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { API_URL } from '../config'
import logo from '../assets/logo-boardculture.png'

function SpeakerIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
      />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  )
}

// Real site's homepage puts a proper product vitrine front and center —
// this used to be a full-width hero taking over the whole top of the page,
// which left no room for that. Now it's a smaller side panel (still plays
// the admin's hero video when one is flagged) sitting next to the vitrine
// instead of dominating it. Just the video and the volume toggle now —
// no text/CTA overlay (the "Outfit Mixer" link already lives in the main
// nav, so nothing is lost by dropping the button here). Muted by default
// (autoplay-with-sound is blocked by every browser regardless of what we
// do here) — the volume button lets a visitor opt into sound themselves,
// a real click/user gesture, so unmuting is allowed.
function HeroPanel({ heroVideo }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev
      if (videoRef.current) videoRef.current.muted = next
      return next
    })
  }

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-lg bg-gray-900">
      {heroVideo && (
        <>
          <video
            key={heroVideo.id}
            ref={videoRef}
            src={`${API_URL}${heroVideo.video_url}`}
            autoPlay
            muted={muted}
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <img
            src={logo}
            alt="Board Culture"
            className="absolute bottom-3 left-3 z-20 h-10 w-auto drop-shadow-lg"
          />
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Ativar som do vídeo' : 'Silenciar vídeo'}
            className="absolute right-3 bottom-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          >
            <SpeakerIcon muted={muted} />
          </button>
        </>
      )}
    </div>
  )
}

// Separate from the hero panel on purpose: this is a real, un-muted player
// (no autoplay, so no browser restriction to work around) for things like
// event announcements, where the admin wants a visitor to actually watch
// and hear it — not an ambient background loop. Only one video can be
// flagged "em destaque" at a time (see server/src/routes/admin.js).
function FeaturedVideoSection({ video }) {
  if (!video) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-8">
      <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Destaque</p>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-black">
        <video
          key={video.id}
          src={`${API_URL}${video.video_url}`}
          controls
          className="aspect-video w-full"
        />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-800">{video.title}</p>
    </section>
  )
}

// Reuses the same ProductCard the /loja page uses (hidden-until-hover
// price, quick quantity + "+ Carrinho" on hover) — one card component, so
// the two places a shopper sees products never drift out of sync.
// Deliberately a single flat grid of everything available, not grouped
// into per-category rows like the real site's homepage does — there's no
// "featured"/category-weighting data to drive that yet, and a flat grid is
// honest about what's really there today.
function VitrineSection({ products, onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 p-10 text-center">
        <p className="text-gray-500">
          O catálogo completo está a caminho — em breve, camisetas, calças e
          muito mais.
        </p>
        <Link
          to="/loja"
          className="inline-block rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-400"
        >
          Ver loja
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.slice(0, 9).map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </div>
      <Link
        to="/loja"
        className="self-center text-sm font-medium text-purple-600 hover:underline"
      >
        Ver todos os produtos
      </Link>
    </div>
  )
}

function HomePage() {
  const [brands, setBrands] = useState([])
  const [heroVideo, setHeroVideo] = useState(null)
  const [featuredVideo, setFeaturedVideo] = useState(null)
  const [products, setProducts] = useState([])
  const { addItem } = useCart()

  useEffect(() => {
    fetch(`${API_URL}/api/brands`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setBrands)
      .catch(() => {}) // non-critical — the strip just doesn't render

    fetch(`${API_URL}/api/videos/hero`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setHeroVideo)
      .catch(() => {}) // non-critical — falls back to the placeholder hero

    fetch(`${API_URL}/api/videos/featured`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setFeaturedVideo)
      .catch(() => {}) // non-critical — the section just doesn't render

    fetch(`${API_URL}/api/products`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setProducts)
      .catch(() => {}) // non-critical — the vitrine falls back to its own placeholder
  }, [])

  return (
    <div>
      {brands.length > 0 && <BrandCarousel brands={brands} />}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <HeroPanel heroVideo={heroVideo} />
          </div>
          <div className="md:col-span-3">
            <VitrineSection products={products} onAddToCart={addItem} />
          </div>
        </div>
      </section>

      <FeaturedVideoSection video={featuredVideo} />
    </div>
  )
}

export default HomePage
