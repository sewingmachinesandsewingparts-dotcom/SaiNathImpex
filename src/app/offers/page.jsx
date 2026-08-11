"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import HorizontalSalesSpotlight from "@/src/components/ui/horizontal-sales-spotlight";

export default function OffersPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Offers
        </nav>
        <HorizontalSalesSpotlight />
      </div>
    </PageShell>
  );
}
