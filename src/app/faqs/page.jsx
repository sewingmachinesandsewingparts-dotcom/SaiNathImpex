"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";

const faqs = [
  {
    q: "How are shipping charges calculated?",
    a: "Shipping is charged at checkout based on the selected delivery option and destination state. GST is also calculated on the final taxable amount.",
  },
  {
    q: "Can I place a bulk order?",
    a: "Yes. Contact support with your required SKU list and quantity for custom bulk pricing and delivery planning.",
  },
  {
    q: "How quickly can I get an invoice?",
    a: "Invoices are issued automatically with the order and are available from the order history page.",
  },
];

export default function FaqsPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}/ FAQs
        </nav>
        <div className="hairline bg-card p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-copper">Help center</div>
          <h1 className="font-display text-5xl mt-3">Frequently asked questions</h1>
          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-background p-4">
                <div className="font-medium">{item.q}</div>
                <div className="mt-2 text-sm text-muted-foreground">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
