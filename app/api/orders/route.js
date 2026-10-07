/**
 * /api/orders
 * GET  ?shop_id=xxx          -> newest-first orders for one shop
 * POST { action:'confirm', order_id, shop_id }
 *      -> verifies order belongs to shop, marks confirmed,
 *         prints receipt via PrintNode, notifies customer on WhatsApp
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { printReceipt } from '@/lib/printnode';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shop_id = searchParams.get('shop_id');

    if (!shop_id) {
      return Response.json({ error: 'shop_id query param is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, shop_id, customer_phone, customer_name, items, total_amount, status, created_at')
      .eq('shop_id', shop_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[orders] fetch failed', error);
      return Response.json({ error: 'database error' }, { status: 500 });
    }

    return Response.json({ orders: data || [] });
  } catch (err) {
    console.error('[orders] unexpected error', err);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { action, order_id, shop_id } = await req.json();

    if (action !== 'confirm' || !order_id || !shop_id) {
      return Response.json(
        { error: "body must be { action:'confirm', order_id, shop_id }" },
        { status: 400 }
      );
    }

    // Verify the order belongs to this shop.
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('shop_id', shop_id)
      .single();

    if (fetchErr || !order) {
      return Response.json({ error: 'order not found for this shop' }, { status: 404 });
    }

    // 1) Mark confirmed.
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', order_id);

    if (updateErr) {
      console.error('[orders] confirm update failed', updateErr);
      return Response.json({ error: 'could not confirm order' }, { status: 500 });
    }

    // Fetch the shop for the receipt + notification.
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('shop_name, virtual_number')
      .eq('id', shop_id)
      .single();

    // 2) Print receipt (best-effort).
    try {
      await printReceipt({ order, shop: shop || { shop_name: shop_id } });
    } catch (printErr) {
      console.error('[orders] print failed', printErr);
    }

    // 3) WhatsApp the customer (best-effort).
    try {
      const name = order.customer_name || 'Customer';
      const msg = `As-salamu Alaikum ${name}, aapka order #${order.id} ${shop ? shop.shop_name : ''} par CONFIRM ho gaya hai. Total: Rs ${order.total_amount}. Shukria!`;
      await sendWhatsAppMessage(order.customer_phone, msg);
    } catch (waErr) {
      console.error('[orders] confirm notification failed', waErr);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[orders] unexpected error', err);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
