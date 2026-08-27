import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandCarousel from '../components/BrandCarousel'
import { API_URL } from '../config'

// Hero video (Fase 6 do roteiro) ainda não existe — este bloco fica como um
// placeholder honesto até o admin poder subir um vídeo de verdade, em vez de
// fingir que já tem uma imagem/vídeo de abertura pronta.
function Hero() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-gray-900 px-4 text-center text-white">
      <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
        Skate &amp; streetwear
      </p>
      <h1 className="max-w-2xl text-4xl font-bold text-balance md:text-5xl">
        Vista o look antes de comprar
      </h1>
      <p className="max-w-md text-gray-300">
        Monte a combinação de camiseta e calça no nosso Outfit Mixer, sem
        precisar imaginar como fica.
      </p>
      <Link
        to="/outfit-mixer"
        className="rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold transition hover:bg-purple-500"
      >
        Montar meu look
      </Link>
    </section>
  )
}

function HomePage() {
  const [brands, setBrands] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/brands`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setBrands)
      .catch(() => {}) // non-critical — the strip just doesn't render
  }, [])

  return (
    <div>
      {brands.length > 0 && <BrandCarousel brands={brands} />}
      <Hero />

      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Loja</h2>
        <p className="mt-2 text-gray-500">
          O catálogo completo está a caminho — em breve, camisetas, calças e
          muito mais.
        </p>
        <Link
          to="/loja"
          className="mt-6 inline-block rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-400"
        >
          Ver loja
        </Link>
      </section>
    </div>
  )
}

export default HomePage
