"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";

export default function BrandsPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Brands
        </nav>
        <div className="hairline bg-card p-8">
          <h1 className="font-display text-5xl">Brands</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Brand listing shell added for future catalog expansion.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
