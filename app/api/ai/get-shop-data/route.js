/**
 * POST /api/ai/get-shop-data
 * Called by the Vapi voice agent at the start of a call.
 * Input:  { called_number, caller_number }
 * Returns: { shop, products, customer, language }
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
    const { called_number, caller_number } = await req.json();

    if (!called_number) {
      return Response.json({ error: 'called_number is required' }, { status: 400 });
    }

    // Find the shop by its virtual number (digits-normalized compare).
    const { data: shops, error: shopErr } = await supabaseAdmin
      .from('shops')
      .select('id, shop_name, virtual_number, default_language, open_time, close_time, is_active')
      .eq('is_active', true);

    if (shopErr) {
      console.error('[get-shop-data] shop lookup failed', shopErr);
      return Response.json({ error: 'database error' }, { status: 500 });
    }

    const shop = (shops || []).find((s) => numbersMatch(s.virtual_number, called_number));

    if (!shop) {
      return Response.json({ error: 'shop not found or inactive' }, { status: 404 });
    }

    // Available products for this shop.
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

    // Existing customer (by phone) for this shop, if any.
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
      language: shop.default_language,
    });
  } catch (err) {
    console.error('[get-shop-data] unexpected error', err);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
