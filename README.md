# Clothing Store

Online store for a clothing brand, with a **virtual outfit mixer** that lets
customers combine pieces and see the look before buying — and an admin panel
where the shop owner uploads and crops the product photos without touching code.

Live at [boardculture.com.br](https://boardculture.com.br).

## What it does

**Store** — catalog, product pages, cart, checkout and order status. Payment
goes through Mercado Pago's hosted checkout, so no card data ever reaches this
server.

**Outfit mixer** — the part that makes it more than a catalog. The customer
picks a top, a bottom and accessories and sees them composed as one look,
instead of imagining the combination from separate photos.

**Admin panel** — uploading a product means choosing a photo and cropping it in
the browser (`react-easy-crop`), not sending files to a developer. The store
owner runs it alone.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | React, Vite, React Router, Swiper |
| Back-end | Node.js, Express |
| Pagamento | Mercado Pago (Checkout Pro) |
| Upload de imagens | Multer, react-easy-crop |

## Rodando localmente

```bash
# API
cd server
npm install
cp .env.example .env    # preencha as credenciais do Mercado Pago
npm start

# site
npm install
npm run dev
```

O front sobe em `http://localhost:5173` e espera a API em
`http://localhost:3000` (configurável em `src/config.js`).

## Decisões que valem explicar

**O provador não usa IA nem 3D.** É composição de imagens com recorte
consistente — o suficiente para o cliente decidir, e sem custo de inferência
por visita. A alternativa cara não resolveria melhor o problema real, que é
"essa calça combina com essa camisa?".

**O recorte acontece no navegador**, antes do upload. Evita processar imagem no
servidor e dá ao lojista o retorno visual imediato de como a foto vai aparecer
na loja.

**Nenhum dado de cartão passa por aqui.** O checkout é hospedado pelo Mercado
Pago; a aplicação só cria a preferência de pagamento e recebe a confirmação.
