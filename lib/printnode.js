/**
 * PrintNode helper — prints 80mm thermal receipts.
 *
 * Required env vars:
 *   PRINTNODE_API_KEY      - PrintNode API key
 *   PRINTNODE_PRINTER_ID   - numeric printer id
 *
 * Docs: https://www.printnode.com/docs/api/
 */

const LINE_WIDTH = 32; // 80mm thermal printer

function center(text) {
  const t = String(text).slice(0, LINE_WIDTH);
  const pad = Math.max(0, Math.floor((LINE_WIDTH - t.length) / 2));
  return ' '.repeat(pad) + t;
}

function row(left, right) {
  const l = String(left);
  const r = String(right);
  const spaces = Math.max(1, LINE_WIDTH - l.length - r.length);
  return (l + ' '.repeat(spaces) + r).slice(0, LINE_WIDTH);
}

const DASH = '-'.repeat(LINE_WIDTH);

/**
 * Build the raw receipt text for an 80mm thermal printer.
 * order: { id, items: [{product_name, qty, price}], total_amount, customer_phone, customer_name, created_at }
 * shop:  { shop_name, virtual_number }
 */
export function formatReceipt({ order, shop }) {
  const lines = [];
  lines.push('');
  lines.push(center(shop.shop_name || ''));
  lines.push(center('Voice Order Receipt'));
  lines.push(DASH);
  lines.push(row('Order No:', `#${order.id}`));
  lines.push(row('Date:', new Date(order.created_at || Date.now()).toLocaleString('en-PK')));
  lines.push(row('Customer:', order.customer_name || order.customer_phone || ''));
  lines.push(row('Phone:', order.customer_phone || ''));
  if (shop.virtual_number) lines.push(row('Shop No:', shop.virtual_number));
  lines.push(DASH);
  lines.push(row('Item', 'Qty x Price'));
  lines.push(DASH);

  const items = Array.isArray(order.items) ? order.items : [];
  for (const it of items) {
    const qty = it.qty || it.quantity || 1;
    const price = it.price || 0;
    lines.push(row(`${it.product_name || 'Item'}`.slice(0, 22), `${qty} x Rs ${price}`));
    lines.push(row('', `Rs ${qty * price}`));
  }

  lines.push(DASH);
  lines.push(row('TOTAL:', `Rs ${order.total_amount}`));
  lines.push(DASH);
  lines.push('');
  lines.push(center('Shukria! Visit Again'));
  lines.push('');
  lines.push('');
  return lines.join('\n');
}

/**
 * Send a print job to PrintNode (raw base64 text content).
 * Returns { ok:true, jobId } or { ok:false, skipped:true } when not configured.
 */
export async function printReceipt({ order, shop }) {
  const apiKey = process.env.PRINTNODE_API_KEY;
  const printerId = parseInt(process.env.PRINTNODE_PRINTER_ID || '0', 10);

  if (!apiKey || !printerId) {
    console.log('[printnode] skipped - PRINTNODE_API_KEY / PRINTNODE_PRINTER_ID not set');
    return { ok: false, skipped: true };
  }

  const receiptText = formatReceipt({ order, shop });
  const content = Buffer.from(receiptText, 'utf8').toString('base64');

  try {
    const res = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerId,
        title: `Order #${order.id}`,
        contentType: 'raw_base64',
        content,
        source: 'VoiceBazaar',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[printnode] api error', res.status, data);
      return { ok: false, error: data };
    }
    return { ok: true, jobId: data };
  } catch (err) {
    console.error('[printnode] print failed', err);
    return { ok: false, error: err.message };
  }
}
