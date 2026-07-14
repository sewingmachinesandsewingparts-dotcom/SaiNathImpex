"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { useCart } from "@/src/lib/cart-context";
import { PartCard } from "@/src/components/part-card";
import { Heart, ShoppingBag } from "lucide-react";

export default function Wishlist() {
  const { wishlist, parts, loading } = useCart();

  // Resolve parts details for items in wishlist
  const wishlistedItems = wishlist.map((sku) => parts.find((p) => p.sku === sku)).filter(Boolean);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Wishlist
        </nav>
        <h1 className="font-display text-6xl">Your Wishlist</h1>
        <p className="text-muted-foreground mt-2">{wishlist.length} items saved for later</p>

        {loading && parts.length === 0 ? (
          <div className="mt-8 hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Connecting to parts registry...
          </div>
        ) : wishlistedItems.length === 0 ? (
          <div className="mt-10 hairline bg-card p-12 text-center flex flex-col items-center gap-4">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <div className="font-display text-3xl">Your wishlist is empty</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Bookmark parts in the catalog to quickly find them for your future stitchers.
            </p>
            <Link
              href="/catalog"
              className="h-11 px-6 inline-flex items-center bg-ink text-bone hover:bg-copper font-mono text-xs uppercase tracking-[0.2em] transition-colors"
            >
              Shop parts
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlistedItems.map((p) => (
              <PartCard key={p.sku} part={p} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
