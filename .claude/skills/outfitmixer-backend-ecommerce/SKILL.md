---
name: outfitmixer-backend-ecommerce
description: Backend Node.js/Express do outfit mixer — produtos, carrinho, pedidos, autenticação. Use ao começar ou continuar o trabalho de API/servidor para o outfit-mixer-store (hoje um protótipo 100% frontend, sem backend).
---

# Backend E-commerce do Outfit Mixer

**Estado atual: não existe backend.** `outfit-mixer-store` hoje é só
`packages` frontend (React + Vite) — todo o catálogo (`SHIRTS`, `PANTS`),
seleção do usuário e fotos enviadas vivem em memória do navegador +
`localStorage` (ver `utils/persistence.js`). Este arquivo é um guia de
arquitetura para QUANDO esse backend for construído, não documentação de
algo que já existe — não assuma nenhuma rota/tabela abaixo já está pronta
sem checar o código primeiro.

## Por que isso importa: não reescrever o frontend

O frontend já tem um formato de dado estabelecido para item de catálogo
(`src/data/outfitOptions.js`):

```js
{ id: 'gray', label: 'Calça Cinza', color: '#4b5563' }
// ou, depois de upload:
{ id: 'pants-171234', label: 'Sem nome', image: 'data:image/png;base64,...',
  originalSrc: 'blob:...', crop: {x,y}, zoom: 1 }
```

Qualquer API de produtos deve devolver algo compatível com esse shape (pelo
menos `id`, `label`, e uma URL de imagem no lugar de `image`) pra não forçar
uma reescrita de `OptionCarousel.jsx`/`OutfitPreview.jsx`. O ideal é a API
devolver a imagem já **cortada no aspect ratio da categoria** (ver
`outfitmixer-cropper-fotos` e `ASPECT_RATIOS` em `outfitOptions.js`) — o
frontend não deveria precisar saber cortar fotos vindas do backend, só as
que o próprio usuário sobe na hora.

## Escopo mínimo razoável (nessa ordem)

1. **Produtos (read-only)** — `GET /api/products?category=shirt`,
   `GET /api/products/:id`. Isso sozinho já permite trocar os arrays
   hardcoded `SHIRTS`/`PANTS` por dados reais sem tocar em nenhum componente
   de UI, só no ponto onde `HomePage.jsx` inicializa `catalogs`.
2. **Autenticação** — só depois de existir uma razão real pra logar alguém
   (carrinho persistente entre dispositivos, favoritos, histórico de
   compra). Não adicione login antes disso só porque "todo e-commerce tem".
3. **Carrinho/Pedidos** — `POST /api/cart`, `POST /api/orders`. Definir
   ainda: o "outfit montado" (camiseta+calça escolhidas) vira um único item
   de pedido ou dois itens separados? Isso afeta preço, estoque e nota
   fiscal — decisão de negócio, não técnica; perguntar ao cliente antes de
   modelar a tabela de pedidos.
4. **Admin de produtos** — ligado ao trabalho de
   `outfitmixer-cropper-fotos` (upload + corte de foto do lado admin).

## Coisas que o projeto já decidiu e não deveriam ser reabertas sem motivo

- **Duas categorias hoje**: `shirt`/`pants` (boné e tênis foram removidos a
  pedido do cliente — ver `outfitmixer-componentes-react`). Um schema de
  produto deveria ter `category` como campo livre/extensível, não um enum
  travado nessas duas, já que o cliente pode pedir de volta.
- **Aspect ratio é por categoria, não por produto individual** — se o
  backend for servir fotos pré-cortadas, cortar respeitando
  `ASPECT_RATIOS[category]` do frontend (ou espelhar essa mesma tabela no
  backend) é obrigatório pro alinhamento visual continuar funcionando.
- O projeto já usou nomenclatura em português na UI (label, categoria) —
  manter consistência: nomes de campo em inglês no código/API
  (`category`, `label`, `imageUrl`), texto voltado ao usuário em português.

## Coisas para confirmar com o cliente antes de implementar (não assumir)

- Stack de banco de dados — nada foi escolhido ainda.
- Provedor de pagamento, hospedagem, e-mail transacional — zero decisão
  tomada até agora neste projeto; não copiar decisões de outro projeto do
  mesmo cliente sem perguntar (ele já trocou de provedor de pagamento pelo
  menos uma vez em outro projeto por burocracia de verificação de conta —
  vale confirmar cedo se o CNPJ/verificação está pronto antes de integrar).
- Modelo de frete/estoque — não existe ainda nem uma estimativa.

## Ao implementar

Sempre iniciar o servidor pela mesma disciplina já usada no frontend deste
projeto: rodar local, testar via requisição real (curl ou o navegador), não
assumir que uma rota funciona só porque o código "parece certo" — este
projeto já teve múltiplos bugs reais (crop não salvando, alinhamento
quebrado) que só apareceram testando de verdade, não lendo o código.
