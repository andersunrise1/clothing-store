---
name: outfitmixer-loja-skateboard
description: Estrutura de loja de streetwear/skate do outfit mixer — categorias, filtros, atributos, marcas, outfits recomendados. Use ao planejar a expansão do catálogo além do protótipo de 2 categorias, ou ao comparar com referências do setor (ex. boardculture.com.br).
---

# Loja de Streetwear/Skate — Estrutura de Catálogo

**Estado atual: protótipo de 2 categorias sem marca/filtro nenhum.**
`outfit-mixer-store` hoje tem só `shirt` (Camiseta) e `pants` (Calça/
Bermuda), cada uma com uma lista fixa de cores/nomes em
`src/data/outfitOptions.js` — sem conceito de marca, filtro, atributo, ou
recomendação. Este arquivo é um guia pra quando esse catálogo crescer, não
uma descrição de algo que já existe.

## O diferencial real do projeto: o outfit mixer em si

Analisamos um concorrente/referência real do setor
([boardculture.com.br](https://www.boardculture.com.br)) — uma skateshop
grande e madura, com dezenas de subcategorias por marca (shapes, trucks,
rodas, rolamentos, lixas, proteção, e uma seção "Roupas" com exatamente as
mesmas categorias deste projeto: Camisetas, Bermudas, Calças, Moletons).
**Não existe lá nenhuma ferramenta parecida com o outfit mixer** — é um
catálogo tradicional, cada peça é uma foto de produto isolada. Isso confirma
que o "montar o look sem manequim" (ver `outfitmixer-componentes-react`) é
um diferencial real, não algo replicando um padrão já comum — vale proteger
essa característica ao planejar qualquer expansão de catálogo, não deixar a
complexidade de filtros/marcas apagar o que torna o produto diferente.

## Categorias: extensível, mas com histórico de vaivém

Boné e Tênis já existiram no protótipo, foram removidos a pedido do
cliente (fotos disponíveis não permitiam um corte satisfatório —
ver `outfitmixer-cropper-fotos` sobre a limitação real de zoom/aspect
ratio por trás disso), e podem voltar. Qualquer modelagem de categoria deve
ser fácil de expandir/reduzir sem reescrever componentes — o código atual já
é assim (`CATEGORIES` é um objeto simples em `HomePage.jsx`, cada categoria
tem sua entrada em `ASPECT_RATIOS`). Manter esse padrão ao adicionar
categorias novas (bermuda já divide carrossel com calça — "mesma parte do
corpo, mesmo slot" — considerar esse tipo de agrupamento pra outras peças
também, ex. tênis/sandália).

## Marcas e filtros: nada implementado, referência do setor é útil

A referência do setor (boardculture) usa um mega-menu com marca como eixo
principal de navegação dentro de cada categoria de produto (ex. Camisetas →
Bronson/Classic/Creature/Independent/OJ/Salad X/Santa Cruz/Tentacles/
Thrasher), mais filtros de ordenação (mais vendidos, preço, mais recentes,
avaliação, nome A-Z/Z-A) e paginação configurável (18/24/36 itens). Isso é
um ponto de partida razoável de UX pro setor, mas **decisão de escopo
(quantas marcas, quais filtros valem a pena num catálogo pequeno) depende do
tamanho real do catálogo** — não vale implementar filtro de "mais bem
avaliado" antes de existir avaliação nenhuma, por exemplo.

## Atributos de produto: o que falta modelar

Hoje um item de catálogo é só `{id, label, color}` ou, depois de upload,
`{id, label, image, originalSrc, crop, zoom}` — nenhum atributo de venda
real (preço, tamanho, estoque, marca, descrição). Ao modelar isso (provável
que vá acontecer junto com `outfitmixer-backend-ecommerce`), manter em
mente que os campos usados pela UI hoje (`id`, `label`, imagem) não podem
sumir/mudar de nome sem atualizar `OptionCarousel.jsx`/`OutfitPreview.jsx`.

## "Outfits recomendados" — ainda não existe, é uma extensão natural

O nome desta skill menciona isso, mas **não há nenhuma lógica de
recomendação implementada** — hoje o usuário escolhe camiseta e calça
manualmente nos dois carrosséis. Uma extensão natural seria sugerir
combinações pré-montadas (ex. "esse look" = índice de camiseta X + calça Y),
o que é simples de representar (`{shirtId, pantsId, label}`) e se encaixa
no `select()` já existente em `HomePage.jsx` — aplicar um outfit recomendado
seria só chamar `select('shirt', shirtId)` e `select('pants', pantsId)` em
sequência. Não construir isso especulativamente sem um pedido real do
cliente; é fácil de adicionar quando pedido, por causa de como o estado já
está modelado.

## Antes de expandir o catálogo, confirmar com o cliente

- Quantas marcas/categorias reais existem hoje (o protótipo usa fotos de
  teste e nomes genéricos como "Calça Cinza").
- Se o modelo de negócio é venda de peça avulsa, do "look montado", ou os
  dois — isso afeta preço, estoque e a modelagem de pedido (ver
  `outfitmixer-backend-ecommerce`, mesma pergunta em aberto lá).
- Fotos reais por categoria — a qualidade/enquadramento da foto (flat-lay
  vs. modelo de corpo inteiro) afeta diretamente qual aspect ratio funciona
  bem (ver `outfitmixer-cropper-fotos`); vale alinhar um guia de fotografia
  pro cliente antes de escalar pra muitos produtos, pra não repetir o
  processo de tentativa-e-erro de calibração de proporção feito no
  protótipo.
