# Demo data: who to log in as, and what to try

`cd api && npm run seed` fills the database with this data (**it wipes everything first**, including accounts you made yourself). Requests expire after 4 hours and posted jobs after 24, timed from when you seed, so **seed again shortly before testing or presenting**.

## Things to try

| To see… | Log in as | Where |
| --- | --- | --- |
| Workers for any service in any area (2–5 each) | anyone, or not logged in | Website home → pick a service → change area |
| A worker's new request (every worker has one) | any worker, e.g. **Ahmed Painter `0326 1111111`** | Worker app → Jobs |
| Sending a price on a posted job | e.g. Rashid `0311 1111111` (Khadija's light job), or any worker under **Near you** | Worker app → Near you |
| Picking between workers' prices | **Sana `0300 1111111`** (plumber job with 3 prices) | Website → My jobs → the job "Waiting for prices" |
| A price waiting for the customer's OK | Sana, Bilal `0300 2222222`, Khadija `0300 3333333` (red "Needs your OK") | Website → My jobs |
| Work going on → "Is the work finished?" → pay and rate | Bilal, Saad `0301 3333333` | Website → My jobs |
| Worker confirming cash and rating the customer | Shabana Bibi `0311 3333333`, Adnan Electrician `0321 4444444` ("Work done: confirm cash") | Worker app → Jobs |
| Worker's turn to send a price (visit charge or full price) | Javed Plumber `0320 1111111`, Hanif Mistri `0323 3333333` ("Your turn: send price") | Worker app → Jobs |
| Price agreed: add a part with a bill photo, or extra work | Naeem Sanitary Works `0320 2222222`, Bilal Electric `0321 1111111` | Worker app → Jobs → the job |
| Answering a problem report as a worker | **Faisal AC Repair `0327 1111111`** (Bilal says the AC still isn't cooling) | Worker app → My earnings → Last jobs → Bilal |
| Answering a problem report as a customer | **Saad `0301 3333333`** (Javed says he was paid less) | Website → My jobs |
| "You picked Ahmed" (a posted job already picked) | Saad | Website → My jobs → painter job |
| Earnings, ratings, vouching unlocked | the first worker of each service (`03xx 1111111`, 70+ jobs) | Worker app → My earnings |
| A brand-new worker (no ratings, vouching locked) | the sixth worker of each service (`03xx 6666666`) | Worker app |
| Admin: disputes to rule on, a report, users | admin `0300 0000000`, password `password123` | Website `/admin/login` |

Worker numbers follow the service: plumber `0320…`, electrician `0321…`, cleaner `0322…`, carpenter `0323…`, mechanic `0324…`, pest control `0325…`, painter `0326…`, AC repair `0327…`; then `1111111` (most experienced) to `6666666` (brand new). The original demo workers (`0311 1111111` Rashid … `0311 8888888` Naveed) are there too.

## All accounts

Everyone logs in with **PIN 1234**. Admin: `03000000000` with password `password123` at /admin/login.

### Customers (website)

| Name | Number | Lives in |
| --- | --- | --- |
| Sana Qureshi | `0300 1111111` | Gulshan-e-Iqbal |
| Bilal Ahmed | `0300 2222222` | DHA |
| Khadija Khan | `0300 3333333` | PECHS |
| Ayesha Siddiqui | `0300 4444444` | Clifton |
| Hassan Raza | `0300 5555555` | Saddar |
| Fatima Noor | `0300 6666666` | Bahadurabad |
| Omar Farooq | `0300 7777777` | Gulistan-e-Jauhar |
| Zainab Ali | `0300 8888888` | North Nazimabad |
| Mariam Khan | `0300 9999999` | Nazimabad |
| Danish Iqbal | `0301 1111111` | Korangi |
| Hina Baig | `0301 2222222` | Malir |
| Saad Qureshi | `0301 3333333` | DHA |
| Amna Tariq | `0301 4444444` | Clifton |
| Usman Sheikh | `0301 5555555` | PECHS |
| Rabia Hameed | `0301 6666666` | Gulshan-e-Iqbal |

### Workers (worker app), by service

**Plumber**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Imran Plumbing Services | `0311 2222222` | Gulshan-e-Iqbal, Gulistan-e-Jauhar | ~40 jobs |
| Javed Plumber | `0320 1111111` | DHA, Clifton, Saddar | 70+ jobs |
| Naeem Sanitary Works | `0320 2222222` | Saddar, PECHS, Bahadurabad | ~40 jobs |
| Farhan Khan | `0320 3333333` | Bahadurabad, Gulshan-e-Iqbal, Gulistan-e-Jauhar | ~15 jobs |
| Waseem Pipe Fitter | `0320 4444444` | Gulistan-e-Jauhar, North Nazimabad, Nazimabad | ~7 jobs |
| Sajid Mehmood | `0320 5555555` | Nazimabad, Korangi, Malir | new (3 jobs) |
| Tariq Plumbing | `0320 6666666` | Malir, DHA, Clifton | brand new |

**Electrician**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Rashid Electric Works | `0311 1111111` | PECHS, Bahadurabad | 70+ jobs |
| Bilal Electric | `0321 1111111` | DHA, Clifton, Saddar, PECHS | 70+ jobs |
| Usman Wiring Works | `0321 2222222` | PECHS, Bahadurabad, Gulshan-e-Iqbal | ~40 jobs |
| Kamran Ali | `0321 3333333` | Gulshan-e-Iqbal, Gulistan-e-Jauhar, North Nazimabad | ~15 jobs |
| Adnan Electrician | `0321 4444444` | North Nazimabad, Nazimabad, Korangi | ~7 jobs |
| Saima Electric | `0321 5555555` | Korangi, Malir, DHA | new (3 jobs) |
| Shahid Hussain | `0321 6666666` | DHA, Clifton, Saddar | brand new |

**Cleaner**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Shabana Bibi | `0311 3333333` | Gulshan-e-Iqbal, PECHS | ~15 jobs |
| Kausar Home Cleaning | `0311 4444444` | DHA, Clifton | ~40 jobs |
| Nasreen Bibi | `0322 1111111` | DHA, Saddar, PECHS, Bahadurabad | 70+ jobs |
| Sparkle Home Services | `0322 2222222` | Bahadurabad, Gulshan-e-Iqbal, Gulistan-e-Jauhar | ~40 jobs |
| Rubina Cleaning | `0322 3333333` | Gulistan-e-Jauhar, North Nazimabad, Nazimabad | ~15 jobs |
| Parveen Akhtar | `0322 4444444` | Nazimabad, Korangi, Malir | ~7 jobs |
| Zubaida Khatoon | `0322 5555555` | Malir, DHA, Clifton | new (3 jobs) |
| Gulshan Cleaners | `0322 6666666` | Clifton, Saddar, PECHS | brand new |

**Carpenter**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Asif Carpenter | `0311 5555555` | North Nazimabad, Nazimabad | new (3 jobs) |
| Ahmed Carpenter | `0323 1111111` | DHA, PECHS, Bahadurabad, Gulshan-e-Iqbal | 70+ jobs |
| Yousuf Furniture Works | `0323 2222222` | Gulshan-e-Iqbal, Gulistan-e-Jauhar, North Nazimabad | ~40 jobs |
| Hanif Mistri | `0323 3333333` | North Nazimabad, Nazimabad, Korangi | ~15 jobs |
| Shakeel Wood Works | `0323 4444444` | Korangi, Malir, DHA | ~7 jobs |
| Liaquat Ali | `0323 5555555` | DHA, Clifton, Saddar | new (3 jobs) |
| Abdul Ghafoor | `0323 6666666` | Saddar, PECHS, Bahadurabad | brand new |

**Mechanic**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Naveed Auto Mechanic | `0311 8888888` | Malir, Korangi | brand new |
| Rafiq Auto Works | `0324 1111111` | DHA, Bahadurabad, Gulshan-e-Iqbal, Gulistan-e-Jauhar | 70+ jobs |
| Khalid Motors | `0324 2222222` | Gulistan-e-Jauhar, North Nazimabad, Nazimabad | ~40 jobs |
| Salman Bike Mechanic | `0324 3333333` | Nazimabad, Korangi, Malir | ~15 jobs |
| Irfan Mechanic | `0324 4444444` | Malir, DHA, Clifton | ~7 jobs |
| Nadeem Auto Electric | `0324 5555555` | Clifton, Saddar, PECHS | new (3 jobs) |
| Jamil Garage | `0324 6666666` | PECHS, Bahadurabad, Gulshan-e-Iqbal | brand new |

**Pest control**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Pak Fumigation Co. | `0311 7777777` | Saddar, Clifton, PECHS | 70+ jobs |
| Safe Home Pest Control | `0325 1111111` | DHA, Gulshan-e-Iqbal, Gulistan-e-Jauhar, North Nazimabad | 70+ jobs |
| Termite Masters | `0325 2222222` | North Nazimabad, Nazimabad, Korangi | ~40 jobs |
| Akbar Spray Services | `0325 3333333` | Korangi, Malir, DHA | ~15 jobs |
| Riaz Fumigation | `0325 4444444` | DHA, Clifton, Saddar | ~7 jobs |
| Clean Shield Pest Control | `0325 5555555` | Saddar, PECHS, Bahadurabad | new (3 jobs) |
| Hamid Spray | `0325 6666666` | Bahadurabad, Gulshan-e-Iqbal, Gulistan-e-Jauhar | brand new |

**Painter**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Ahmed Painter | `0326 1111111` | DHA, Gulistan-e-Jauhar, North Nazimabad, Nazimabad | 70+ jobs |
| Colour Craft Painters | `0326 2222222` | Nazimabad, Korangi, Malir | ~40 jobs |
| Sadiq Paint Works | `0326 3333333` | Malir, DHA, Clifton | ~15 jobs |
| Mumtaz Painter | `0326 4444444` | Clifton, Saddar, PECHS | ~7 jobs |
| Fozia Home Painting | `0326 5555555` | PECHS, Bahadurabad, Gulshan-e-Iqbal | new (3 jobs) |
| Arif Rang Saaz | `0326 6666666` | Gulshan-e-Iqbal, Gulistan-e-Jauhar, North Nazimabad | brand new |

**AC repair**

| Name | Number | Works in | Experience |
| --- | --- | --- | --- |
| Zeeshan AC Repair (also Electrician) | `0311 6666666` | DHA, Korangi | ~15 jobs |
| Faisal AC Repair | `0327 1111111` | DHA, North Nazimabad, Nazimabad, Korangi | 70+ jobs |
| Cool Breeze AC Services | `0327 2222222` | Korangi, Malir, DHA | ~40 jobs |
| Junaid Cooling | `0327 3333333` | DHA, Clifton, Saddar | ~15 jobs |
| Saleem AC Mechanic | `0327 4444444` | Saddar, PECHS, Bahadurabad | ~7 jobs |
| Ali Air Con | `0327 5555555` | Bahadurabad, Gulshan-e-Iqbal, Gulistan-e-Jauhar | new (3 jobs) |
| Polar AC Works | `0327 6666666` | Gulistan-e-Jauhar, North Nazimabad, Nazimabad | brand new |

Areas next to each other (search shows these too): DHA → Clifton, Korangi; Clifton → DHA, Saddar; Saddar → Clifton, PECHS, Nazimabad; PECHS → Saddar, Bahadurabad, Gulshan-e-Iqbal; Bahadurabad → PECHS, Gulshan-e-Iqbal; Gulshan-e-Iqbal → Gulistan-e-Jauhar, PECHS, Bahadurabad, North Nazimabad; Gulistan-e-Jauhar → Gulshan-e-Iqbal, Malir; North Nazimabad → Nazimabad, Gulshan-e-Iqbal; Nazimabad → North Nazimabad, Saddar; Korangi → DHA, Malir; Malir → Korangi, Gulistan-e-Jauhar.
