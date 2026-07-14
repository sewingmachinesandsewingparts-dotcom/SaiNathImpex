"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / About
        </nav>
        <div className="hairline bg-card p-8">
          <h1 className="font-display text-5xl">About us</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Company profile and about page shell added.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
