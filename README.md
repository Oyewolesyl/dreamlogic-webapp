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

birth location is currently stored as a user-facing label. full geocoding, house systems, payments, database accounts, and production auth still need provider wiring.

## local setup

```bash
npm install
npm run dev
```

production build:

```bash
npm run build
```

## environment variables

set this in vercel after the landing page has its production URL:

```txt
NEXT_PUBLIC_LANDING_URL=https://your-landing-domain
```

if it is not set, the app falls back to:

```txt
https://dreamlogic-landingpage.vercel.app
```

## product structure

the web app should stay focused on the workspace experience. marketing copy, investor content, and public pitch material belong in the landing repo.

github:

```txt
https://github.com/Oyewolesyl/dreamlogic-webapp.git
```

## connected repos

- landing page: public marketing and investor site
- web app: user-facing astrology workspace
- admin dashboard: private internal dashboard protected by password
