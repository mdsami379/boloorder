/**
 * POST /api/whatsapp/send
 * Manual helper: { to, message } -> sendWhatsAppMessage
 */

import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return Response.json({ error: 'to and message are required' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(to, message);
    return Response.json(result);
  } catch (err) {
    console.error('[whatsapp-send] unexpected error', err);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
