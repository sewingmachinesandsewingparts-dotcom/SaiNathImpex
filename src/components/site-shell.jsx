"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, User, MessageCircle, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/src/lib/cart-context";
import { useAuth } from "@/src/lib/use-auth";
import api from "@/src/utils/api";
import { toast } from "sonner";

// Fallback brands for immediate render before API call completes
const FALLBACK_BRANDS = [
  { slug: "juki", name: "JUKI" },
  { slug: "siruba", name: "SIRUBA" },
  { slug: "brother", name: "BROTHER" },
  { slug: "jack", name: "JACK" },
  { slug: "pegasus", name: "PEGASUS" },
];

/**
 * SiteHeader component containing navigation, search, and user actions.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState(FALLBACK_BRANDS);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use the shared cached auth hook
  const { user: authUser } = useAuth();
  
  const accountHref = authUser
    ? ["admin", "superadmin"].includes(authUser.role)
      ? "/admin"
      : "/profile"
    : "/auth";
  const { cartCount, wishlistCount } = useCart();

  // Prefetch and fetch brands only once on mount (no router/pathname dependency loop)
  useEffect(() => {
    const commonRoutes = [
      "/catalog",
      "/wishlist",
      "/cart",
      "/support",
      "/auth",
      "/orders",
      "/admin",
      "/sales",
    ];

    commonRoutes.forEach((route) => router.prefetch(route));

    api("/api/brands")
      .then((res) => res.data)
      .then((data) => {
        const filtered = data.filter((b) => b.isBrand);
        if (filtered.length > 0) {
          setBrands(filtered);
          filtered.forEach((brand) => router.prefetch(`/brand/${brand.slug}`));
        }
      })
      .catch((err) => console.error("Error loading brands in header:", err));
  }, [router]);

  // Handle blocking notification once globally per session via axios interceptor
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (error) => {
        const msg = error?.response?.data?.message || error?.message || "Request failed";
        if (/blocked/i.test(String(msg || ""))) {
          toast.error("Your account has been blocked by an administrator.");
        } else {
          toast.error(msg);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(id);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = e.target.q.value;
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&nameOnly=true`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      {/* Top utility bar */}
      <div className="bg-ink text-bone text-[11px] tracking-[0.18em] font-mono uppercase">
        <div className="mx-auto max-w-7xl px-4 h-7 flex items-center justify-between">
          <span>Shipping ₹199 on all eligible orders</span>
          <span className="hidden sm:inline">Workshop hotline · +91 161 4002 200</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="grid place-items-center h-9 w-9 bg-ink text-bone font-display text-xl">
            M
          </div>
          <div className="leading-none">
            <div className="font-display text-2xl tracking-wide">Sewing Parts</div>
            <div className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase">
              est · industrial parts
            </div>
          </div>
        </Link>

        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-2xl items-center hairline bg-card focus-within:border-copper transition-colors"
        >
          <Search className="h-4 w-4 ml-3 text-muted-foreground" />
          <input
            name="q"
            placeholder="Search part #, model, brand, diagram # or compatibility…"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="font-mono text-[11px] tracking-[0.15em] uppercase px-4 py-2.5 bg-ink text-bone hover:bg-copper transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <nav className="flex items-center gap-1">
          <Link href="/wishlist" className="p-2 hover:text-copper relative" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 grid place-items-center text-[10px] font-mono bg-copper text-copper-foreground rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="p-2 hover:text-copper relative" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 grid place-items-center text-[10px] font-mono bg-copper text-copper-foreground rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/support"
            className="p-2 hover:text-copper hidden sm:inline-flex"
            aria-label="Support"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          <Link href={accountHref} className="p-2 hover:text-copper" aria-label="Account">
            {authUser?.image && !imageError ? (
              <img
                src={authUser.image}
                alt={authUser.name || "User profile"}
                className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-ink text-bone">
                <User className="h-4 w-4" />
              </div>
            )}
          </Link>
        </nav>
      </div>

      {/* Brand strip nav */}
      <div className="border-t border-border bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 h-11 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          <Link
            href="/catalog"
            className="font-mono text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 hover:text-copper whitespace-nowrap"
          >
            All Parts
          </Link>
          <span className="text-border">|</span>
          {brands.map((b) => (
            <Link
              key={b.slug}
              href={`/brand/${b.slug}`}
              className="font-mono text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 hover:text-copper whitespace-nowrap"
            >
              {b.name}
            </Link>
          ))}
          <span className="text-border">|</span>
          <Link
            href="/categories"
            className="font-mono text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 hover:text-copper whitespace-nowrap"
          >
            Categories
          </Link>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border p-4 space-y-3 bg-background">
          <form onSubmit={handleSearchSubmit} className="flex hairline">
            <input
              name="q"
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              placeholder="Search…"
            />
            <button type="submit" className="px-3 bg-ink text-bone">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

/**
 * SiteFooter component showing GST details, certifications, and useful site links.
 */
export function SiteFooter() {
  const { user: authUser } = useAuth();

  return (
    <footer className="mt-24 border-t border-border bg-ink text-bone">
      <div className="mx-auto max-w-7xl px-4 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="font-display text-3xl">Sewing Parts</div>
          <p className="text-sm text-bone/70 mt-2 max-w-sm">
            Workshop-grade sewing machine parts. Stocked in Ludhiana. Shipped pan-India in 48 hours.
          </p>
          <div className="mt-6 flex items-center gap-3 text-[11px] font-mono tracking-[0.18em] uppercase">
            <span className="px-2 py-1 border border-bone/30">GST · 03AAACX0000X1Z2</span>
            <span className="px-2 py-1 border border-bone/30">ISO 9001</span>
          </div>
        </div>
        {[
          {
            h: "Shop",
            links: [
              ["All parts", "/catalog"],
              ["By brand", "/brand/juki"],
              ["By category", "/categories"],
              ["Sales", "/sales"],
            ],
          },
          {
            h: "Help",
            links: [
              ["Support", "/support"],
              ["Shipping & GST", "/shipping"],
              ["Returns", "/returns"],
              ["Contact", "/contact"],
            ],
          },
          {
            h: "Account",
            links: authUser
              ? [
                  ["Profile", "/profile"],
                  ["My orders", "/orders"],
                  ["Wishlist", "/wishlist"],
                  ...(["admin", "superadmin"].includes(authUser.role) ? [["Admin", "/admin"]] : []),
                ]
              : [
                  ["Sign in", "/auth"],
                  ["My orders", "/orders"],
                  ["Wishlist", "/wishlist"],
                ],
          },
        ].map((col) => (
          <div key={col.h}>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-copper">
              {col.h}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {col.links.map(([t, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-copper">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-bone/10">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between text-[11px] font-mono tracking-[0.15em] uppercase text-bone/60">
          <span>Ludhiana · Punjab · India</span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
