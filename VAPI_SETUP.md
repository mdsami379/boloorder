# Vapi AI Setup Guide — VoiceBazaar

This guide walks you through creating the AI voice assistants that answer each shop's virtual number, take orders, and call your Next.js APIs.

**What you'll build:** one Vapi **Assistant** per shop → attached to that shop's **Twilio number** → assistant calls your **two server tools** (`get_shop_data`, `create_order`) during the call.

> Base URL used below: `${APP_URL}` = your deployed app URL (e.g. `https://voicebazaar.vercel.app`). Vapi must reach your APIs over the public internet — always use the production URL, never `localhost`.

---

## Part 1 — Create a Vapi account

1. Go to [vapi.ai](https://vapi.ai) and sign up.
2. Open the [dashboard](https://dashboard.vapi.ai).
3. Go to **API Keys** and copy your **Private Key** → save it as `VAPI_API_KEY` in `.env.local` (and/or Super Admin → API Keys).

---

## Part 2 — Create the Assistant

1. Dashboard → **Assistants** → **Create Assistant** → **Blank**.
2. Name it after the shop, e.g. `Burger House — Voice Agent (shop_101)`.

### 2a. Voice

- **Provider:** 11labs (recommended for natural Urdu/English) or PlayHT.
- **Voice ID:** pick a warm, friendly voice. For Urdu shops, choose a voice that handles Urdu well — test with "As-salamu Alaikum, Burger House me khush aamdeed".
- Fallback: Vapi's default voices also work for English.

### 2b. Transcriber (speech → text)

- **Provider:** Deepgram (recommended).
- **Model:** `nova-2`.
- **Language:** match the shop's `default_language`:
  - `ur` → `ur` (Urdu)
  - `en` → `en` (English)
  - `punjabi` → `pa` (Punjabi) — falls back to `ur` if accuracy is poor
  - `saraiki` → `ur` (Saraiki has no dedicated model; Urdu transcriber handles it well)
- Turn on **endpointing** so the AI doesn't interrupt the caller.

### 2c. Model (brain)

- **Provider:** OpenAI.
- **Model:** `gpt-4o` (best at following the order-taking flow and calling tools reliably).
- **Temperature:** `0.3` — you want consistent, polite order-taking, not creativity.
- **Max tokens:** `500`.

### 2d. First message

Set something warm in the shop's language, e.g. for Urdu:

> "As-salamu Alaikum! Burger House me khush aamdeed. Main aapka AI assistant hun — aap apna order bata sakte hain."

(You can also leave the first message dynamic and let the system prompt handle it.)

---

## Part 3 — Tool 1: `get_shop_data`

This tool runs **at the start of every call**. It tells the AI *which shop was called, what's on the menu, who the customer is, and which language to speak*.

1. In the assistant editor → **Tools** → **Add Tool** → **Function**.
2. Fill in:

| Field | Value |
|---|---|
| **Name** | `get_shop_data` |
| **Description** | `Call this FIRST when a call starts. Looks up the shop by the dialed phone number and returns the shop details, available menu products, the customer's saved info (if any), and the language to speak.` |
| **Server URL** | `POST ${APP_URL}/api/ai/get-shop-data` |

3. **Parameters** (JSON schema):

```json
{
  "type": "object",
  "properties": {
    "called_number": {
      "type": "string",
      "description": "The phone number the customer dialed (the shop's virtual number)."
    },
    "caller_number": {
      "type": "string",
      "description": "The customer's phone number (caller ID)."
    }
  },
  "required": ["called_number", "caller_number"]
}
```

4. **What it returns** (for your reference — the AI reads this automatically):

```json
{
  "shop": {
    "id": "shop_101",
    "shop_name": "Burger House",
    "default_language": "ur",
    "is_open": true
  },
  "products": [
    { "id": 1, "product_name": "Zinger Burger", "price": 450, "category": "Burgers" },
    { "id": 2, "product_name": "Chicken Fries", "price": 300, "category": "Sides" }
  ],
  "customer": {
    "customer_name": "Ahmed",
    "address": "House 12, Gulberg, Lahore",
    "preferred_language": "ur"
  },
  "language": "ur"
}
```

> Only `is_available = true` products are returned — out-of-stock items never reach the AI, and the system prompt (below) tells it how to handle them anyway.

---

## Part 4 — Tool 2: `create_order`

This tool runs **when the customer confirms the order**. It saves the order, upserts the customer, and triggers the WhatsApp alerts.

1. **Tools** → **Add Tool** → **Function**:

| Field | Value |
|---|---|
| **Name** | `create_order` |
| **Description** | `Call this when the customer confirms their order. Saves the order to the database and sends WhatsApp confirmations to the customer and the shop owner. Only call after reading back the full order and total and getting a clear YES from the customer.` |
| **Server URL** | `POST ${APP_URL}/api/ai/create-order` |

2. **Parameters** (JSON schema):

```json
{
  "type": "object",
  "properties": {
    "shop_id": {
      "type": "string",
      "description": "The shop id from get_shop_data (e.g. shop_101)."
    },
    "customer_phone": {
      "type": "string",
      "description": "Customer's phone number (caller ID)."
    },
    "customer_name": {
      "type": "string",
      "description": "Customer's name. Ask if unknown."
    },
    "customer_address": {
      "type": "string",
      "description": "Delivery address. Ask if unknown or not saved."
    },
    "items": {
      "type": "array",
      "description": "Ordered items.",
      "items": {
        "type": "object",
        "properties": {
          "product_id": { "type": "integer" },
          "product_name": { "type": "string" },
          "quantity": { "type": "integer" },
          "price": { "type": "integer" }
        },
        "required": ["product_name", "quantity", "price"]
      }
    },
    "total": {
      "type": "integer",
      "description": "Total amount in PKR (sum of quantity × price)."
    }
  },
  "required": ["shop_id", "customer_phone", "items", "total"]
}
```

3. **What it returns:**

```json
{ "success": true, "order_id": 1042 }
```

The AI should read the `order_id` back to the customer: *"Aapka order #1042 receive ho gaya hai."*

---

## Part 5 — System Prompt template

Paste this into the assistant's **System Prompt**, replacing the bracketed values per shop (or keep the `{{variables}}` if you inject them dynamically):

```
You are a helpful AI voice assistant for {{shop_name}}, a shop in Pakistan.
Your job is to take phone orders politely, like a friendly shop employee.

MENU (only offer these items — never invent items):
{{products}}
Each product has a name and price in PKR.

CUSTOMER INFO (from previous orders, if available):
- Name: {{customer_name}} (if "unknown", ask politely: "Aapka naam kya hai?")
- Address: {{customer_address}} (if missing, ask: "Delivery address kya hai?")
- Preferred language: {{language}}

LANGUAGE RULES:
- Speak in {{language}}.
- If {{language}} is 'ur': speak polite Urdu (Roman-friendly, simple words).
- If 'en': speak clear, friendly English.
- If 'punjabi': speak a warm Punjabi-Urdu mix.
- If 'saraiki': speak a warm Saraiki-Urdu mix.
- If the customer switches language mid-call, follow the customer's language.

ORDER FLOW (follow strictly):
1. Greet warmly and offer to take the order.
2. Listen to what the customer wants. Match items ONLY to the menu above.
3. If a customer asks for something NOT on the menu or marked out of stock, say politely it is not available and suggest a similar item from the menu.
4. Confirm quantities ("Kitne chahiye?").
5. Read back the FULL order with the total in PKR and ask for confirmation.
6. After a clear YES, call the create_order function with all details.
7. Tell the customer their order number and thank them warmly.

RULES:
- Never reveal you are an AI unless asked; if asked, say you are the shop's digital assistant.
- Never discuss other shops, other menus, or anything outside taking this order.
- Keep responses short — this is a phone call, not a chat.
- Prices are final; do not offer discounts.
- If the shop is closed (is_open = false), politely say the shop is currently closed, share the opening time, and offer to note nothing further.
```

**Example filled for a burger shop (Urdu):**

```
You are a helpful AI voice assistant for Burger House, a shop in Pakistan.
...
MENU: Zinger Burger — Rs 450 | Chicken Fries — Rs 300 | Cold Drink — Rs 120
...
LANGUAGE RULES: Speak in polite, simple Urdu...
```

---

## Part 6 — Attach a Twilio number to the assistant

Each shop needs its own number → its own assistant.

1. **Buy the number in Twilio** (Console → Phone Numbers → Buy a Number). Note it exactly, e.g. `0301-XXXXXXX` — this becomes the shop's `virtual_number` in Super Admin → Shops.
2. **Vapi Dashboard → Phone Numbers → Import** → choose **Twilio** → enter your **Twilio Account SID + Auth Token** → select the number.
3. Open the imported number → set **Assistant** to the shop's assistant.
4. Done — calls to that number now ring the AI.

Repeat for every shop. One number = one assistant = one shop. (Vapi supports importing many Twilio numbers on one account.)

---

## Part 7 — How the inbound call flow works (end to end)

```
Customer dials 0301-XXXXXXX
        │
        ▼
Twilio routes the call to Vapi (number → assistant mapping)
        │
        ▼
Vapi assistant answers, calls get_shop_data({called_number, caller_number})
        │  → your API returns shop + menu + customer + language
        ▼
AI greets in the right language, takes the order conversationally
        │
        ▼
AI reads back order + total, customer says YES
        │
        ▼
AI calls create_order({...})
        │  → your API inserts order, upserts customer,
        │     sends WhatsApp to customer + owner
        ▼
AI tells customer the order number, says goodbye
        │
        ▼
Shop owner sees the order in /dashboard/[shop_id] →
clicks "Confirm & Print Receipt" → PrintNode prints the 80mm receipt
```

---

## Part 8 — Testing checklist

- [ ] Call the shop's virtual number — AI answers within a few seconds.
- [ ] AI greets in the shop's `default_language` and names the shop correctly.
- [ ] AI lists only available products (temporarily mark one product unavailable in the dashboard and confirm the AI says it's out of stock).
- [ ] Place a test order → order appears in `/dashboard/[shop_id]` → Orders with status `pending`.
- [ ] Customer phone receives the WhatsApp confirmation; owner phone receives the "Naya Order" alert.
- [ ] Click **Confirm & Print Receipt** → status becomes `confirmed`, receipt prints on the thermal printer.
- [ ] Call from a second (unknown) number → AI asks for name and address, customer is created.
- [ ] Change shop `default_language` to `en` → AI speaks English on the next call.
- [ ] Set the shop closed (outside open/close hours in Settings) → AI politely says the shop is closed.
- [ ] Send "menu" to the WhatsApp number → bot replies with the menu.
- [ ] Send "order status" to the WhatsApp number → bot replies with the latest order status.

### Common issues

| Problem | Fix |
|---|---|
| AI answers but knows the wrong shop/menu | `called_number` format mismatch — make sure the shop's `virtual_number` in the database matches exactly what Twilio/Vapi sends. |
| Tool calls fail / time out | Server URL must be the **production HTTPS** URL. Check Vercel function logs for the failing route. |
| AI speaks the wrong language | Check `default_language` on the shop row; also set the transcriber language (Part 2b) to match. |
| `create_order` succeeds but no WhatsApp | `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` misconfigured — see README Step 9. |
| Number rings but AI never picks up | In Vapi → Phone Numbers, confirm the number is assigned to the right assistant and the Twilio credentials are valid. |

---

**Next:** after assistants are live for all shops, hand each shop owner their virtual number and point them to `BACCHO_JAISI_GUIDE.md` (the simple Urdu guide).
