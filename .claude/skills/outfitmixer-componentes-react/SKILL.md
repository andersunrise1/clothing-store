---
name: outfitmixer-componentes-react
description: Componentes React do outfit mixer — carrosséis (Swiper), preview "vestido em alguém" sem manequim, ferramenta de corte de fotos, e as convenções de Tailwind do projeto. Use ao criar ou mexer em qualquer componente de UI do outfit-mixer-store.
---

# Componentes React do Outfit Mixer

Guia de arquitetura e decisões já validadas para a UI do `outfit-mixer-store`
(React + Vite + Tailwind v4 + Swiper.js + react-easy-crop). Antes de mexer em
qualquer componente, leia este arquivo — várias decisões aqui vieram de
tentativa e erro real, não são arbitrárias.

## Estrutura atual

```
src/
  pages/HomePage.jsx           estado central (catalogs, selected, upload/edit modal)
  components/
    OptionCarousel.jsx         carrossel genérico por categoria (Swiper)
    OutfitPreview.jsx          pilha "vestida em alguém" sem manequim
    UploadCropModal.jsx        upload + drag&drop + crop (react-easy-crop)
  data/outfitOptions.js        catálogo seed + ASPECT_RATIOS por categoria
  utils/cropImage.js           canvas -> PNG cropado
  utils/persistence.js         localStorage (ver seção própria abaixo)
```

Categorias hoje: `shirt` (Camiseta) e `pants` (Calça/Bermuda). O código é
genérico por categoria (dirigido pelo objeto `CATEGORIES` em `HomePage.jsx`),
então adicionar uma categoria nova é só adicionar uma entrada — boné e tênis
já existiram e foram removidos por pedido do cliente, então o padrão pra
reintroduzir categorias já está testado.

## A decisão mais importante: sem manequim, sem foto de pessoa

Tentamos **duas vezes** simular um manequim (foto real com tratamento de cor,
depois um SVG vetorial) e as duas foram rejeitadas explicitamente pelo
cliente ("isso não ficou bom, temos que tirar esse desenho"). A solução final
e aprovada: cada peça tem seu próprio carrossel de seleção, e um bloco
separado (`OutfitPreview`) empilha as peças escolhidas **coladas uma na
outra, sem manequim nenhum** — simula "vestido em alguém" só pela forma como
as fotos se encaixam.

**Não reintroduza um manequim/boneco/silhueta sem confirmar explicitamente
com o cliente primeiro** — já foi tentado e rejeitado duas vezes.

## O truque matemático do alinhamento (cintura = barra da camiseta)

Este é o ponto mais sutil do projeto inteiro. Em `OutfitPreview.jsx`:

```jsx
function Swatch({ item, aspect }) {
  const style = { flexGrow: 1 / aspect, flexBasis: 0 }
  // ...
  <img className="h-full w-full object-contain" />
}
```

Cada bloco usa `flexGrow = 1 / aspectRatio` (**linear, não amortecido**) —
isso garante que, dado que todo bloco compartilha a mesma largura, a largura
*visível* da peça (não do bloco, da peça em si) fica idêntica entre
categorias. A prova: se `Hbox_i = altura total * (1/aspect_i) / soma(1/aspect_j)`,
então `Hbox_i * aspect_i` é uma CONSTANTE, igual para toda categoria — e é
essa constante que determina a largura final renderizada via
`object-contain`.

**Já tentamos amortecer isso com `Math.sqrt(1/aspect)`** pra deixar os blocos
mais parecidos em tamanho, e isso **quebra o alinhamento** — a calça parou de
bater com a camiseta. Se precisar rebalancear proporções, mexa nos valores de
`ASPECT_RATIOS`, nunca na fórmula do `flexGrow`.

`object-contain` (não `object-cover`) é obrigatório — `cover` corta a peça
pra preencher a caixa, quebrando a garantia de "peça inteira sempre visível".

## Altura do preview: deriva da altura do carrossel, não o contrário

`OutfitPreview` mede a altura real do carrossel ao lado (via `ResizeObserver`
+ `useLayoutEffect`) e calcula a **própria largura** a partir dela:
`width = height / soma(1/aspect)`. Isso já passou por várias iterações:

1. Largura fixa, altura derivada → às vezes o preview ficava MUITO maior que
   o carrossel (>1200px), feio e desproporcional.
2. Altura fixa (= altura do carrossel), largura derivada → **abordagem
   atual**, correta. Sempre alinhado, sem espaço vazio sobrando embaixo do
   carrossel.

Se decidir mudar essa lógica de novo, teste sempre as duas coisas juntas:
altura do preview == altura do carrossel, E largura da imagem == largura da
caixa (sem sobra nas laterais).

## Proporções das peças (ASPECT_RATIOS) não são arbitrárias

Atualmente: `shirt: 1`, `pants: 0.65`. O valor da calça foi calculado a
partir de proporção real de corpo humano (padrão de 8 cabeças usado em
ilustração de moda: tronco ≈ 2,5-3 cabeças, perna ≈ 4 cabeças → razão
perna:tronco ≈ 1,5:1). Como a altura de cada bloco é proporcional a
`1/aspect`, `pantsAspect = shirtAspect / 1.5`.

**Antes de mudar esses números de novo**, entenda a causa raiz de qualquer
reclamação de "corta a perna" ou "tá desproporcional":
- Corta a perna → a ferramenta de corte trava numa janela de tamanho fixo
  (ver `outfitmixer-cropper-fotos`), não é sobre "diminuir mais o zoom".
- Desproporcional → é o `flexGrow=1/aspect` fazendo o trabalho dele; ajuste
  o valor de aspecto, não a fórmula.

## Convenções de Tailwind específicas deste projeto

- **CSS do Swiper vence classes do Tailwind na cascata.** `swiper/css`
  carrega depois e tem regras tipo `.swiper { padding: 0 }` que ganham de
  `pb-8`. Sempre que precisar sobrescrever algo do Swiper, use `style={{ }}`
  inline, não classe Tailwind.
- Miniaturas de carrossel usam `object-cover` (preenche o círculo, corta o
  que sobra) — de propósito diferente do preview grande, que usa
  `object-contain`. Se o cliente disser "salvei mas não aparece igual", é
  quase sempre essa diferença de tratamento CSS entre os dois lugares, não
  um bug de salvamento — confirme visualmente qual dos dois ele está
  olhando antes de investigar código.
- Tamanhos de UI (miniatura, texto, botões) já foram aumentados uma vez a
  pedido do cliente depois que boné/tênis saíram (sobrou espaço). Miniatura
  atual: `h-28 w-28`. Se adicionar categoria nova, ajuste esses tamanhos de
  novo se a UI ficar apertada.

## Persistência (localStorage)

`utils/persistence.js` salva `catalogs`+`selected` no localStorage a cada
mudança, carregado uma vez no mount via `useState(buildInitialState)`.
Detalhe importante: `originalSrc` (blob URL), `crop` e `zoom` são
**removidos antes de salvar** — blob URLs não sobrevivem a um reload, então
persistir isso seria guardar uma referência morta. Só `image` (a foto já
cortada, um `data:` URL de verdade) é persistido. Editar (reabrir o crop)
uma peça restaurada de uma sessão anterior exige reenviar a foto — isso é
uma limitação conhecida e aceita, não um bug pra corrigir "de graça".

## Como testar mudanças nesta UI

Sem suíte de testes automatizados neste projeto. Fluxo de verificação manual
usado em toda a sessão: `npm run dev -- --port 5180`, abrir no navegador,
simular upload via `DataTransfer`+evento `drop` sintético (arquivos reais não
dão pra simular por input nativo em automação), medir alinhamento via
`getBoundingClientRect()` e amostragem de pixel em canvas (não confiar em
screenshot — historicamente instável neste ambiente). Sempre rodar
`npm run build` depois de qualquer mudança estrutural e apagar `dist/` (não
versionado).
