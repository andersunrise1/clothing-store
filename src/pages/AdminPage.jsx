import { useState } from 'react'
import { API_URL } from '../config'
import AdminProducts from './admin/AdminProducts'
import AdminBrands from './admin/AdminBrands'
import AdminVideos from './admin/AdminVideos'
import AdminOrders from './admin/AdminOrders'

const TABS = [
  { key: 'products', label: 'Produtos' },
  { key: 'brands', label: 'Marcas' },
  { key: 'videos', label: 'Vídeos' },
  { key: 'orders', label: 'Pedidos' },
]

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao entrar')
      onLogin(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-3 py-16">
      <h1 className="text-center text-2xl font-bold text-gray-900">Admin</h1>
      <input
        type="text"
        placeholder="Usuário"
        aria-label="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="Senha"
        aria-label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}

function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('bc_admin_token'))
  const [activeTab, setActiveTab] = useState('products')

  const handleLogin = (newToken) => {
    localStorage.setItem('bc_admin_token', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('bc_admin_token')
    setToken(null)
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <button type="button" onClick={handleLogout} className="text-sm text-gray-500 hover:underline">
          Sair
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && <AdminProducts token={token} onAuthError={handleLogout} />}
      {activeTab === 'brands' && <AdminBrands token={token} onAuthError={handleLogout} />}
      {activeTab === 'videos' && <AdminVideos token={token} onAuthError={handleLogout} />}
      {activeTab === 'orders' && <AdminOrders token={token} onAuthError={handleLogout} />}
    </div>
  )
}

export default AdminPage
