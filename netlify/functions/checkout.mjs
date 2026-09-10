// Creates an embedded Stripe Checkout session so payment happens on swolmg.com.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return Response.json({ error: "Payments not configured" }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const q = Math.min(99, Math.max(1, parseInt(body.quantity) || 1));
  const email = String(body.email || "").trim();
  const p = new URLSearchParams({
    mode: "subscription",
    ui_mode: "embedded",
    "line_items[0][price]": process.env.STRIPE_PRICE_ID || "price_1UDZDWCG9PfXcDxhGRL0jgku",
    "line_items[0][quantity]": String(q),
    "line_items[0][adjustable_quantity][enabled]": "true",
    "line_items[0][adjustable_quantity][minimum]": "1",
    "line_items[0][adjustable_quantity][maximum]": "99",
    return_url: "https://swolmg.com/start.html?plan=full&session_id={CHECKOUT_SESSION_ID}",
    allow_promotion_codes: "true",
    "consent_collection[terms_of_service]": "required",
    "custom_fields[0][key]": "business",
    "custom_fields[0][label][type]": "custom",
    "custom_fields[0][label][custom]": "Facility or group name",
    "custom_fields[0][type]": "text",
    client_reference_id: "fac" + q,
    "subscription_data[metadata][facilities]": String(q),
  });
  if (email) p.set("customer_email", email);
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
    body: p,
  });
  const j = await r.json();
  if (!r.ok) return Response.json({ error: j.error?.message || "Stripe error" }, { status: 502 });
  return Response.json({ clientSecret: j.client_secret });
};
export const config = { path: "/api/checkout" };
