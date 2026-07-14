"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { useCart } from "@/src/lib/cart-context";
import { formatINR } from "@/src/lib/format";
import { Minus, Plus, X, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { cart, updateQty, removeFromCart } = useCart();

  const subtotal = cart.reduce((a, i) => a + i.part.price * i.qty, 0);
  const gst = cart.reduce(
    (a, i) => a + Math.round(i.part.price * i.qty * (i.part.hasMotor ? 0.18 : 0.05)),
    0,
  );
  const shipping = subtotal === 0 ? 0 : 199;
  const total = subtotal + gst + shipping;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Cart
        </nav>
        <h1 className="font-display text-6xl">Your cart</h1>
        <p className="text-muted-foreground mt-2">{cart.length} items · ready to checkout</p>

        {cart.length === 0 ? (
          <div className="mt-10 hairline bg-card p-12 text-center flex flex-col items-center gap-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <div className="font-display text-3xl">Your cart is empty</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Browse the industrial catalog to find compatible replacement parts for
              your stitcher.
            </p>
            <Link
              href="/catalog"
              className="h-11 px-6 inline-flex items-center bg-ink text-bone hover:bg-copper font-mono text-xs uppercase tracking-[0.2em] transition-colors"
            >
              Browse parts
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-3">
              {cart.map(({ sku, qty, part }) => (
                <div
                  key={sku}
                  className="hairline bg-card p-4 flex gap-4 items-center flex-wrap sm:flex-nowrap"
                >
                  <img
                    src={
                      part.images?.[0] ||
                      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"
                    }
                    alt={part.name}
                    className="h-20 w-20 sm:h-24 sm:w-24 object-cover hairline"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                      {part.brandName} · {part.modelName}
                    </div>
                    <Link
                      href={`/part/${part.sku}`}
                      className="font-display text-xl truncate block hover:text-copper"
                    >
                      {part.name}
                    </Link>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      SKU {part.sku}
                    </div>
                  </div>
                  <div className="hairline flex items-center bg-background shrink-0">
                    <button
                      onClick={() => qty > 1 && updateQty(sku, qty - 1)}
                      disabled={qty === 1}
                      className={`h-9 w-9 grid place-items-center ${qty === 1 ? "cursor-not-allowed text-muted-foreground" : "hover:bg-secondary cursor-pointer"}`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm">{qty}</span>
                    <button
                      onClick={() => updateQty(sku, qty + 1)}
                      className="h-9 w-9 grid place-items-center hover:bg-secondary cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right w-28 shrink-0">
                    <div className="font-display text-xl">{formatINR(part.price * qty)}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {formatINR(part.price)} ea
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(sku)}
                    className="h-9 w-9 grid place-items-center hover:bg-destructive hover:text-destructive-foreground cursor-pointer shrink-0"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="hairline bg-card p-4 flex items-center justify-between">
                <input
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  placeholder="Coupon code · e.g. MONSOON12"
                />
                <button className="font-mono text-[11px] tracking-[0.15em] uppercase px-4 py-2 bg-ink text-bone hover:bg-copper cursor-pointer">
                  Apply
                </button>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="hairline bg-card p-6 sticky top-28">
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-4">
                  Order summary
                </div>
                <dl className="space-y-2 text-sm">
                  <Row k="Subtotal" v={formatINR(subtotal)} />
                  <Row k="GST (5% / 18%)" v={formatINR(gst)} />
                  <Row k="Shipping" v={formatINR(shipping)} />
                  <div className="border-t border-border pt-3 mt-3 flex items-end justify-between">
                    <dt className="font-mono text-xs uppercase tracking-widest">Total</dt>
                    <dd className="font-display text-3xl">{formatINR(total)}</dd>
                  </div>
                </dl>
                <Link
                  href="/checkout"
                  className="mt-5 w-full h-12 bg-ink text-bone hover:bg-copper transition-colors font-mono text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-copper" /> Secure checkout · GST invoice
                  issued
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono">{v}</dd>
    </div>
  );
}
