import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo-boardculture.png'
import { useCart } from '../../context/CartContext'

// Matches the real boardculture.com.br category bar and its dropdowns.
// Skateboard, Proteção and Roupas are real category groups with the exact
// sub-items the live site lists; Bags, Livros/Zines & Arte and Cartão
// Presente are flat links there too. Outfit Mixer is the one addition —
// same style, no dropdown, since it's a tool/page, not a product category.
// Every link (top-level and sub-item) points at /loja for now — the
// catalog itself isn't built yet (Fase 2/3 of the roadmap) — except
// Outfit Mixer, which is the one link that's actually functional today.
const CATEGORIES = [
  {
    to: '/loja',
    label: 'Skateboard',
    submenu: [
      'Shapes',
      'Trucks',
      'Rodas',
      'Rolamentos',
      'Lixas',
      'Parafusos',
      'Acessórios',
      'Manutenção',
      'Skates montados',
    ],
  },
  {
    to: '/loja',
    label: 'Proteção',
    submenu: [
      'Joelheira',
      'Capacete',
      'Cotoveleira',
      'Wrist Guard',
      'Calção Pads',
      'Palmilhas',
      'Acessórios',
    ],
  },
  {
    to: '/loja',
    label: 'Roupas',
    submenu: ['Camisetas', 'Bermudas', 'Calças', 'Moletons', 'Toucas', 'Meias'],
  },
  { to: '/loja', label: 'Bags' },
  { to: '/loja', label: 'Livros, Zines & Arte' },
  { to: '/loja', label: 'Cartão Presente' },
  { to: '/outfit-mixer', label: 'Outfit Mixer' },
]

function categoryLinkClass({ isActive }) {
  return `flex items-center gap-1 text-sm font-bold tracking-wide uppercase transition hover:text-red-600 ${
    isActive ? 'text-red-600' : 'text-gray-800'
  }`
}

function utilityLinkClass({ isActive }) {
  return `text-sm font-medium transition hover:text-purple-600 ${
    isActive ? 'text-purple-600' : 'text-gray-600'
  }`
}

function Header() {
  const { totalItems } = useCart()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* boardculture.com.br is the real, existing store — this is a
            rebuild of it, not a fictional brand. Real logo asset, sized to
            match the prominence it has on the real site. */}
        <NavLink to="/" aria-label="Board Culture">
          <img src={logo} alt="Board Culture" className="h-40 w-auto" />
        </NavLink>

        <div className="flex items-center gap-4">
          <NavLink to="/carrinho" className={(state) => `relative ${utilityLinkClass(state)}`}>
            Carrinho
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/admin"
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-400"
          >
            Admin
          </NavLink>
        </div>
      </div>

      {/* Category bar — same row the real site uses for Skateboard /
          Proteção / Roupas / Bags / Livros, Zines & Arte / Cartão
          Presente, with Outfit Mixer added alongside in the same style.
          `group` + `group-hover` opens each dropdown on hover, matching
          the live site's behavior, with no JS state needed. */}
      <nav className="relative border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3">
          {CATEGORIES.map(({ to, label, submenu }) => (
            <div key={label} className="group relative">
              <NavLink to={to} className={categoryLinkClass}>
                {label}
                {submenu && (
                  <svg viewBox="0 0 12 8" className="h-2 w-3 fill-current" aria-hidden="true">
                    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                )}
              </NavLink>

              {submenu && (
                <div
                  className="invisible absolute top-full left-0 z-20 min-w-48 border border-gray-200 bg-white py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100"
                >
                  {submenu.map((item) => (
                    <NavLink
                      key={item}
                      to={to}
                      className="block px-4 py-1.5 text-sm text-blue-800 hover:bg-gray-50 hover:underline"
                    >
                      {item}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </header>
  )
}

export default Header
