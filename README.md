# Mohalla

A marketplace for hiring local workers in Karachi (plumbers, electricians, cleaners and more), with trust built in through a confirmed job agreement, ratings on both sides, vouching and evidence-based disputes. The full spec is in the team's "Mohalla — Project Spec v1" doc.

```
mohalla/
├── api/          Node + Express + MongoDB. One API for both apps; all trust rules live here.
├── web/          React + Vite. Customers (search, request, agreement, rating) and admin screens.
└── worker-app/   Expo (React Native). Workers: accept jobs, propose prices, confirm payment.
```

## How the pieces fit

- **Both apps only talk to the API.** Neither app decides anything important. The API checks who you are, what state the job is in, and whether the action is allowed. That way the web app and the worker app can never disagree about the rules.
- **The trust rules are all in `api/src/lib/rules.js`.** Expiry times, the 48-hour dispute window, strike consequences and vouching limits are all set there. Change a number there and it changes everywhere. These rules have unit tests in `api/test/rules.test.js`.
- **The job agreement lives inside each job** (`api/src/models/Job.js`). Entries are only ever added or accepted/rejected, never edited. That list is "the record" disputes are judged against.

## The customer web app (`web/`)

Built phone-first for customers who may read slowly: big buttons and chips, an icon beside every service, action and time slot, and English (or Roman Urdu, with the toggle) with Urdu script underneath key labels.

| Screen | Address | Needs login? |
| --- | --- | --- |
| 1 Home: pick area, pick a service | `/` | No |
| 2 Results with filter chips | `/find/:category` | No |
| 3 Worker profile | `/workers/:id` | No |
| 4 Log in / sign up (number → code → name → PIN) | `/login?returnTo=…` | — |
| 5 Request: problem, day + time, address | `/workers/:id/request` | Yes |
| 6 Job page: the price agreement timeline | `/jobs/:id` | Yes |
| 7 Finish: on time? cash? stars | `/jobs/:id/finish` | Yes |
| My jobs, Something wrong?, Help | `/jobs`, `/jobs/:id/problem`, `/help` | Yes (Help: no) |

Login only appears when someone taps "Ask [name] to come" or opens My jobs, and then sends them back where they were.

- `web/src/ui/app.css`: the whole look (colours are variables at the top).
- `web/src/ui/kit.jsx`: shared pieces (bilingual labels, icons, keypad, pop-up sheets).
- `web/src/i18n.jsx`: every word as [English, Roman Urdu, Urdu]. **Have native speakers check the Urdu.**
- Icons are [Phosphor](https://phosphoricons.com) "duotone", recoloured per service in `app.css`; their movements are the `mo-*` animations there.
- Admin screens keep their original desktop look at `/admin` (password login at `/admin/login`).

## Setting it up (first time)

You need **Node.js 20 or newer** and a free **MongoDB Atlas** account.

### 1. Create the database
1. Sign up at mongodb.com/atlas and create a free cluster.
2. Under Database Access, add a user with a password.
3. Under Network Access, allow your IP (or 0.0.0.0/0 for the course project).
4. Click Connect → Drivers and copy the connection string. It starts with `mongodb+srv://`.

*Why Atlas:* it's free, nobody has to install MongoDB locally, and the whole team shares one database.

### 2. Run the API
```bash
cd api
npm install                 # downloads Express, Mongoose, etc.
cp .env.example .env        # then paste your connection string into MONGO_URI
npm run seed                # fills the database with demo users and jobs (wipes it first!)
npm run dev                 # starts the API on http://localhost:4000, restarts when you save
```
`npm run seed` prints the demo logins:
- Customers (web app, number + PIN `1234`): `03001111111` (Sana), `03002222222` (Bilal)
- Admin (web app at `/admin/login`, password `password123`): `03000000000`
- Workers (worker app, password `password123`): `03111111111` (Rashid, electrician), `03112222222` (Imran, plumber), `03113333333` (Shabana, cleaner)

Check it works: open http://localhost:4000/api/health. It should say `{"ok":true}`.

### Customer login: number + PIN, with sign-up codes
Customers never get a password. The first time, they enter their number, choose **WhatsApp or SMS** for a 4-number code, then their name and a 4-number PIN. After that it is just number + PIN. 5 wrong PINs lock the number for 10 minutes (`PIN_LOCK` in `api/src/lib/rules.js`).

How codes are sent is decided by **one setting per channel** in `api/.env`:

| Setting | `demo` (default) | real sending |
| --- | --- | --- |
| `OTP_SMS_MODE` | No SMS is sent. The code is always `1234` and the app shows it on screen. | Future work: real SMS needs a paid service (Twilio or Firebase). |
| `OTP_WHATSAPP_MODE` | Same as above. | `twilio` or `meta`: a real WhatsApp message (see below). |

We say openly in the presentation that SMS codes are simulated, the same way ID checks are.

### WhatsApp codes (for the presentation)
Pick **one** of these. Twilio is quicker to set up.

**Option A: Twilio WhatsApp sandbox (free trial)**
1. Sign up at twilio.com (the free trial credit is enough). Copy the **Account SID** and **Auth Token** from the console.
2. Go to Messaging → Try it out → Send a WhatsApp message. Note the sandbox number (usually `+1 415 523 8886`) and the **join code** (e.g. `join happy-tiger`).
3. On **every phone that will receive codes** (e.g. the presenter's phone), send that `join …` message to the sandbox number on WhatsApp. It stays joined for 3 days, so re-join before the presentation.
4. Within 24 hours before the demo, send any message (e.g. "hi") from that phone to the sandbox. WhatsApp only lets the sandbox start a chat within 24 hours of the person's last message.
5. In `api/.env` set `OTP_WHATSAPP_MODE=twilio`, `TWILIO_ACCOUNT_SID=…`, `TWILIO_AUTH_TOKEN=…`. Restart the API.

**Option B: Meta WhatsApp Cloud API**
1. At developers.facebook.com create an app with the WhatsApp product. Meta gives you a test number and lets you add up to 5 recipient numbers. Add the presenter's phone.
2. Create a message template of category **Authentication** named `mohalla_code` (or set `META_WA_TEMPLATE`), and wait for it to be approved.
3. Copy the **Phone number ID** and an **access token**. The temporary token expires after 24 hours; for the presentation, make a permanent one with a System User in Business settings.
4. In `api/.env` set `OTP_WHATSAPP_MODE=meta`, `META_WA_ACCESS_TOKEN=…`, `META_WA_PHONE_NUMBER_ID=…`. Restart the API.

If sending fails, the app tells the customer to try again or choose SMS, and the real reason is printed in the API's terminal (e.g. Twilio error 63015 = that phone hasn't joined the sandbox).

### 3. Run the web app
```bash
cd web
npm install
npm run dev                 # opens on http://localhost:5173
```
In development, Vite forwards every `/api` request to port 4000 (see `web/vite.config.js`), so the web app needs no extra settings.

### 4. Run the worker app
1. Install **Expo Go** on your phone (Play Store / App Store).
2. Find your laptop's Wi-Fi IP address (`ipconfig` on Windows, `ipconfig getifaddr en0` on Mac). The phone and laptop must be on the same Wi-Fi.
3. Start the app, telling it where the API is:
```bash
cd worker-app
npm install
EXPO_PUBLIC_API_URL=http://YOUR-LAPTOP-IP:4000/api npx expo start
```
On Windows PowerShell, set the variable first: `$env:EXPO_PUBLIC_API_URL="http://YOUR-LAPTOP-IP:4000/api"; npx expo start`.

4. Scan the QR code with your phone's camera (iPhone) or with Expo Go (Android).

*Why the IP address:* on the phone, "localhost" means the phone itself, not your laptop.

*No phone handy?* Press `w` in the Expo terminal to open the worker app in a browser. It runs the same code.

## Tests
```bash
cd api
npm test
```
- `rules.test.js` checks the trust rules (no database needed).
- `app.test.js` checks the API starts and protected routes refuse users who aren't logged in (no database needed).
- `flow.test.js` runs a whole job end to end: request → accept → visit charge → quote → part with bill → complete → payment → ratings → dispute → ruling. It needs its own database because it **wipes it**: create a second database in Atlas (e.g. `.../mohalla-test`) and run `TEST_MONGO_URI="mongodb+srv://.../mohalla-test" npm test`.

## API at a glance

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/phone` (has an account?), `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/pin/reset`, `GET /api/auth/me` |
| Workers | `GET /api/workers` (filters: category, area, maxPrice, available, female), `GET /api/workers/:id`, `PATCH /api/workers/me`, `PATCH /api/workers/me/availability` |
| Jobs | `POST /api/jobs`, `GET /api/jobs/mine`, `GET /api/jobs/open`, `GET /api/jobs/:id`, `POST /api/jobs/:id/accept` · `decline` · `cancel` · `complete` · `payment` · `review` · `disputes` |
| Quotes | `POST /api/jobs/:id/quotes`, `POST /api/jobs/:id/quotes/:quoteId/pick` |
| Agreement | `POST /api/jobs/:id/agreement`, `POST /api/jobs/:id/agreement/:entryId/accept` (or `reject`) |
| Disputes | `POST /api/disputes/:id/statements`, `GET /api/disputes/mine`, `GET /api/disputes` (admin), `POST /api/disputes/:id/ruling` (admin) |
| Vouches | `POST /api/vouches/:workerId`, `DELETE /api/vouches/:workerId` |
| Admin | `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `GET /api/admin/reports`, `PATCH /api/admin/reports/:id`, `POST /api/reports` |

Every request (except the auth routes, search and worker pages) needs the header `Authorization: Bearer <token>`, which login returns.

## What's done and what's next

Done (must-haves from the spec): login for three roles, worker profiles, search with area neighbours and filters, direct requests that expire after 4 hours, accept/decline, contact details hidden until acceptance, the two-stage agreement with amendments and parts, completion with "on time?", two-sided payment confirmation, hidden-until-both ratings, reliability counts, disputes with admin rulings and strikes, safety reports, admin badges/suspensions, English / Roman Urdu. Posted jobs with quotes and vouching rules are also in the API.

Next, in rough order:
1. **Photo uploads** for bills and dispute evidence: `expo-image-picker` in the worker app plus Cloudinary in the API. Bills are a text link for now.
2. **Vouching screens**: the API is ready; the worker app needs a "Vouch for a worker" button.
3. **Assisted signup**: let a worker or founding business create a profile for someone else (the `assistedBy` field is already on users).
4. **Deploy**: API to Render, web to Vercel (set `VITE_API_URL` to the Render URL + `/api`), worker app via Expo Go.
5. Voice notes on job requests, if there's time after the presentation.

The Roman Urdu text is a first draft (`web/src/i18n.jsx`, `worker-app/src/strings.js`). Have the team and the workers you interview fix anything that sounds off.
