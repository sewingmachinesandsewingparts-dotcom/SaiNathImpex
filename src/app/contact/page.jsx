"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}/ Contact
        </nav>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <section className="hairline bg-card p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-copper">Support</div>
            <h1 className="font-display text-5xl mt-3">Contact our team</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Use this page for order questions, compatibility requests, and bulk procurement support.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-copper" />
                <span className="text-sm">support@sewingparts.in</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-copper" />
                <span className="text-sm">+91 161 4002 200</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-copper" />
                <span className="text-sm">Ludhiana, Punjab, India</span>
              </div>
            </div>
          </section>
          <section className="hairline bg-card p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-copper">Quick help</div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <MessageCircle className="h-4 w-4 text-copper mt-0.5" />
                <span>Chat with support from the live support page for quicker problem resolution.</span>
              </div>
              <div className="flex gap-3">
                <MessageCircle className="h-4 w-4 text-copper mt-0.5" />
                <span>Share your order ID and issue details so our team can resolve it faster.</span>
              </div>
            </div>
            <Link
              href="/support"
              className="mt-8 inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-bone hover:bg-copper"
            >
              Open support
            </Link>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
