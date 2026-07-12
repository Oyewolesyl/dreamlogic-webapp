import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: "stripe webhook is not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "missing stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid stripe signature" }, { status: 400 });
  }

  await recordStripeEvent(event);
  return NextResponse.json({ received: true });
}

async function recordStripeEvent(event: Stripe.Event) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  const supabase = createClient(supabaseUrl, serviceKey);
  await supabase.from("audit_logs").insert({
    action: `stripe.${event.type}`,
    target_table: "stripe",
    metadata: {
      stripe_event_id: event.id,
      type: event.type,
      created: event.created,
      object: event.data.object
    }
  });
}
