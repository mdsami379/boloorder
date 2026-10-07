import Link from "next/link";

const features = [
  {
    title: "AI Voice Orders",
    text: "An AI agent answers your shop's virtual number 24/7, takes orders politely, and never misses a call.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    ),
  },
  {
    title: "WhatsApp Alerts",
    text: "Instant WhatsApp confirmations to the customer and a 'Naya Order' alert to the shop owner on every order.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    ),
  },
  {
    title: "Auto Receipt Printing",
    text: "One click on 'Confirm & Print' sends an 80mm thermal receipt to the shop's PrintNode printer.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M16.5 18a2.25 2.25 0 002.25 2.25M16.5 18v-3.75m-7.5 3.75V18m-3.75 0a2.25 2.25 0 01-2.25-2.25M7.5 18v-3.75m7.5 3.75a2.25 2.25 0 002.25-2.25M15 15.75v-3.75m-7.5 3.75a2.25 2.25 0 01-2.25-2.25M7.5 12V8.25m7.5 3.75V8.25m0 0a2.25 2.25 0 00-2.25-2.25H9.75a2.25 2.25 0 00-2.25 2.25v3.75"
      />
    ),
  },
  {
    title: "Multi-Language",
    text: "The AI speaks Urdu, English, Punjabi, and Saraiki — set per shop, and it follows the customer's language too.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.784.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
      />
    ),
  },
  {
    title: "Multi-Shop Dashboard",
    text: "Platform owners manage every shop, plan, and payment from one super-admin panel with live analytics.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    ),
  },
  {
    title: "Menu Management",
    text: "Add, edit, and toggle products in seconds. Mark an item unavailable and the AI says it's out of stock.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25"
      />
    ),
  },
];

const steps = [
  {
    n: "1",
    title: "Get your virtual number",
    text: "Sign up your shop and receive a dedicated virtual phone number, like 0301-XXXXXXX. Put it on your banner and Facebook page.",
  },
  {
    n: "2",
    title: "AI answers every call",
    text: "Customers call your number and the AI agent greets them in your shop's language, reads your live menu, and takes the order.",
  },
  {
    n: "3",
    title: "Confirm, print, deliver",
    text: "You get a WhatsApp alert instantly. Hit 'Confirm & Print Receipt' in your dashboard and the thermal printer does the rest.",
  },
];

const plans = [
  {
    name: "Basic",
    price: "Rs 3,000",
    period: "/month",
    tagline: "For small shops getting started with AI orders.",
    cta: "Start Basic",
    features: [
      "1 virtual phone number",
      "AI voice order taking",
      "WhatsApp order alerts",
      "Up to 300 AI calls / month",
      "Shop dashboard",
    ],
  },
  {
    name: "Pro",
    price: "Rs 5,000",
    period: "/month",
    tagline: "For busy shops that run on phone orders.",
    cta: "Start Pro",
    highlight: true,
    features: [
      "Everything in Basic",
      "Up to 1,000 AI calls / month",
      "Auto receipt printing (PrintNode)",
      "Multi-language AI (Urdu, English, Punjabi, Saraiki)",
      "Customer history & insights",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For franchises and multi-branch brands.",
    cta: "Contact Sales",
    features: [
      "Everything in Pro",
      "Multiple shops & branches",
      "Dedicated account manager",
      "Custom AI voice & greetings",
      "API access & integrations",
    ],
  },
];

const transcript = [
  { who: "ai", text: "As-salamu Alaikum! Burger House me khush aamdeed. Main aapka order lene ke liye hazir hun." },
  { who: "customer", text: "Walaikum As-salam! Ek zinger burger aur ek fries chahiye." },
  { who: "ai", text: "Zaroor! Ek zinger burger (Rs 450) aur ek fries (Rs 300). Total Rs 750. Address confirm karein?" },
  { who: "customer", text: "Haan, House 12, Gulberg, Lahore." },
  { who: "ai", text: "Shukriya! Aapka order #1042 receive ho gaya hai. WhatsApp par confirmation bhej di hai." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Voice<span className="text-brand-600">Bazaar</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-brand-600">Features</a>
            <a href="#how-it-works" className="transition hover:text-brand-600">How it works</a>
            <a href="#pricing" className="transition hover:text-brand-600">Pricing</a>
            <a href="#contact" className="transition hover:text-brand-600">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/login" className="btn-secondary hidden !px-4 !py-2 sm:inline-flex">
              Shop Login
            </Link>
            <Link href="/super-admin" className="btn-primary !px-4 !py-2">
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-800">
              <span className="h-2 w-2 rounded-full bg-brand-600" />
              AI Voice Commerce for Pakistani Shops
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Aapki Dukaan ka <span className="text-brand-600">AI Phone Operator</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              Give your shop its own virtual number. Our AI answers every call in{" "}
              <span className="font-semibold text-slate-800">Urdu, English, Punjabi, or Saraiki</span>,
              takes orders from your live menu, prints receipts, and sends WhatsApp confirmations —
              <span className="font-semibold text-slate-800"> while you focus on cooking.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#pricing" className="btn-primary !px-7 !py-3 !text-base">
                Get Your Virtual Number
              </a>
              <a href="#how-it-works" className="btn-secondary !px-7 !py-3 !text-base">
                See How It Works
              </a>
            </div>
            <div className="mt-10 flex items-center gap-8 text-sm text-slate-500">
              <div>
                <p className="text-2xl font-bold text-slate-900">24/7</p>
                <p>AI answers calls</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900">4</p>
                <p>Languages supported</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p>Missed orders</p>
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-slate-900 p-3 shadow-2xl">
              <div className="rounded-[1.6rem] bg-white p-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6 text-brand-700">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Burger House AI</p>
                    <p className="text-xs text-brand-600">Live call · 0301-XXXXXXX</p>
                  </div>
                </div>
                <div className="space-y-3 py-4">
                  {transcript.map((m, i) => (
                    <div key={i} className={`flex ${m.who === "customer" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                          m.who === "customer"
                            ? "rounded-br-md bg-slate-900 text-white"
                            : "rounded-bl-md bg-brand-50 text-slate-800"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-xs font-medium text-slate-500">Order #1042 · Rs 750</span>
                  <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    Confirmed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Features</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything your shop needs to never miss an order
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              One platform: voice AI, WhatsApp, printing, and dashboards — built for Pakistani shops.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card !p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6 text-brand-700">
                    {f.icon}
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Live in 3 simple steps
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="card relative !p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-extrabold text-white">
                  {s.n}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Pricing</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Simple monthly plans
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              No setup fees. Cancel anytime. Pay like shop rent — monthly.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border p-8 ${
                  p.highlight
                    ? "border-brand-600 bg-brand-50/50 shadow-xl ring-2 ring-brand-600"
                    : "border-slate-200 bg-white shadow-card"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.tagline}</p>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-slate-900">{p.price}</span>
                  <span className="text-sm text-slate-500">{p.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-8 flex w-full ${p.highlight ? "btn-primary" : "btn-secondary"} !py-3`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="bg-brand-700 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to let AI answer your shop's phone?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
            Join the shops already taking orders while they sleep. Setup takes less than a day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 active:scale-[0.98]"
            >
              Talk to Sales
            </a>
            <Link
              href="/super-admin"
              className="inline-flex items-center justify-center rounded-xl border border-brand-500 px-7 py-3 text-base font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]"
            >
              Platform Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer id="contact" className="bg-slate-900 py-14 text-slate-400">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                Voice<span className="text-brand-400">Bazaar</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Aapki dukaan ka AI phone operator. Virtual numbers, voice AI ordering,
              WhatsApp alerts, and auto receipt printing — built for Pakistan.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Product</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#features" className="transition hover:text-white">Features</a></li>
              <li><a href="#pricing" className="transition hover:text-white">Pricing</a></li>
              <li><Link href="/super-admin" className="transition hover:text-white">Super Admin</Link></li>
              <li><Link href="/dashboard/login" className="transition hover:text-white">Shop Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>hello@voicebazaar.pk</li>
              <li>+92 300 0000000</li>
              <li>Lahore, Pakistan</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-800 px-4 pt-6 text-center text-xs sm:px-6">
          © 2026 VoiceBazaar. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
