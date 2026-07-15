# dream logic web app backend setup

this repo is the user-facing astrology workspace. it should own login, accounts, saved birth profiles, calculations, journal notes, client records, reports, subscriptions, and checkout.

## 1. provider accounts

you need:

- vercel for deployment.
- supabase for database and auth.
- stripe for paid plans, checkout, customers, subscriptions, and payments.

## 2. supabase setup

1. open `https://supabase.com/dashboard`.
2. create a new project.
3. open `project settings` -> `api`.
4. copy the project url.
5. copy the anon public key.
6. copy the service role key.

add these to the web app vercel project:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-private-service-role-key
```

the anon key can be used in the browser. the service role key must stay server-only.

## 3. database tables

the production database should store:

- users and profile records.
- birth profiles.
- chart calculation snapshots.
- journal entries.
- client records.
- report records.
- subscription status.
- event logs.

if supabase is empty, run the migrations in this repo in order:

```txt
supabase/migrations/202607120001_initial_foundation.sql
supabase/migrations/202607150001_workspace_state.sql
supabase/migrations/202607150002_backend_compatibility.sql
```

run them in supabase sql editor.

the first migration creates the structured product tables.

the second migration creates `workspace_states`, which lets the app restore the complete current workspace for a signed-in user.

the third migration makes the live backend compatible with the finished web app by adding report title/body fields, chart minute/longitude fields, and the workspace restore table if it does not already exist.

if you already pasted and ran the original schema in supabase, do not rerun `202607120001_initial_foundation.sql`.

instead run only:

```txt
supabase/migrations/202607150002_backend_compatibility.sql
```

that upgrades the existing database without deleting your tables.

## 4. stripe secret key

the stripe secret key is in stripe dashboard.

steps:

1. open `https://dashboard.stripe.com/`.
2. switch to live mode for real payments.
3. open `developers`.
4. open `api keys`.
5. copy the secret key.
6. live keys start with `sk_live_`.
7. test keys start with `sk_test_`.

add this to the web app vercel project:

```txt
STRIPE_SECRET_KEY=sk_live_your_key_here
```

never expose this as `NEXT_PUBLIC_`.

## 5. stripe products

create paid products:

- seeker: 9 usd monthly.
- depth: 19 usd monthly.
- practitioner: 39 usd monthly.
- practice: 89 usd monthly.
- research: 149 usd monthly.

copy each stripe price id:

```txt
price_...
```

add the price ids to the web app vercel project:

```txt
STRIPE_PRICE_SEEKER=price_your_seeker_price
STRIPE_PRICE_DEPTH=price_your_depth_price
STRIPE_PRICE_PRACTITIONER=price_your_practitioner_price
STRIPE_PRICE_PRACTICE=price_your_practice_price
STRIPE_PRICE_RESEARCH=price_your_research_price
```

the app checkout buttons use these variables.

## 6. stripe webhook

in stripe dashboard:

1. open `developers`.
2. open `webhooks`.
3. add endpoint:

```txt
https://dreamlogic-webapp.vercel.app/api/stripe/webhook
```

listen for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

copy the signing secret:

```txt
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## 7. app links

add:

```txt
NEXT_PUBLIC_LANDING_URL=https://your-landing-domain
```

the web app should link back to the landing page from nav/account/help areas.

## 8. analytics

vercel analytics is already installed.

in vercel:

1. open the `dreamlogic-webapp` project.
2. open `analytics`.
3. watch app visits, workspace opens, pricing clicks, saved chart starts, and report preparation.

## 9. what works after the keys are set

without your supabase and stripe values, the app can render the product experience and calculate charts, but cannot truly persist user accounts, charge buyers, or sync subscriptions.

after the keys and migrations are set:

- `/api/auth/access` creates accounts, signs users in, and sets secure http-only auth cookies.
- `/api/workspace` saves the active workspace to supabase.
- saved workspace data includes birth profile, chart snapshot, chart points, journal note, report draft, selected plan, beginner/expert mode, clients, and balance summaries.
- `/api/workspace` also loads the signed-in user's last saved workspace back into the app.
- `/api/checkout` opens stripe checkout for paid plans.
- `/api/stripe/webhook` records verified stripe webhook events in `audit_logs`.

subscription status is ready to be written from stripe events; once real payments begin, expand the webhook handler to map each customer/subscription into the `subscriptions` table.
