# dream logic web app

user-facing astrology workspace for dream logic.

## purpose

this repo is the product app users open after the landing page. it is separate from the landing page and separate from the private admin dashboard.

the app includes:

- birth profile workflow
- calculated natal placements
- element balance
- modality balance
- beginner and expert reading modes
- journal notes
- practice/client workspace
- report preparation
- pricing tiers
- hypnos ai chart chat

## calculation model

planetary placements are calculated with `astronomy-engine` from the birth date and time.

current calculation output includes:

- planet
- zodiac sign
- degree
- minute
- element
- modality
- retrograde status

birth location is currently stored as a user-facing label. full geocoding and house systems are the next calculation upgrades after latitude/longitude lookup is added.

## local setup

```bash
npm install
npm run dev
```

production build:

```bash
npm run build
```

the app includes vercel analytics through `@vercel/analytics`.

## environment variables

set this in vercel after the landing page has its production URL:

```txt
NEXT_PUBLIC_LANDING_URL=https://your-landing-domain
```

if it is not set, the app falls back to:

```txt
https://dreamlogic-landingpage.vercel.app
```

## full backend setup

read `BACKEND_SETUP.md` for the complete beginner setup:

- supabase project and database.
- stripe secret key.
- stripe products and price ids.
- stripe webhook secret.
- openai key for hypnos ai.
- vercel environment variables.
- what each private credential unlocks.

## product structure

the web app should stay focused on the workspace experience. public product explanation belongs in the landing repo.

github:

```txt
https://github.com/Oyewolesyl/dreamlogic-webapp.git
```

## connected repos

- landing page: public product site
- web app: user-facing astrology workspace
- admin dashboard: private internal dashboard protected by password
