"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";

export default function ReturnsPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}/ Returns & Refunds
        </nav>
        <div className="hairline bg-card p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-copper">Policy</div>
          <h1 className="font-display text-5xl mt-3">Returns & refunds</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Returns are reviewed based on product condition, packaging integrity, and invoice verification.
          </p>
          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <p>• Eligible returns must be requested within the stated return window.</p>
            <p>• Defective or incorrect items can be returned for replacement or refund.</p>
            <p>• Refunds are processed back to the original payment method after inspection.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
