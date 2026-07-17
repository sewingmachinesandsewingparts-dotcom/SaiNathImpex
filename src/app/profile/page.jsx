"use client";

import api from "@/src/utils/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/src/components/site-shell";
import { useCart } from "@/src/lib/cart-context";
import { useRouter } from "next/navigation";
import { User, MapPin, CreditCard, Bell, LogOut } from "lucide-react";

export default function Profile() {
  const { wishlistCount } = useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .get("/api/auth")
      .then((res) => {
        setUser(res.data.user);
        setImageError(false);
        if (!res.data.user) {
          setMessage("You are not signed in. Please sign in to view your profile.");
          return;
        }

        if (["admin", "superadmin"].includes(res.data.user.role)) {
          router.replace("/admin");
        }
      })
      .catch((err) => {
        console.error("Failed to load auth user:", err);
        setMessage("Unable to load user profile.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSignOut = async () => {
    try {
      await api.delete("/api/auth");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
    router.push("/auth");
  };

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-4 py-10 text-center text-muted-foreground">
          Loading profile...
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <div className="text-2xl font-display mb-4">Not signed in</div>
          <p className="text-muted-foreground mb-6">
            {message || "Please sign in to view your account."}
          </p>
          <Link
            href="/auth"
            className="inline-flex rounded-full bg-copper px-6 py-3 text-sm text-copper-foreground uppercase tracking-[0.18em] hover:bg-copper/90"
          >
            Sign in
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Account
        </nav>
        <div className="flex items-center gap-4">
          {user.image && !imageError ? (
            <img
              src={user.image}
              alt={user.name || "User profile"}
              className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-16 w-16 grid place-items-center rounded-full bg-ink text-bone">
              <User className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="font-display text-5xl">{user.name}</h1>
            <p className="text-muted-foreground text-sm">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4">
          <Card Icon={User} title="Profile">
            Edit your name, email and phone.
          </Card>
          <Card Icon={MapPin} title="Addresses">
            2 saved shipping addresses.
          </Card>
          <Card Icon={CreditCard} title="Payment methods">
            UPI · amit@upi · Visa ••1234
          </Card>
          <Card Icon={Bell} title="Notifications">
            Order updates & sale alerts.
          </Card>
          <Link href="/orders" className="hairline bg-card p-5 hover:border-ink block">
            <div className="font-display text-3xl text-copper">14</div>
            <div className="font-mono text-[11px] tracking-widest uppercase mt-1">
              Orders placed
            </div>
          </Link>
          <Link href="/wishlist" className="hairline bg-card p-5 hover:border-ink block">
            <div className="font-display text-3xl text-copper">{wishlistCount}</div>
            <div className="font-mono text-[11px] tracking-widest uppercase mt-1">
              Wishlist items
            </div>
          </Link>
        </div>

        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive inline-flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function Card({ Icon, title, children }) {
  return (
    <div className="hairline bg-card p-5 hover:border-ink cursor-pointer">
      <Icon className="h-5 w-5 text-copper" />
      <div className="font-display text-2xl mt-2">{title}</div>
      <p className="text-sm text-muted-foreground mt-1">{children}</p>
    </div>
  );
}
