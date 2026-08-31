# Ten Fabrics Store

A small storefront: a landing page per product, Stripe Checkout for payment, and
payment-verified delivery. Built to hold more than one product — see `products.js`.

## How it works

1. `/` — landing page, built from `products.js`. Each product gets a card with a "Get it" button.
2. Clicking buy → `POST /checkout/:slug` creates a Stripe Checkout Session and redirects to Stripe's hosted payment page. Card details never touch this server.
3. After payment → Stripe redirects to `/success`, which verifies the session with Stripe's API (checks `payment_status === "paid"`) before showing anything.
4. The success page links to `/download/:slug`, which re-verifies the same Stripe session before serving the actual file from `/private`. Nobody can reach the file without a real, paid Stripe session.

## Setup — do this once

### 1. Stripe account + product

1. Sign up at stripe.com if you haven't already.
2. Stay in **Test mode** (top-right toggle) while you set everything up — you'll flip to Live mode at the end.
3. Dashboard → **Product catalog** → **Add product**:
   - Name: `The First Collection Blueprint`
   - Pricing: **One time**, €9.90
   - Save, then open the price you just created and copy its ID — starts with `price_...`
4. Dashboard → **Developers → API keys** → copy the **Secret key** (starts with `sk_test_...` in test mode).

### 2. Replit

1. Create a new Repl → **Node.js** template (or import this folder directly if Replit gives you that option).
2. Upload/paste in these files: `server.js`, `products.js`, `package.json`, `.gitignore`, and the `private/` folder with `the-first-collection-blueprint.html` inside it. (`.env.example` is just a reference — don't upload real secrets as a file.)
3. Open the **Secrets** panel (lock icon in the left sidebar) and add:
   - `STRIPE_SECRET_KEY` → your `sk_test_...` key
   - `STRIPE_PRICE_FIRST_COLLECTION_BLUEPRINT` → your `price_...` ID
4. In the Replit shell, run `npm install`.
5. Click **Run**. Replit will give you a live URL (something like `https://ten-fabrics-store.yourname.repl.co`).

### 3. Test it for real before going live

1. Open your Replit URL, click **Get the Blueprint**.
2. On Stripe's checkout page, use a test card: `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.
3. Confirm you land on the success page and **Open The First Collection Blueprint** actually shows the course.
4. Try hitting `/download/first-collection-blueprint` directly with no `session_id` — it should refuse (this confirms the paywall actually works).

### 4. Go live

1. In Stripe, flip to **Live mode** and repeat step 1 (add the product again — test and live catalogs are separate).
2. Get the **live** secret key and **live** price ID.
3. Update the two Replit Secrets with the live values.
4. Add a bank account under Stripe → **Settings → Payouts** if you haven't already — that's how you actually get paid.

## Adding a second product later

1. Drop the product's file in `/private`.
2. Create its Product + Price in Stripe (test and live).
3. Add a Replit Secret for its price ID.
4. Add one entry to the array in `products.js` — the landing page and checkout picks it up automatically, no other changes needed.

## What this deliberately doesn't do (yet)

- No email receipt/delivery — the download link lives on the success page only. Fine for a €9.90 impulse purchase; worth adding (e.g. via Stripe's built-in email receipts, or a proper email-on-webhook flow) once volume justifies it.
- No refund automation — handle refunds manually from the Stripe Dashboard for now.
- No analytics — Stripe's own Dashboard already shows you sales/revenue without extra setup.
