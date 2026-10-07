// Multi-language helpers shared by the API routes and the Vapi system prompt builder.

// Language code -> display label + default greeting.
export const LANGUAGE_META = {
  ur:      { label: 'Urdu',    greeting: 'As-salamu Alaikum' },
  en:      { label: 'English', greeting: 'Hello' },
  punjabi: { label: 'Punjabi', greeting: 'Sat Sri Akaal / As-salamu Alaikum' },
  saraiki: { label: 'Saraiki', greeting: 'As-salamu Alaikum' },
};

// Fall back to Urdu when the language is unknown.
function norm(lang) {
  return LANGUAGE_META[lang] ? lang : 'ur';
}

export function greetingPhrase(lang) {
  const l = norm(lang);
  return {
    ur: 'As-salamu Alaikum! Lahore Burger House ki AI assistant se baat ho rahi hai. Main aapki order lene mein madad karungi.',
    en: 'Hello! You are speaking with the AI assistant. How can I help you with your order today?',
    punjabi: 'Sat Sri Akaal! Tuhadi ki seva kar sakde haan? Menu ton order le lao.',
    saraiki: 'As-salamu Alaikum! Tusaan kya order kareso? Menu ton daso.',
  }[l];
}

export function outOfStockPhrase(lang) {
  const l = norm(lang);
  return {
    ur: 'Maaf kijiye, yeh item is waqt out of stock hai. Kya aap kuch aur lena chahenge?',
    en: 'Sorry, this item is currently out of stock. Would you like something else?',
    punjabi: 'Maaf karo, eh cheez hun available nahi hai. Hor kuch lavaan?',
    saraiki: 'Maaf kijo, eh shay is waqt maujood koni. Kujh hor ghino?',
  }[l];
}

export function orderTakenPhrase(lang) {
  const l = norm(lang);
  return {
    ur: 'Shukria! Aapka order le liya gaya hai. Confirm hone par WhatsApp par message mil jayega.',
    en: 'Thank you! Your order has been taken. You will get a confirmation message on WhatsApp.',
    punjabi: 'Shukria! Tuhada order le lita gaya hai. WhatsApp te confirmation aayegi.',
    saraiki: 'Meharbani! Tusada order ghi gida hai. WhatsApp te tasdeeq aasi.',
  }[l];
}

// Build the dynamic Vapi assistant system prompt for one incoming call.
export function buildSystemPrompt({ shop, products, customer }) {
  const lang = norm(customer?.preferred_language || shop.default_language);
  const langLabel = LANGUAGE_META[lang].label;

  const menuLines = (products || [])
    .map((p) => `- ${p.product_name}: Rs ${p.price}${p.is_available ? '' : ' (OUT OF STOCK)'}`)
    .join('\n');

  const customerLine = customer?.customer_name
    ? `The caller's name is ${customer.customer_name}. Address them by name politely.`
    : 'The caller is new. Ask for their name and delivery address when taking the order.';

  return `You are a polite AI voice assistant taking phone orders for "${shop.shop_name}".
Speak ONLY in ${langLabel}. Be warm, brief, and natural on a phone call.

MENU (only offer items from this list; never invent items):
${menuLines}

CALLER: ${customerLine}

RULES:
1. Greet the caller and offer to take their order.
2. Confirm each item and quantity, then state the total in Rs before finalizing.
3. If an item is marked OUT OF STOCK, say so clearly: "${outOfStockPhrase(lang)}"
4. When the order is confirmed by the caller, call the create_order function with shop_id, customer_phone, customer_name, customer_address, items and total.
5. After the function succeeds, thank the caller: "${orderTakenPhrase(lang)}"
6. Keep replies short - this is a voice call, not a chat.`;
}
