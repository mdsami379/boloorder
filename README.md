# VoiceBazaar — Multi-Tenant Voice Commerce SaaS

**VoiceBazaar** is a Shopify-style SaaS platform for Pakistani shops (burger shops, cloth stores, bakeries, pharmacies — any shop that takes phone orders).

Each shop gets its **own virtual phone number**. When a customer calls that number, an **AI voice agent (Vapi)** answers, speaks in the shop's language (Urdu / English / Punjabi / Saraiki), knows **only that shop's menu**, takes the order, saves it to the database, prints a receipt on the shop's thermal printer (PrintNode), and sends **WhatsApp confirmations** to both the customer and the shop owner.

There are two panels:

- **Super Admin** (`/super-admin`) — platform owner: manage shops, billing, API keys, global analytics.
- **Shop Dashboard** (`/dashboard/[shop_id]`) — shop owner: orders, products/menu, customers, settings.

---

## Architecture

```
                        ┌────────────────────────────────────────────────────────┐
                        │              NEXT.JS 14 (App Router) on Vercel          │
                        │                                                        │
  ┌──────────────┐      │  Pages                     API Routes (/app/api)       │
  │   Customer   │      │  / (landing)                ├─ ai/get-shop-data (POST)  │
  │   phone call │      │  /super-admin               ├─ ai/create-order (POST)   │
  └──────┬───────┘      │  /dashboard/[shop_id]       ├─ orders (GET)             │
         │ called:      │                             ├─ whatsapp/webhook (POST)  │
         │ 0301-XXXXXXX │                             └─ whatsapp/send (POST)    │
         ▼              └────────────────────────────────────────────────────────┘
  ┌──────────────┐                    ▲            ▲                    │
  │    Twilio    │  voice webhook     │            │ function calls     │
  │ (PSTN/SIP)   │ ───────────────▶   │            │                    ▼
  └──────┬───────┘                    │   ┌────────┴─────────┐   ┌──────────────┐
         │ media stream               │   │    Vapi AI       │   │  WhatsApp    │
         └──────────────────────────▶ │   │  Voice Assistant │   │  Cloud API   │
                                      │   │  (per shop)      │   │  (messages)  │
                                      │   └──────────────────┘   └──────────────┘
                                      │                                   │
                                      │   ┌────────────────┐              │
                                      │   │   PrintNode    │              │
                                      │   │ thermal printer│              │
                                      │   └────────────────┘              │
                                      ▼                                   ▼
                            ┌───────────────────────────────────────────────────┐
                            │              SUPABASE (Postgres)                  │
                            │  shops · products · customers · orders            │
                            │  payments · settings                              │
                            └───────────────────────────────────────────────────┘
```

### Multi-tenant call flow (how one platform serves many shops)

1. Customer dials **shop A's virtual number** (`0301-1111111`).
2. Twilio receives the call and forwards it to the **Vapi assistant assigned to shop A** (each shop maps one number → one assistant).
3. Vapi calls `POST /api/ai/get-shop-data` with `{ called_number, caller_number }`.
4. The API looks up the shop by `virtual_number`, loads **only that shop's available products**, the customer's record (if any), and the shop's `default_language`.
5. Vapi converses in the right language, takes the order, and calls `POST /api/ai/create-order`.
6. The API inserts the order, upserts the customer, then triggers WhatsApp messages to customer + owner. The shop dashboard confirms and prints the receipt via PrintNode.

A customer calling shop B's number hits a different assistant and only ever sees shop B's menu — tenant isolation happens at the `virtual_number → shop` lookup.

---

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Frontend     | Next.js 14 App Router, Tailwind CSS, Poppins font |
| Database     | Supabase (Postgres)                     |
| Voice AI     | Vapi (voice assistants + function tools)|
| Telephony    | Twilio (virtual numbers, SIP/PSTN)      |
| Messaging    | WhatsApp Cloud API (Meta)               |
| Printing     | PrintNode (80mm thermal printers)       |
| Deployment   | Vercel                                  |

---

## Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vapi](https://vapi.ai) account
- A [Twilio](https://www.twilio.com) account with at least one purchased phone number
- A Meta developer app with WhatsApp Cloud API access (for customer/owner alerts)
- A [PrintNode](https://www.printnode.com) account + their desktop client installed on the shop's PC with an 80mm thermal printer

---

## Step 1 — Supabase setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** → **New query**.
3. Paste the full contents of `supabase/schema.sql` and run it. This creates the tables: `shops`, `products`, `customers`, `orders`, `payments`, `settings`.
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never expose this in the browser)

---

## Step 2 — Get your API keys

| Service   | Where to get it |
| --------- | --------------- |
| Supabase  | Project Settings → API (Step 1) |
| Twilio    | [console.twilio.com](https://console.twilio.com) → Account Info: **Account SID** + **Auth Token**. Buy a number under Phone Numbers → Buy. |
| Vapi      | [dashboard.vapi.ai](https://dashboard.vapi.ai) → API Keys: **Public Key** + **Private Key** |
| WhatsApp Cloud API | [developers.facebook.com](https://developers.facebook.com) → create app → add **WhatsApp** product → copy **Temporary/Permanent Access Token**, **Phone Number ID** (from API Setup page) |
| PrintNode | [app.printnode.com](https://app.printnode.com) → Account → **API Key**. Install the PrintNode desktop client on the shop PC and note the **Printer ID** (shown in the client) |

---

## Step 3 — Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# App
APP_URL=http://localhost:3000        # production: https://your-domain.vercel.app

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Vapi
VAPI_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VAPI_ASSISTANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   # default assistant (optional)

# WhatsApp Cloud API (Meta)
WHATSAPP_CLOUD_API_TOKEN=EAAxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=pick_a_random_secret_string

# PrintNode
PRINTNODE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Super Admin login (change these!)
SUPER_ADMIN_EMAIL=admin@voicebazaar.pk
SUPER_ADMIN_PASSWORD=change-me-now
```

> All Twilio/Vapi/WhatsApp/PrintNode keys can also be managed from the **Super Admin → API Keys** page, which stores them in the `settings` table. `.env.local` values act as the fallback/default.

---

## Step 4 — Install & run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000):

- `/` — marketing landing page
- `/super-admin` — platform owner panel (login with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`)
- `/dashboard/shop_101` — example shop panel (seed data uses shop id `shop_101`)

---

## Step 5 — Deploy to Vercel

1. Push the repo to GitHub.
2. Import it in [vercel.com](https://vercel.com) → **Add New Project**.
3. Add **all** environment variables from `.env.local` in the Vercel project settings (use your production `APP_URL`, e.g. `https://voicebazaar.vercel.app`).
4. Deploy. Note your production URL — you'll need it for the Twilio, Vapi, and WhatsApp webhook configurations below.

---

## Step 6 — Connect Twilio numbers (voice → Vapi)

Per shop (each shop = one Twilio number = one Vapi assistant):

1. In the **Twilio Console** → Phone Numbers → select the shop's number.
2. Under **Voice Configuration**, set:
   - **A call comes in** → Webhook → `https://<your-vercel-domain>/api/twilio/voice` (POST) — or, if routing directly through Vapi: import the number in **Vapi Dashboard → Phone Numbers → Import from Twilio** (enter your Twilio SID/Auth Token), then assign the shop's assistant to that number.
3. The recommended path is **Vapi's Twilio import**: Vapi handles the media stream, and your assistant's server tools call your Next.js APIs. No custom TwiML needed.
4. Save the purchased number as the shop's `virtual_number` in **Super Admin → Shops → Add New Shop**.

See `VAPI_SETUP.md` for the full assistant + number setup.

---

## Step 7 — Vapi assistant setup

Full walkthrough: **`VAPI_SETUP.md`** (in this repo). Summary:

1. Create an assistant in the Vapi dashboard.
2. Add two **server tools**:
   - `get_shop_data` → `POST ${APP_URL}/api/ai/get-shop-data` with `{ called_number, caller_number }`
   - `create_order` → `POST ${APP_URL}/api/ai/create-order` with `{ shop_id, customer_phone, customer_name, customer_address, items, total }`
3. Paste the **system prompt template** from `VAPI_SETUP.md` (it injects `{{shop_name}}`, `{{products}}`, `{{customer_name}}`, `{{language}}`).
4. Set voice + transcriber (Deepgram, language matching the shop's default language).
5. Attach the shop's Twilio number to the assistant.

---

## Step 8 — PrintNode printer setup (auto receipts)

1. Install the **PrintNode client** on the shop's PC (the one connected to the 80mm thermal printer) and sign in.
2. Copy the **Printer ID** from the client and save it per shop (Shop Dashboard → Settings → Printer ID), or set a global default.
3. When a shop owner clicks **"Confirm & Print Receipt"** on a pending order, the app calls PrintNode's API with an 80mm-formatted receipt (order id, items, totals, customer phone).
4. Test from Super Admin → API Keys page → **"Send test print"** if available, or place a test order.

---

## Step 9 — WhatsApp Cloud API webhook setup

Needed so customers can message your WhatsApp number ("menu", "order status") and get replies:

1. Meta Developers → your app → **WhatsApp → Configuration**.
2. Set **Callback URL** to `https://<your-vercel-domain>/api/whatsapp/webhook` and **Verify Token** to your `WHATSAPP_VERIFY_TOKEN`.
3. Click **Verify and Save** (Meta sends a GET challenge — the route handles it).
4. Under **Webhook fields**, subscribe to **`messages`**.
5. The webhook route handles incoming text:
   - contains "menu" → replies with the shop's menu (matched by sender's shop via recent orders, or the default shop)
   - contains "order status" / "status" → replies with the latest order status for that phone number
6. Outgoing alerts use `POST /api/whatsapp/send` (`sendWhatsAppMessage(to, message)`) with your `WHATSAPP_CLOUD_API_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`. For production messaging beyond the 24h window, get your message **templates** approved in the Meta dashboard.

---

## Project structure

```
voice-commerce-saas/
├── app/
│   ├── page.js                    # marketing landing page
│   ├── layout.js                  # root layout (Poppins)
│   ├── globals.css                # Tailwind + .card/.btn/.input utilities
│   ├── super-admin/
│   │   └── page.js                # platform owner panel
│   ├── dashboard/
│   │   └── [shop_id]/
│   │       └── page.js            # shop owner panel
│   └── api/
│       ├── ai/
│       │   ├── get-shop-data/route.js   # Vapi tool: shop+menu+customer lookup
│       │   └── create-order/route.js    # Vapi tool: place order + WhatsApp alerts
│       ├── orders/route.js              # GET ?shop_id=xxx
│       └── whatsapp/
│           ├── webhook/route.js         # GET verify + POST incoming messages
│           └── send/route.js            # POST sendWhatsAppMessage helper
├── lib/
│   ├── supabaseClient.js          # browser Supabase client
│   └── supabaseServer.js          # server client (service role)
├── supabase/
│   └── schema.sql                 # all tables + seed data
├── VAPI_SETUP.md                  # voice assistant setup guide
├── BACCHO_JAISI_GUIDE.md          # super-simple Urdu guide for shop owners
├── .env.example
└── package.json
```

---

## Troubleshooting

| Symptom | Likely cause & fix |
|---|---|
| Vapi says it can't reach your tools | `APP_URL` wrong or not HTTPS in production. Tools must point at your **deployed** Vercel URL, not localhost. |
| Call connects but AI knows the wrong menu | `called_number` mismatch — the shop's `virtual_number` must exactly match the Twilio number (same format, e.g. `0301-XXXXXXX`). Check Super Admin → Shops. |
| Orders save but no WhatsApp arrives | `WHATSAPP_CLOUD_API_TOKEN` expired (temporary tokens last 24h — create a permanent one) or `WHATSAPP_PHONE_NUMBER_ID` wrong. Check Vercel logs. |
| WhatsApp webhook verify fails | `WHATSAPP_VERIFY_TOKEN` in Vercel env must exactly match the token you typed in Meta's dashboard. |
| PrintNode doesn't print | PrintNode client offline on the shop PC, wrong Printer ID, or `PRINTNODE_API_KEY` missing. Print a test page from the PrintNode client first. |
| `/dashboard/[shop_id]` shows empty | No seed data or wrong `shop_id` — ids are text like `shop_101`, not numbers. |
| Supabase "permission denied" | Row Level Security: this project uses the service-role key server-side. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set and API routes use the server client. |

---

## For shop owners (non-technical)

Read **`BACCHO_JAISI_GUIDE.md`** — a super-simple Urdu guide that explains the whole system like a story, with zero technical jargon.

## License

Proprietary — © VoiceBazaar. All rights reserved.
