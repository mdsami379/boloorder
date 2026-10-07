/**
 * POST /api/ai/create-order
 * Called by the Vapi voice agent after taking an order.
 * Handles Multilingual Matching, Shop Auto-detect, WhatsApp Alerts & Customer Upsert.
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendWhatsAppMessage, buildOrderMessages } from '@/lib/whatsapp';

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function numbersMatch(a, b) {
  const x = digits(a);
  const y = digits(b);
  if (!x || !y) return false;
  return x.slice(-10) === y.slice(-10);
}

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Tool Call arguments ya Direct JSON handle karein
    const toolArgs =
      body.message?.toolCalls?.[0]?.function?.arguments ||
      body.message?.functionCall?.arguments ||
      {};

    const payload =
      typeof toolArgs === 'string'
        ? JSON.parse(toolArgs || '{}')
        : Object.keys(toolArgs).length > 0
        ? toolArgs
        : body;

    let {
      shop_id,
      customer_phone,
      customer_name,
      customer_address,
      items,
      total,
      preferred_language,
    } = payload;

    // Items array parse karein agar string ho
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }

    // 2. Shop Auto-Detection (agar Vapi ne shop_id na bheji ho)
    if (!shop_id) {
      const inboundPhone =
        body.called_number ||
        payload.called_number ||
        body.message?.call?.phoneNumber?.number ||
        body.call?.phoneNumber?.number;

      const { data: shops } = await supabaseAdmin
        .from('shops')
        .select('id, virtual_number')
        .eq('is_active', true);

      if (inboundPhone && shops) {
        const found = shops.find((s) => numbersMatch(s.virtual_number, inboundPhone));
        if (found) shop_id = found.id;
      }

      // Fallback: Pehli active shop utha lein
      if (!shop_id && shops && shops.length > 0) {
        shop_id = shops[0].id;
      }
    }

    // Phone resolve karein (call metadata fallback)
    const rawPhone =
      customer_phone ||
      payload.customer_phone ||
      body.message?.call?.customer?.number ||
      body.call?.customer?.number;

    const phone = digits(rawPhone) || '0000000000';

    if (!shop_id || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: 'shop_id and valid items[] are required' },
        { status: 400 }
      );
    }

    // 3. Database se dukan ke products le kar aao
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, product_name, price')
      .eq('shop_id', shop_id);

    if (prodErr) {
      console.error('[create-order] product lookup error', prodErr);
    }

    // 4. Multilingual & Semantic Fuzzy Matching (Urdu/Punjabi -> Official Product Name)
    const normalizedItems = items.map((item) => {
      const rawName = String(item.product_name || item.name || '').toLowerCase().trim();

      const matchedProduct = (dbProducts || []).find((p) => {
        const official = (p.product_name || '').toLowerCase().trim();

        // Exact match
        if (official === rawName || official.includes(rawName) || rawName.includes(official)) {
          return true;
        }

        // Zinger / Burger variants (Urdu: زنگر برگر, Punjabi: zinger)
        if (
          (rawName.includes('zinger') || rawName.includes('زنگر') || rawName.includes('برگر') || rawName.includes('burger')) &&
          official.includes('zinger')
        ) {
          return true;
        }

        // Drinks / Botal variants (بوتل, thandi botal, drink, cold drink, coke, pepsi)
        if (
          (rawName.includes('botal') || rawName.includes('drink') || rawName.includes('بوتل') || rawName.includes('cold') || rawName.includes('pepsi') || rawName.includes('coke')) &&
          (official.includes('drink') || official.includes('cold') || official.includes('botal'))
        ) {
          return true;
        }

        // Biryani / Rice variants (بریانی, chawal)
        if (
          (rawName.includes('biryani') || rawName.includes('بریانی') || rawName.includes('chawal')) &&
          official.includes('biryani')
        ) {
          return true;
        }

        return false;
      });

      const qty = Number(item.qty || item.quantity) || 1;
      const price = matchedProduct ? Number(matchedProduct.price) : (Number(item.price) || 0);

      return {
        product_id: matchedProduct ? matchedProduct.id : (item.product_id || null),
        product_name: matchedProduct ? matchedProduct.product_name : (item.product_name || item.name),
        qty,
        price,
      };
    });

    // Total calculate karein agar payload mein galat ya missing ho
    const calculatedTotal = normalizedItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const finalTotal = total != null && total > 0 ? total : calculatedTotal;

    // 5. Orders table mein insert karein
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          shop_id,
          customer_phone: phone,
          customer_name: customer_name || 'Phone Customer',
          items: normalizedItems,
          total_amount: finalTotal,
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

    // 6. Customer table upsert karein
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
      console.error('[create-order] customer upsert failed', custErr);
    }

    // 7. WhatsApp notifications
    try {
      const { data: shop, error: shopErr } = await supabaseAdmin
        .from('shops')
        .select('shop_name, owner_whatsapp, whatsapp_enabled')
        .eq('id', shop_id)
        .single();

      if (!shopErr && shop) {
        const itemsText = normalizedItems
          .map((i) => `${i.qty}x ${i.product_name}`)
          .join(', ');

        const { customerMsg, ownerMsg } = buildOrderMessages({
          order_id,
          shop_name: shop.shop_name,
          customer_name: customer_name || 'Customer',
          customer_phone: phone,
          itemsText,
          total: finalTotal,
          owner_whatsapp: shop.owner_whatsapp,
        });

        if (phone && phone !== '0000000000') {
          await sendWhatsAppMessage(phone, customerMsg);
        }

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
