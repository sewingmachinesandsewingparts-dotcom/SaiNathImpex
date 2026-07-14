"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";

export default function TermsPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}/ Terms of service
        </nav>
        <div className="hairline bg-card p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-copper">Legal</div>
          <h1 className="font-display text-5xl mt-3">Terms of service</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            By placing an order, you agree to the site terms, payment conditions, and return policy.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
