/**
 * POST /api/ai/create-order
 * Called by the Vapi voice agent after it has taken an order.
 * Input:  { shop_id, customer_phone, customer_name, customer_address,
 *            items: [{product_id, product_name, qty, price}], total,
 *            preferred_language? }
 * Returns: { success: true, order_id }
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendWhatsAppMessage, buildOrderMessages } from '@/lib/whatsapp';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      shop_id,
      customer_phone,
      customer_name,
      customer_address,
      items,
      total,
      preferred_language,
    } = body;

    if (!shop_id || !customer_phone || !Array.isArray(items) || items.length === 0 || total == null) {
      return Response.json(
        { error: 'shop_id, customer_phone, items[] and total are required' },
        { status: 400 }
      );
    }

    const phone = String(customer_phone).replace(/\D/g, '');

    // 1) Insert the order.
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          shop_id,
          customer_phone: phone,
          customer_name: customer_name || null,
          items,
          total_amount: total,
          status: 'pending',
        },
      ])
      .select('id')
      .single();

    if (orderErr || !order) {
      console.error('[create-order] order insert failed', orderErr);
      return Response.json({ error: 'could not create order' }, { status: 500 });
    }

    const order_id = order.id;

    // 2) Upsert the customer (onConflict shop_id + phone_number).
    const customerRow = {
      shop_id,
      phone_number: phone,
      customer_name: customer_name || null,
      address: customer_address || null,
    };
    if (preferred_language) customerRow.preferred_language = preferred_language;

    const { error: custErr } = await supabaseAdmin
      .from('customers')
      .upsert(customerRow, { onConflict: 'shop_id,phone_number' });

    if (custErr) {
      // Non-fatal: the order already exists.
      console.error('[create-order] customer upsert failed', custErr);
    }

    // 3) WhatsApp notifications (best-effort — never fail the order).
    try {
      const { data: shop, error: shopErr } = await supabaseAdmin
        .from('shops')
        .select('shop_name, owner_whatsapp, whatsapp_enabled')
        .eq('id', shop_id)
        .single();

      if (!shopErr && shop) {
        const itemsText = items
          .map((i) => `${i.qty || i.quantity || 1}x ${i.product_name}`)
          .join(', ');

        const { customerMsg, ownerMsg } = buildOrderMessages({
          order_id,
          shop_name: shop.shop_name,
          customer_name,
          customer_phone: phone,
          itemsText,
          total,
          owner_whatsapp: shop.owner_whatsapp,
        });

        await sendWhatsAppMessage(phone, customerMsg);

        if (shop.whatsapp_enabled && shop.owner_whatsapp) {
          await sendWhatsAppMessage(shop.owner_whatsapp, ownerMsg);
        }
      }
    } catch (waErr) {
      console.error('[create-order] whatsapp notifications failed', waErr);
    }

    return Response.json({ success: true, order_id });
  } catch (err) {
    console.error('[create-order] unexpected error', err);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
