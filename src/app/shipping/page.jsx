"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";

export default function ShippingPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}/ Shipping & GST
        </nav>
        <div className="hairline bg-card p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-copper">Delivery</div>
          <h1 className="font-display text-5xl mt-3">Shipping & GST</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Shipping charges and GST are calculated during checkout from your selected state and delivery method.
          </p>
          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <p>• Standard delivery: ₹199</p>
            <p>• Express delivery: ₹499</p>
            <p>• GST is computed on item pricing and shipping, with intra-state and inter-state tax handling.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
