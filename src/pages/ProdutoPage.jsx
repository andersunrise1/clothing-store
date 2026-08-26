import { useParams } from 'react-router-dom'

// Página de produto individual — sem dados reais até a Fase 2/3 (backend +
// catálogo). :id já está roteado corretamente para quando isso existir.
function ProdutoPage() {
  const { id } = useParams()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Produto</h1>
      <p className="mt-2 text-gray-500">
        Detalhes do produto <code className="text-gray-700">{id}</code> ainda não
        estão disponíveis — a página existe, os dados vêm depois.
      </p>
    </div>
  )
}

export default ProdutoPage
