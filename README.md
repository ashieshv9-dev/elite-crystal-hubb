# Elite Crystal Hubb

A small, low-cost static storefront for 15-20 crystal and spiritual products. It is designed for GitHub Pages, so there is no paid hosting or backend required.

## What is included

- `index.html`: customer-facing shop with catalog, filters, cart, WhatsApp ordering, and UPI payment intent.
- `admin.html`: simple product control panel for editing product names, prices, stock, descriptions, images, and store settings.
- `assets/js/products.js`: the live catalog and store configuration.
- `assets/images/`: starter product visuals. Replace these with real product photos when available.

## Update your contact and payment details

Open `admin.html` in your browser, edit the Store Settings, then click `Download products.js`.

Replace this file:

```text
assets/js/products.js
```

with the downloaded `products.js`.

Important fields:

```js
whatsappNumber: "919999999999"
upiId: "elitecrystalhubb@upi"
businessName: "Elite Crystal Hubb"
```

Use your real WhatsApp number with country code and your PhonePe Business / UPI ID.

## About PhonePe payments

This site uses a simple UPI payment link because GitHub Pages is static. Customers can place the order on WhatsApp and pay through PhonePe or any UPI app. You manually verify the screenshot or UTR before shipping.

A full PhonePe Payment Gateway integration needs a backend server for API credentials, payment creation, callbacks, and transaction status verification. Add that later when order volume grows.

PhonePe reference:

```text
https://business.phonepe.com/articles/how-to-integrate-a-upi-payment-gateway-into-your-website-or-mobile-app
```

## Host for free on GitHub Pages

1. Create a GitHub account.
2. Create a new repository named `elite-crystal-hubb`.
3. Upload all files from this folder to the repository.
4. Go to repository `Settings`.
5. Open `Pages`.
6. Under `Build and deployment`, choose `Deploy from a branch`.
7. Select branch `main` and folder `/root`.
8. Save.

Your website will be available at:

```text
https://YOUR-GITHUB-USERNAME.github.io/elite-crystal-hubb/
```

## Add real product photos

Place photos inside:

```text
assets/images/
```

Then open `admin.html`, update each product image path, and export `products.js`.

Example:

```text
assets/images/premium-pyrite.jpg
```

## Notes before launch

- Replace placeholder WhatsApp and UPI values.
- Add clear shipping charges and delivery timing in the WhatsApp conversation.
- Use your own product photos for better buyer trust.
- Test one order from your phone before sharing the website.
