import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LojaPage from './pages/LojaPage'
import ProdutoPage from './pages/ProdutoPage'
import CarrinhoPage from './pages/CarrinhoPage'
import CheckoutPage from './pages/CheckoutPage'
import PedidoStatusPage from './pages/PedidoStatusPage'
import OutfitMixerPage from './pages/OutfitMixerPage'
import VideosPage from './pages/VideosPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="loja" element={<LojaPage />} />
            <Route path="produto/:id" element={<ProdutoPage />} />
            <Route path="carrinho" element={<CarrinhoPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="pedido/:status" element={<PedidoStatusPage />} />
            <Route path="outfit-mixer" element={<OutfitMixerPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
