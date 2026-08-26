// Catálogo real chega na Fase 3 do roteiro (loja + preço no hover +
// carrinho), depois do backend/admin de produtos da Fase 2. Por enquanto,
// só a rota existe — sem produto fingido pra preencher espaço.
function LojaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Loja</h1>
      <p className="mt-2 text-gray-500">
        O catálogo de produtos ainda não está conectado — chega na próxima fase do
        projeto, junto com o painel do admin.
      </p>
    </div>
  )
}

export default LojaPage
