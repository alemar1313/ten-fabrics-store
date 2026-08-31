require("dotenv").config();
const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const products = require("./products");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 3000;

function baseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
}

function money(cents, currency) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);
}

// ---------------------------------------------------------------------
// Shared design tokens — same palette/type system as the product itself
// ---------------------------------------------------------------------
const STYLES = `
  :root{
    --paper:#F6F1E7; --card:#FFFDF8; --card-2:#FBF6EC;
    --ink:#201C16; --ink-soft:#6E6659; --ink-faint:#9A9182;
    --line:#DFD5BE; --line-strong:#C9BC9E;
    --accent:#24435F; --accent-ink:#173145;
    --accent-soft:#E3EAEF; --accent-soft-line:#C3D2DD;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --paper:#151109; --card:#1D1811; --card-2:#231D14;
      --ink:#EDE6D5; --ink-soft:#AFA48D; --ink-faint:#7C7361;
      --line:#332B1E; --line-strong:#463C29;
      --accent:#8CB2D2; --accent-ink:#CFE0EC;
      --accent-soft:#20303C; --accent-soft-line:#2D4152;
    }
  }
  *{box-sizing:border-box;}
  body{
    margin:0; background:var(--paper); color:var(--ink);
    font-family:"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
    line-height:1.6;
  }
  a{ color:var(--accent); }
  .wrap{ max-width:46rem; margin:0 auto; padding:0 1.5rem; }
  .eyebrow{
    font-family:"IBM Plex Mono", monospace; font-size:.78rem; letter-spacing:.12em;
    text-transform:uppercase; color:var(--accent); display:flex; align-items:center; gap:.6rem;
    margin:3.5rem 0 1rem;
  }
  .eyebrow::before{ content:""; width:1.4rem; height:1px; background:var(--accent); }
  h1{
    font-family:"Big Shoulders", sans-serif; font-weight:900; text-transform:uppercase;
    font-size:clamp(2.2rem, 5.5vw, 3.4rem); line-height:.98; letter-spacing:-.01em;
    margin:0 0 1rem; text-wrap:balance;
  }
  h1 .accent{ color:var(--accent); }
  .deck{ font-size:1.08rem; color:var(--ink-soft); max-width:34rem; }
  .deck b{ color:var(--ink); font-weight:600; }
  .specsheet{ margin:2.2rem 0; border:1px solid var(--line); background:var(--card); }
  .specrow{ display:grid; grid-template-columns:8rem 1fr; border-top:1px solid var(--line); }
  .specrow:first-child{ border-top:none; }
  .specrow .k{
    font-family:"IBM Plex Mono", monospace; font-size:.68rem; letter-spacing:.08em; text-transform:uppercase;
    color:var(--ink-faint); padding:.85rem 1rem; border-right:1px solid var(--line); background:var(--card-2);
  }
  .specrow .v{ padding:.85rem 1.1rem; font-size:.94rem; }
  .lessons{ margin:2rem 0; padding:0; list-style:none; }
  .lessons li{
    display:flex; gap:.9rem; align-items:baseline; padding:.7rem 0; border-top:1px solid var(--line); font-size:.95rem;
  }
  .lessons li:last-child{ border-bottom:1px solid var(--line); }
  .lessons .n{ font-family:"IBM Plex Mono", monospace; color:var(--accent); flex:none; width:1.5rem; }
  .buybox{
    margin:2.5rem 0; border:1px solid var(--accent-soft-line); background:var(--accent-soft);
    padding:1.5rem 1.6rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;
  }
  .price{ font-family:"Big Shoulders", sans-serif; font-weight:800; font-size:2.1rem; color:var(--accent-ink); }
  .price small{ font-family:"IBM Plex Sans", sans-serif; font-weight:500; font-size:.9rem; display:block; color:var(--ink-soft); }
  button.buy{
    font-family:"IBM Plex Sans", sans-serif; font-weight:600; font-size:1rem;
    background:var(--accent); color:var(--paper); border:none; padding:.9rem 1.6rem; cursor:pointer;
  }
  button.buy:hover{ opacity:.92; }
  .closer{ margin:3rem 0 5rem; font-size:.92rem; color:var(--ink-soft); }
  .notice{
    margin:1.5rem 0; padding:.9rem 1.1rem; border:1px solid var(--line-strong); background:var(--card-2); font-size:.9rem;
  }
  footer{ border-top:1px solid var(--line); padding:2rem 0; font-size:.8rem; color:var(--ink-faint); font-family:"IBM Plex Mono", monospace; }
  .success-box{ margin:3rem 0; padding:1.6rem; border:1px solid var(--accent-soft-line); background:var(--accent-soft); }
  .success-box a.open{
    display:inline-block; margin-top:1rem; background:var(--accent); color:var(--paper); text-decoration:none;
    padding:.8rem 1.4rem; font-weight:600; font-family:"IBM Plex Sans", sans-serif;
  }
`;

const FONT_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders:wght@500;700;900&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">';

function layout({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${FONT_LINK}
<style>${STYLES}</style>
</head>
<body>
${body}
<footer><div class="wrap">TEN FABRICS &middot; <a href="https://tenfabrics.com">tenfabrics.com</a></div></footer>
</body>
</html>`;
}

function renderProductCard(p) {
  const lessonItems = p.lessons
    .map((l, i) => `<li><span class="n">0${i + 1}</span>${l}</li>`)
    .join("");
  return `
  <section class="wrap" id="${p.slug}">
    <div class="eyebrow">By Ten Fabrics — for first-time fashion founders</div>
    <h1>${p.name.replace("Blueprint", '<span class="accent">Blueprint</span>')}</h1>
    <p class="deck">${p.tagline}</p>

    <div class="specsheet">
      <div class="specrow"><div class="k">What it is</div><div class="v">${p.description}</div></div>
      <div class="specrow"><div class="k">Format</div><div class="v">An interactive guide you open in your browser — instant access after purchase.</div></div>
    </div>

    <ul class="lessons">${lessonItems}</ul>

    <form class="buybox" method="POST" action="/checkout/${p.slug}">
      <div class="price">${money(p.price, p.currency)}<small>one-time, instant access</small></div>
      <button class="buy" type="submit">Get the Blueprint</button>
    </form>
  </section>`;
}

function renderLanding(req) {
  const canceled = req.query.canceled ? `<div class="wrap"><div class="notice">Checkout canceled — nothing was charged. Whenever you're ready, the button below still works.</div></div>` : "";
  const cards = products.map(renderProductCard).join("\n");
  return layout({
    title: "Ten Fabrics — Digital Guides",
    body: `${canceled}${cards}
    <div class="wrap closer">If you get to the end of this and you're ready to actually produce the collection you've just planned, that's exactly what Ten Fabrics does — <a href="https://tenfabrics.com">talk to us when you're there</a>.</div>`,
  });
}

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(renderLanding(req));
});

app.post("/checkout/:slug", async (req, res) => {
  const product = products.find((p) => p.slug === req.params.slug);
  if (!product) return res.status(404).send("Product not found.");
  if (!product.stripePriceId) {
    return res
      .status(500)
      .send("This product isn't fully configured yet — its Stripe Price ID secret is missing.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl(req)}/success?session_id={CHECKOUT_SESSION_ID}&product=${product.slug}`,
      cancel_url: `${baseUrl(req)}/?canceled=1#${product.slug}`,
    });
    res.redirect(303, session.url);
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err.message);
    res.status(502).send("Couldn't start checkout — please try again in a moment.");
  }
});

app.get("/success", async (req, res) => {
  const { session_id, product: slug } = req.query;
  const product = products.find((p) => p.slug === slug);
  if (!session_id || !product) return res.status(400).send("Missing or invalid order reference.");

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (err) {
    return res.status(400).send("Couldn't verify this order.");
  }

  if (session.payment_status !== "paid") {
    return res.status(402).send("This order hasn't been paid yet.");
  }

  res.send(
    layout({
      title: `You're in — ${product.name}`,
      body: `
      <section class="wrap">
        <div class="eyebrow">Order confirmed</div>
        <h1>You're <span class="accent">in.</span></h1>
        <div class="success-box">
          <p>Thanks — your purchase of <strong>${product.name}</strong> is confirmed. It's ready below.</p>
          <a class="open" href="/download/${product.slug}?session_id=${encodeURIComponent(session_id)}">Open ${product.name} &rarr;</a>
        </div>
        <p class="closer">Bookmark this page to come back to it — the link above stays tied to this order.</p>
      </section>`,
    })
  );
});

app.get("/download/:slug", async (req, res) => {
  const product = products.find((p) => p.slug === req.params.slug);
  const { session_id } = req.query;
  if (!product || !session_id) return res.status(400).send("Missing order reference.");

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (err) {
    return res.status(400).send("Couldn't verify this order.");
  }

  if (session.payment_status !== "paid") {
    return res.status(402).send("This order hasn't been paid yet.");
  }

  res.sendFile(path.join(__dirname, "private", product.fileName));
});

app.get("/health", (req, res) => res.send("ok"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Ten Fabrics store listening on port ${PORT}`);
});
