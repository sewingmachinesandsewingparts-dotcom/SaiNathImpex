"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  MessageSquare,
  BarChart3,
  Wrench,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/features", icon: Wrench, label: "Features" },
  { href: "/admin/sales", icon: Tag, label: "Sales" },
  { href: "/admin/issues", icon: MessageSquare, label: "Support" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminShell({ children, title, subtitle }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let active = true;
    axios
      .get("/api/auth")
      .then((res) => {
        if (!active) return;
        const role = res.data.user?.role;
        if (!["admin", "superadmin"].includes(role)) {
          router.replace("/profile");
        }
      })
      .catch(() => {
        if (active) {
          router.replace("/auth");
        }
      })
      .finally(() => {
        if (active) {
          setAuthChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-20">
          Checking admin access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="w-60 bg-ink text-bone flex flex-col sticky top-0 h-screen shrink-0">
        <Link href="/admin" className="p-5 border-b border-bone/10 flex items-center gap-2">
          <div className="grid place-items-center h-8 w-8 bg-copper text-copper-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <div className="font-display text-xl">Parts Admin</div>
            <div className="font-mono text-[9px] tracking-[0.25em] text-bone/60 uppercase">
              Admin Console
            </div>
          </div>
        </Link>
        <nav className="flex-1 py-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-colors ${
                  active
                    ? "border-copper bg-bone/5 text-bone"
                    : "border-transparent text-bone/70 hover:text-bone hover:bg-bone/5"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-bone/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 grid place-items-center bg-bone/10 font-mono text-xs">PS</div>
            <div className="leading-tight">
              <div className="text-sm">Priya Singh</div>
              <div className="font-mono text-[10px] text-copper uppercase tracking-widest">
                Superadmin
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await axios.delete("/api/auth");
              } catch (error) {
                console.error("Admin logout failed:", error);
              }
              router.push("/auth");
            }}
            className="w-full rounded-full border border-border bg-ink px-4 py-3 text-sm font-medium text-bone hover:border-copper"
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-background border-b border-border px-8 py-6">
          <h1 className="font-display text-4xl tracking-wide">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </header>
        <div className="p-8 flex-1">{children}</div>
      </div>
    </div>
  );
}
