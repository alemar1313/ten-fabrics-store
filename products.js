// Product catalog — the single source of truth for what's for sale.
//
// To add a new product later:
//   1. Drop its file in /private
//   2. Create a Product + one-time Price for it in the Stripe Dashboard
//   3. Add the Price ID as a new Replit Secret
//   4. Add one entry below
// No other code changes needed — the landing page and checkout routes
// read this list automatically.

module.exports = [
  {
    slug: "first-collection-blueprint",
    name: "The First Collection Blueprint",
    tagline: "The 5 things to decide, in order, before you talk to a single manufacturer.",
    description:
      "A production-ready roadmap for your first apparel collection — 5 practical lessons, from validating your idea to sample-to-production, written by the team that runs this process for founders every day.",
    lessons: [
      "Validate Your Idea & Define Your Target Customer",
      "Plan Your Collection: SKUs, Quantities & Costing",
      "Make Your Product Manufacturer-Ready",
      "Find, Vet & Negotiate With a Manufacturer",
      "From Sample to Production",
    ],
    price: 990, // in cents
    currency: "eur",
    fileName: "the-first-collection-blueprint.html",
    stripePriceId: process.env.STRIPE_PRICE_FIRST_COLLECTION_BLUEPRINT,
  },
];
