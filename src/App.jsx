import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LojaPage from './pages/LojaPage'
import ProdutoPage from './pages/ProdutoPage'
import CarrinhoPage from './pages/CarrinhoPage'
import OutfitMixerPage from './pages/OutfitMixerPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="loja" element={<LojaPage />} />
          <Route path="produto/:id" element={<ProdutoPage />} />
          <Route path="carrinho" element={<CarrinhoPage />} />
          <Route path="outfit-mixer" element={<OutfitMixerPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
