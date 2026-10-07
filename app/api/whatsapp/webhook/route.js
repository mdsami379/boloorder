/**
 * POST /api/whatsapp/webhook
 * Inbound Meta WhatsApp webhook.
 *
 * GET:  verification handshake (hub.mode == 'subscribe' and
 *       hub.verify_token == WHATSAPP_VERIFY_TOKEN -> echo hub.challenge)
 * POST: handle incoming text messages:
 *       - contains 'menu'   -> reply with the shop's menu
 *       - contains 'status' -> reply with latest order status for sender
 *       - otherwise         -> reply with help text
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

const HELP_TEXT =
  'Welcome! Type MENU to see our menu, or STATUS to check your latest order status.';

/** Pick which shop answers generic WhatsApp texts. */
async function resolveShop() {
  const defaultShopId = process.env.WHATSAPP_DEFAULT_SHOP_ID;
  if (defaultShopId) {
    const { data } = await supabaseAdmin
      .from('shops')
      .select('id, shop_name, virtual_number, is_active')
      .eq('id', defaultShopId)
      .single();
    if (data && data.is_active) return data;
  }
  const { data } = await supabaseAdmin
    .from('shops')
    .select('id, shop_name, virtual_number, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1);
  return data && data.length > 0 ? data[0] : null;
}

function buildMenuText(shop, products) {
  if (!products || products.length === 0) {
    return `Sorry, ${shop.shop_name} ka menu abhi available nahi hai.`;
  }
  const lines = [`${shop.shop_name} - Menu:`];
  const byCategory = {};
  for (const p of products) {
    const cat = p.category || 'Menu';
    (byCategory[cat] = byCategory[cat] || []).push(p);
  }
  for (const [cat, items] of Object.entries(byCategory)) {
    lines.push('');
    lines.push(cat + ':');
    for (const p of items) {
      lines.push(`- ${p.product_name} — Rs ${p.price}`);
    }
  }
  return lines.join('\n');
}

async function handleText(from, text) {
  const msg = String(text || '').toLowerCase();

  const shop = await resolveShop();
  if (!shop) {
    return sendWhatsAppMessage(from, HELP_TEXT);
  }

  if (msg.includes('status')) {
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_amount, created_at')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const phone = String(from).replace(/\D/g, '');
    const mine = (orders || []).find(
      (o) => String(o.customer_phone).replace(/\D/g, '').slice(-10) === phone.slice(-10)
    );

    if (!mine) {
      return sendWhatsAppMessage(
        from,
        'Aapka koi order record mein nahi mila. Order karne ke liye hamare number par call karen.'
      );
    }
    return sendWhatsAppMessage(
      from,
      `Order #${mine.id} - Status: ${mine.status}. Total: Rs ${mine.total_amount}. Shukria!`
    );
  }

  if (msg.includes('menu')) {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('product_name, price, category')
      .eq('shop_id', shop.id)
      .eq('is_available', true)
      .order('category', { ascending: true });
    return sendWhatsAppMessage(from, buildMenuText(shop, products));
  }

  return sendWhatsAppMessage(from, HELP_TEXT);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req) {
  try {
    const payload = await req.json();

    const entries = payload.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const message of value.messages || []) {
          const from = message.from;
          const text = message.text && message.text.body;
          if (from && text) {
            try {
              await handleText(from, text);
            } catch (err) {
              console.error('[whatsapp-webhook] message handling failed', err);
            }
          }
        }
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[whatsapp-webhook] unexpected error', err);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
