import { createContext, useContext, useEffect, useState } from 'react'

// No customer accounts exist yet (only the single admin login) — the cart
// is per-browser via localStorage, same pattern already established for
// the Outfit Mixer's own state (see utils/persistence.js). It stores just
// enough of each product to render the cart without a fresh fetch:
// {productId, name, price_cents, image_url, quantity}.
const STORAGE_KEY = 'bc_cart_v1'
const CartContext = createContext(null)

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Quota exceeded or storage disabled — the cart just won't persist
      // across a reload this time, not worth breaking the page over.
    }
  }, [items])

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price_cents: product.price_cents,
          image_url: product.image_url,
          quantity: 1,
        },
      ]
    })
  }

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const setQuantity = (productId, quantity) => {
    if (quantity < 1) return removeItem(productId)
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)))
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalCents = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, setQuantity, totalItems, totalCents }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
