"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";

export default function BestSellersPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Best sellers
        </nav>
        <div className="hairline bg-card p-8">
          <h1 className="font-display text-5xl">Best sellers</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Popular products section shell added.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
