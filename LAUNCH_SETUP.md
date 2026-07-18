# dream logic launch setup

this is the exact setup order for the live backend.

## 1. supabase database

1. open `https://supabase.com/dashboard`.
2. click `new project`.
3. choose your organization.
4. name it `dreamlogic`.
5. create a database password and save it somewhere private.
6. choose the nearest region.
7. click `create new project`.
8. wait until the project finishes creating.
9. open `sql editor` in the left sidebar.
10. click `new query`.
11. open this repo file:
   `supabase/migrations/202607120001_initial_foundation.sql`
12. copy all of it.
13. paste it into the supabase sql editor.
14. click `run`.
15. open this repo file:
   `supabase/migrations/202607150001_workspace_state.sql`
16. copy all of it.
17. paste it into a new supabase query.
18. click `run`.
19. open this repo file:
   `supabase/migrations/202607150002_backend_compatibility.sql`
20. copy all of it.
21. paste it into a new supabase query.
22. click `run`.

if you already ran the first big schema before, do not run it again. run only:

```txt
supabase/migrations/202607150002_backend_compatibility.sql
```

## 2. supabase keys

1. stay inside your supabase project.
2. click the gear icon for `project settings`.
3. click `api`.
4. copy `project url`.
5. copy `anon public` key.
6. copy `service_role` key.

put them in the `dreamlogic-webapp` vercel project:

```txt
NEXT_PUBLIC_SUPABASE_URL=paste_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_service_role_key_here
```

the anon key is public. the service role key is private.

## 3. stripe products and prices

1. open `https://dashboard.stripe.com`.
2. turn off test mode only when you are ready for real payments.
3. click `product catalog`.
4. click `add product`.
5. create these paid products one by one:

```txt
seeker - 9 usd - recurring monthly
depth - 19 usd - recurring monthly
practitioner - 39 usd - recurring monthly
practice - 89 usd - recurring monthly
research - 149 usd - recurring monthly
```

6. after each product is created, open the product.
7. find the recurring price.
8. copy the price id.
9. price ids start with `price_`.

put the ids in the `dreamlogic-webapp` vercel project:

```txt
STRIPE_PRICE_SEEKER=price_for_seeker
STRIPE_PRICE_DEPTH=price_for_depth
STRIPE_PRICE_PRACTITIONER=price_for_practitioner
STRIPE_PRICE_PRACTICE=price_for_practice
STRIPE_PRICE_RESEARCH=price_for_research
```

## 4. stripe secret key

1. open stripe.
2. click `developers`.
3. click `api keys`.
4. copy the `secret key`.
5. live keys start with `sk_live_`.
6. test keys start with `sk_test_`.

put it in `dreamlogic-webapp` and `dreamlogic-admin` vercel projects:

```txt
STRIPE_SECRET_KEY=sk_live_or_sk_test_key_here
```

do not put this in the landing page project.

## 5. stripe webhook

1. open stripe.
2. click `developers`.
3. click `webhooks`.
4. click `add endpoint`.
5. paste this endpoint:

```txt
https://dreamlogic-webapp.vercel.app/api/stripe/webhook
```

6. select these events:

```txt
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
```

7. save the endpoint.
8. open the endpoint.
9. click `reveal signing secret`.
10. copy the value that starts with `whsec_`.

put it in the `dreamlogic-webapp` vercel project:

```txt
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 6. hypnos ai

1. open `https://platform.openai.com/api-keys`.
2. create a new secret key.
3. copy it.
4. put it in the `dreamlogic-webapp` vercel project:

```txt
OPENAI_API_KEY=sk_your_openai_key
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` is optional. the app falls back to a local chart explanation if the key is missing.

## 7. vercel project variables

open vercel, then open each project.

### landing project

settings -> environment variables:

```txt
NEXT_PUBLIC_WEBAPP_URL=https://dreamlogic-webapp.vercel.app
```

### web app project

settings -> environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=paste_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_service_role_key_here
STRIPE_SECRET_KEY=sk_live_or_sk_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_SEEKER=price_for_seeker
STRIPE_PRICE_DEPTH=price_for_depth
STRIPE_PRICE_PRACTITIONER=price_for_practitioner
STRIPE_PRICE_PRACTICE=price_for_practice
STRIPE_PRICE_RESEARCH=price_for_research
OPENAI_API_KEY=sk_your_openai_key
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_LANDING_URL=https://dreamlogic-landingpage.vercel.app
```

### admin project

settings -> environment variables:

```txt
DREAMLOGIC_ADMIN_PASSWORD=your_admin_login_password
DREAMLOGIC_ADMIN_SECRET=make_up_a_long_random_secret
STRIPE_SECRET_KEY=sk_live_or_sk_test_key_here
NEXT_PUBLIC_LANDING_URL=https://dreamlogic-landingpage.vercel.app
NEXT_PUBLIC_WEBAPP_URL=https://dreamlogic-webapp.vercel.app
NEXT_PUBLIC_ADMIN_URL=https://dreamlogic-admin.vercel.app
```

## 8. redeploy

after adding env vars:

1. open each vercel project.
2. click `deployments`.
3. click the latest deployment.
4. click the three dots.
5. click `redeploy`.
6. redeploy landing, web app, and admin.

## 9. test

1. open the landing page.
2. click `try free`.
3. confirm it opens the web app.
4. in the web app, edit birth data.
5. open chart.
6. click `explain`.
7. prepare report.
8. save workspace.
9. create/sign in to an account.
10. save workspace again.
11. load workspace.
12. open plans.
13. click a paid plan.
14. confirm stripe checkout opens.
15. open hypnos.
16. paste a report or workspace.
17. ask a question.
18. open admin.
19. log in with `DREAMLOGIC_ADMIN_PASSWORD`.
20. check buyers and subscriptions after stripe test payments.
