// Carrinho de verdade (adicionar/remover item, total) chega na Fase 3,
// junto com o catálogo real — não faz sentido ter carrinho sem produto.
function CarrinhoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Carrinho</h1>
      <p className="mt-2 text-gray-500">Seu carrinho está vazio.</p>
    </div>
  )
}

export default CarrinhoPage
