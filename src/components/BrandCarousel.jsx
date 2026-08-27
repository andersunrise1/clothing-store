import { API_URL } from '../config'

// Auto-scrolling brand strip matching the real boardculture.com.br: logos
// sit in grayscale, drift sideways on their own at a steady pace, and the
// whole thing stops the instant the mouse enters — the logo under the
// cursor then shows its real color, everything else stays grayscale.
//
// Pure CSS drives the motion (see .brand-track's animation in index.css) —
// no animation library, no per-frame JS, so the pause-on-hover is just
// `animation-play-state: paused` and costs nothing to keep smooth.
function BrandLogo({ brand }) {
  return (
    <div className="flex h-24 w-52 shrink-0 items-center justify-center px-6" title={brand.name}>
      <img
        src={`${API_URL}${brand.logo_url}`}
        alt={brand.name}
        className="brand-logo max-h-20 w-auto object-contain"
      />
    </div>
  )
}

function BrandCarousel({ brands }) {
  // Rendered twice back-to-back so the CSS animation can scroll from
  // translateX(0) to translateX(-50%) and loop with no visible seam — the
  // second copy is standing in for what the first copy looked like before
  // it scrolled off, not new content.
  const track = [...brands, ...brands]

  return (
    <div className="brand-marquee overflow-hidden border-y border-gray-100 bg-white py-6">
      <div className="brand-track flex w-max items-center">
        {track.map((brand, i) => (
          <BrandLogo key={`${brand.id}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  )
}

export default BrandCarousel
