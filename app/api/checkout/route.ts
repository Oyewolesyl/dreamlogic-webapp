import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const priceIds: Record<string, string | undefined> = {
  seeker: process.env.STRIPE_PRICE_SEEKER,
  depth: process.env.STRIPE_PRICE_DEPTH,
  practitioner: process.env.STRIPE_PRICE_PRACTITIONER,
  practice: process.env.STRIPE_PRICE_PRACTICE,
  research: process.env.STRIPE_PRICE_RESEARCH
};

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "stripe secret key is not set" }, { status: 500 });
  }

  const { plan, email } = await request.json();
  const price = priceIds[plan];
  if (!price) {
    return NextResponse.json({ error: `stripe price id is missing for ${plan}` }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://dreamlogic-webapp.vercel.app";
  const stripe = new Stripe(secret);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email || undefined,
    line_items: [{ price, quantity: 1 }],
    metadata: { plan },
    success_url: `${origin}/?checkout=success&plan=${plan}`,
    cancel_url: `${origin}/?checkout=cancelled&plan=${plan}`
  });

  return NextResponse.json({ url: session.url });
}
