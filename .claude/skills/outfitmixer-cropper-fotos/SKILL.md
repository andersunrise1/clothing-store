---
name: outfitmixer-cropper-fotos
description: Ferramenta de corte de fotos do outfit mixer (react-easy-crop) — como funciona, bugs reais já corrigidos, e o que falta para virar uma ferramenta admin completa com remoção de fundo. Use ao mexer em UploadCropModal.jsx ou ao planejar um crop tool admin.
---

# Ferramenta de Corte de Fotos

`src/components/UploadCropModal.jsx` usa `react-easy-crop` pra deixar o
usuário (hoje, qualquer visitante — não é uma ferramenta "admin" separada
ainda) enviar uma foto e cortá-la no aspect ratio fixo da categoria antes de
salvar. Este arquivo documenta comportamento real da biblioteca descoberto
testando (não está nos docs oficiais dela) e o que falta pra virar uma
ferramenta administrativa de verdade com remoção de fundo.

## Limitação fundamental: zoom não "revela" imagem além de um limite

Esta é a descoberta mais importante e menos óbvia do projeto inteiro,
achada depurando um bug real ("a calça só aparece até o joelho mesmo no
zoom mínimo"):

**Abaixo do zoom de "cobertura" (zoom=1), a biblioteca NÃO faz letterbox
(mostrar a foto inteira com borda vazia) — ela trava o TAMANHO da janela de
corte e só desloca a posição.** Provado instrumentando `onCropComplete`:
numa foto de 400×1600px cortada num quadro de aspecto 0,75, tanto em
zoom=1 quanto em zoom=0,3 (mínimo) a janela de corte devolvida tinha
exatamente `{width:400, height:533}` — só o `y` de offset mudava. Ou seja,
**a largura da foto-fonte é um teto rígido pra janela de corte**, e reduzir
o zoom abaixo do necessário pra cobrir não aumenta quanto da foto cabe.

Consequência prática: se uma foto de corpo inteiro só mostra da cintura ao
joelho não importa o quanto você reduza o zoom, **o problema não é o
zoom — é a proporção (`aspect`) do quadro estar apertada demais pra aquela
foto.** A correção é sempre ajustar `ASPECT_RATIOS` (ver
`outfitmixer-componentes-react`), nunca instruir o usuário a "reduzir mais
o zoom" quando ele já está no mínimo.

## Bug real corrigido: arrastar rápido perde a posição final

`react-easy-crop` atualiza a posição do arraste via `requestAnimationFrame`
internamente. Se o usuário arrasta e solta rápido, `onCropComplete` (que
populariza o estado usado pra exportar a imagem) pode disparar **antes**
desse último frame ser aplicado — a foto visualmente já pulou pro lugar
certo, mas o dado salvo ainda reflete a posição de antes. Corrigido
adicionando `onCropAreaChange={onCropComplete}` no componente `<Cropper>`
— esse callback dispara de novo sempre que a posição muda (inclusive a
atualização atrasada), então sempre acaba capturando o valor final correto.
**Não remova essa prop** sem entender essa race condition primeiro.

## Bug de UX corrigido: botão Salvar sem feedback de "ainda carregando"

Existe uma janela pequena (geralmente imperceptível, mas real) entre soltar
uma foto e `croppedAreaPixels` ficar pronto. Antes disso, clicar em Salvar
não fazia nada, sem nenhum aviso visual — parecia bug de salvamento. Hoje o
botão fica `disabled` até `croppedAreaPixels` existir, com uma sobreposição
"Carregando imagem...". Se reaparecer alguma reclamação de "clico em salvar
e não acontece nada", confirme primeiro se esse guard ainda está no lugar
antes de investigar mais fundo.

## Cover vs. contain: onde cada tratamento é usado, e por quê

- **Miniatura do carrossel** (`OptionCarousel.jsx`, círculo pequeno):
  `object-cover` — corta o que sobra pra preencher o círculo.
- **Preview grande** (`OutfitPreview.jsx`): `object-contain` — nunca corta,
  só encolhe com barra vazia se sobrar espaço.

**A mesma imagem salva aparece diferente nos dois lugares por causa dessa
diferença de CSS**, não porque o corte foi feito duas vezes. Isso já gerou
confusão real do cliente ("salvei mas não aparece igual") — sempre checar
qual dos dois ele está olhando antes de assumir que é bug de dado.

## Instrução de corte pro usuário (texto atual do hint)

O texto dentro do modal já foi reescrito uma vez pra deixar isso explícito:
encostar a **peça em si** (não braços/mãos/fundo) nas bordas do quadro —
numa foto de modelo de corpo inteiro, isso quase sempre significa dar
bastante zoom e cortar os braços de propósito pra fora do quadro. Verificado
com teste real: uma foto com "braços largos, perna estreita" só alinha
corretamente com a camiseta depois de zoom suficiente pra excluir os braços
(tecido preenchendo ~99% da largura da imagem exportada, contra ~40% no
zoom padrão).

## O que falta para virar uma "ferramenta admin de crop de fotos" de verdade

Hoje qualquer visitante usa este modal — não existe conceito de "admin"
separado, nem persistência real (fotos vivem só em `localStorage`, ver
`outfitmixer-componentes-react`). Para o cenário admin/e-commerce descrito
no nome desta skill, falta:

1. **Remoção de fundo** — não implementado. `getCroppedImage` em
   `utils/cropImage.js` só recorta um retângulo (canvas `drawImage` com a
   área do corte); não há segmentação de sujeito nem alpha matting. Se for
   implementar, considerar rodar isso no backend (custo de processamento,
   modelos de remoção de fundo geralmente não rodam bem só no navegador) —
   ver `outfitmixer-backend-ecommerce`. Não assumir que dá pra fazer só com
   canvas 2D no cliente.
2. **Persistência real da foto original** — hoje `originalSrc` (blob: URL)
   é descartado ao salvar no localStorage porque não sobrevive a reload.
   Uma ferramenta admin de verdade precisaria subir a foto original pro
   backend/storage antes de permitir reabrir o corte depois.
3. **Separação de papel** — decidir se upload de foto continua disponível
   pra qualquer visitante (prototipagem/demo) ou vira exclusivo de uma tela
   admin autenticada — depende do rumo do backend (`outfitmixer-backend-
   ecommerce`).

## Como testar mudanças nesta ferramenta

Simulação de arquivo real via `DataTransfer` + evento `drop` sintético
(input de arquivo nativo não é simulável em automação de navegador).
Zoom/posição via manipulação direta do `<input type=range>` (setter nativo +
evento `input`) funciona de forma confiável; arraste do mouse dentro do
Cropper é **não confiável de testar em ambiente automatizado sem aba
visível** (a biblioteca usa `requestAnimationFrame`, que fica suspenso
quando a aba não está sendo renderizada) — teclas de seta (`ArrowUp/Down`)
são uma alternativa síncrona validada pra testar reposicionamento sem essa
limitação.
