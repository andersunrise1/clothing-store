---
name: outfitmixer-backend-ecommerce
description: Backend Node.js/Express da Board Culture — produtos, admin, e o que falta pra carrinho/pedidos. Use ao mexer em server/ ou ao continuar o roteiro de e-commerce (Fase 2 em diante).
---

# Backend E-commerce (server/)

**Estado real (Fase 2 do roteiro concluída)**: existe um backend de
verdade em `server/` — Express + SQLite (`node:sqlite`, nativo do Node,
sem módulo compilado), com login de admin e cadastro de produto já
funcionando ponta a ponta, testado via requisição real e pela UI. O
projeto inteiro foi renomeado de `outfit-mixer-store` para
`Boardculture.com.br` — este é o site real do cliente (boardculture.com.br
já existe), não um protótipo genérico.

## Estrutura

```
server/
  src/
    index.js           Express app
    db.js               SQLite: schema da tabela products
    routes/
      products.js        GET público (sem outfit_mixer_*)
      admin.js            login, CRUD de produto (autenticado)
    middleware/
      auth.js             tokens assinados, sem estado (ver abaixo)
  data/                 boardculture.sqlite (gitignored)
  uploads/              fotos de produto (gitignored)
  .env                  ADMIN_USERNAME/PASSWORD/TOKEN_SECRET (gitignored)
  .env.example          mesma forma, sem os valores reais
```

**`data/` e `uploads/` são IRMÃOS de `src/`, não estão dentro dela — isso
não é estético, é obrigatório.** `node --watch` (usado no `npm run dev`
deste server) resolve `--watch-path` apontando pra um ARQUIVO como "observe
a pasta inteira que contém esse arquivo" (limitação de granularidade do
watcher, não bug do Node) — com o banco de dados morando do lado de
`db.js`, todo INSERT/UPDATE tocava a pasta observada e reiniciava o
servidor, derrubando qualquer sessão de admin em memória no meio de uma
requisição. Se algum dia mover `data/`/`uploads/` de volta pra dentro de
`src/`, esse bug volta.

## Autenticação: token assinado, sem estado nenhum guardado

`middleware/auth.js` não guarda sessão em memória (`Map`/`Set`) —
o token É `payload.assinatura` (HMAC-SHA256 com `ADMIN_TOKEN_SECRET` do
`.env`), verificado recalculando a assinatura, sem nenhuma consulta.
Isso não foi só "boa prática" — foi a correção de um bug real: mesmo
depois de resolver o problema do `--watch-path` acima, o servidor ainda
reiniciava sozinho de vez em quando durante os testes (causa exata não
identificada — meio suspeito de ser o OneDrive sincronizando arquivos da
pasta do projeto, já que ele mora em `OneDrive/Desktop/`), e cada reinício
apagava qualquer token guardado em memória, derrubando o admin no meio do
cadastro de um produto. Com token assinado sem estado, um reinício do
servidor (por deploy, crash, ou qualquer outra causa) nunca mais desloga
ninguém — só rotacionar `ADMIN_TOKEN_SECRET` de propósito faz isso.

Login único (`ADMIN_USERNAME`/`ADMIN_PASSWORD` do `.env`) — não existe
tabela de usuários nem múltiplos admins ainda, o que bate exatamente com o
pedido original ("o admin faz upload").

## O fluxo híbrido de foto — decisão já validada com o cliente

Pergunta que o cliente fez explicitamente: a foto que o admin sobe pro
catálogo entra sozinha no Outfit Mixer, ou é melhor ele subir separado pra
manter o alinhamento calça/camiseta? Resposta implementada e aprovada:
**hyíbrido**. `POST /api/admin/products` aceita:

- `name`, `price`, `category`, `image` (arquivo) — sempre obrigatórios,
  é a foto normal do catálogo, qualquer enquadramento.
- `outfitMixerCategory` (`'shirt'` ou `'pants'`) + `outfitMixerImage`
  (data URL) — **opcionais**, só presentes quando o admin marca "Usar
  também no Outfit Mixer?" no formulário (`AdminPage.jsx`). Essa segunda
  imagem é gerada reabrindo a MESMA foto recém-selecionada dentro do
  `UploadCropModal` já existente (sem pedir upload de novo) — ver
  `outfitmixer-cropper-fotos` pra entender por que essa segunda imagem
  precisa ser um corte SEPARADO da foto de catálogo, não o mesmo arquivo
  reaproveitado direto.

`routes/products.js` (a listagem PÚBLICA) omite de propósito as colunas
`outfit_mixer_*` — só a Fase 4 (integrar o catálogo real ao Outfit Mixer)
vai precisar consultar isso, e não faz sentido vazar esse detalhe de
implementação pra quem só está navegando a loja.

## Escopo ainda não construído (não assumir que existe)

1. **Carrinho/Pedidos** — Fase 3 do roteiro. Decisão de negócio em aberto:
   o "look montado" (camiseta+calça do Outfit Mixer) vira um pedido de
   dois itens separados, ou algo unificado? Perguntar ao cliente antes de
   modelar a tabela de pedidos.
2. **Pagamento** — cliente já decidiu o provedor (perguntar qual foi,
   ainda não registrado aqui) mas nada foi integrado.
3. **Fase 4 (Outfit Mixer com catálogo real)** — hoje `OutfitMixerPage.jsx`
   ainda usa os dados de teste em `data/outfitOptions.js`, não os produtos
   reais cadastrados no admin. Ligar isso significa: `GET
   /api/products?hasOutfitMixer=true` (ou filtro equivalente) devolvendo
   só produtos com `outfit_mixer_category` preenchido, agrupados por
   `shirt`/`pants`.
4. **Múltiplos admins/papéis, hospedagem de imagem em nuvem, e-mail
   transacional** — nada disso foi decidido ou começado.

## Ao continuar este backend

Testar sempre com requisição real (curl com `--form-string` pra campos de
texto multipart — `-F` sozinho interpreta `;` dentro do valor como início
de `;type=`/`;filename=`, cortando o valor no meio; isso já gerou um falso
alarme de "bug" que na verdade era só o comando de teste malformado) e
pela UI de verdade, não só lendo o código — este projeto já teve vários
bugs reais que só apareceram testando (ver `outfitmixer-cropper-fotos` e
`outfitmixer-componentes-react` pra outros exemplos dessa mesma lição no
frontend).
