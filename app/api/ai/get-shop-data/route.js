/**
 * POST /api/ai/get-shop-data
 * Called by the Vapi voice agent at the start of a call.
 * Handles Vapi Tool calls, Webhook payloads, and direct JSON.
 */

import { supabaseAdmin } from '@/lib/supabaseClient';

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Compare two phone numbers by their last 10 digits (country code tolerant). */
function numbersMatch(a, b) {
  const x = digits(a);
  const y = digits(b);
  if (!x || !y) return false;
  return x.slice(-10) === y.slice(-10);
}

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Tool Call arguments ya Direct JSON check karein
    const toolArgs = 
      body.message?.toolCalls?.[0]?.function?.arguments || 
      body.message?.functionCall?.arguments || 
      {};

    const parsedToolArgs = typeof toolArgs === 'string' ? JSON.parse(toolArgs || '{}') : toolArgs;

    // 2. Multi-source phone numbers extraction (Vapi ke mukhtalif structures support)
    const called_number = 
      body.called_number ||
      parsedToolArgs.called_number ||
      body.message?.call?.phoneNumber?.number ||
      body.call?.phoneNumber?.number;

    const caller_number = 
      body.caller_number ||
      parsedToolArgs.caller_number ||
      body.message?.call?.customer?.number ||
      body.call?.customer?.number;

    const requested_shop_id = body.shop_id || parsedToolArgs.shop_id;

    // 3. Database se active shops le kar aayein
    const { data: shops, error: shopErr } = await supabaseAdmin
      .from('shops')
      .select('id, shop_name, virtual_number, default_language, open_time, close_time, is_active')
      .eq('is_active', true);

    if (shopErr) {
      console.error('[get-shop-data] shop lookup failed', shopErr);
      return Response.json({ error: 'database error' }, { status: 500 });
    }

    let shop = null;

    // A. Direct shop_id se match karein
    if (requested_shop_id) {
      shop = (shops || []).find((s) => String(s.id) === String(requested_shop_id));
    }

    // B. Virtual phone number se match karein
    if (!shop && called_number) {
      shop = (shops || []).find((s) => numbersMatch(s.virtual_number, called_number));
    }

    // C. Fallback: Agar Vapi ne number na bheja ho to pehli active shop uthayein (SaaS safe fallback)
    if (!shop && (shops || []).length > 0) {
      console.warn('[get-shop-data] No direct match found, fallback to first active shop.');
      shop = shops[0];
    }

    if (!shop) {
      return Response.json({ error: 'shop not found or inactive' }, { status: 404 });
    }

    // 4. Products lookup
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, product_name, price, stock, category')
      .eq('shop_id', shop.id)
      .eq('is_available', true)
      .order('category', { ascending: true });

    if (prodErr) {
      console.error('[get-shop-data] product lookup failed', prodErr);
      return Response.json({ error: 'database error' }, { status: 500 });
    }

    // 5. Customer lookup
    let customer = null;
    if (caller_number) {
      const { data, error: custErr } = await supabaseAdmin
        .from('customers')
        .select('id, customer_name, phone_number, address, preferred_language')
        .eq('shop_id', shop.id);

      if (!custErr && data) {
        customer = data.find((c) => numbersMatch(c.phone_number, caller_number)) || null;
      }
    }

    // Vapi Tool Call response format
    return Response.json({
      shop: {
        id: shop.id,
        shop_name: shop.shop_name,
        virtual_number: shop.virtual_number,
        default_language: shop.default_language,
        open_time: shop.open_time,
        close_time: shop.close_time,
      },
      products: products || [],
      customer,
      language: shop.default_language || 'ur',
      message: `Shop data loaded successfully for ${shop.shop_name}`
    });

  } catch (err) {
    console.error('[get-shop-data] unexpected error', err);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
