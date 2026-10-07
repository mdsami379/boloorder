/**
 * WhatsApp messaging helpers — Meta WhatsApp Cloud API.
 *
 * Required env vars:
 *   WHATSAPP_CLOUD_API_TOKEN   - Meta WhatsApp Cloud API bearer token
 *   WHATSAPP_PHONE_NUMBER_ID   - Phone number ID from the Meta dashboard
 * Optional:
 *   WHATSAPP_VERIFY_TOKEN      - token used to verify the inbound webhook
 *   WHATSAPP_DEFAULT_SHOP_ID   - shop used to answer generic "menu" texts
 */

/** Strip everything except digits, e.g. "+92 301 1234567" -> "923011234567". */
export function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Send a WhatsApp text message via the Meta WhatsApp Cloud API.
 * Returns { ok:true } on success, { ok:false, skipped:true } when the
 * env vars are not configured, { ok:false, error } on API failure.
 */
export async function sendWhatsAppMessage(to, message) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const cleanTo = normalizePhone(to);

  if (!token || !phoneNumberId) {
    console.log('[whatsapp] skipped - WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set');
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTo,
          type: 'text',
          text: { body: message },
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[whatsapp] api error', res.status, data);
      return { ok: false, error: data };
    }
    return { ok: true, data };
  } catch (err) {
    console.error('[whatsapp] send failed', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Build the two order notification messages (exact templates).
 * itemsText e.g. "2x Zinger Burger, 1x Fries"
 */
export function buildOrderMessages({
  order_id,
  shop_name,
  customer_name,
  customer_phone,
  itemsText,
  total,
  owner_whatsapp,
}) {
  const name = customer_name || 'Customer';
  const customerMsg = `As-salamu Alaikum ${name}, aapka order #${order_id} ${shop_name} par receive ho gaya hai. Total: Rs ${total}. Shukria! - ${shop_name}`;
  const ownerMsg = `🔔 Naya Order! #${order_id} - ${itemsText} - Customer: ${customer_phone} - Total: Rs ${total}. Dashboard khol kar Confirm karen.`;
  return { customerMsg, ownerMsg, owner_whatsapp };
}
