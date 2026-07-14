"use client";

import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { AdminShell } from "@/src/components/admin-shell";

export function AccountPageFrame({ title, description, breadcrumb, children }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <nav className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          {breadcrumb &&
            breadcrumb.map((item, index) => (
              <span key={item.href || item.label}>
                {index > 0 ? " / " : ""}
                {item.href ? (
                  <Link href={item.href} className="hover:text-copper">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </span>
            ))}
        </nav>
        <div className="hairline bg-card p-8">
          <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
          {description && <p className="mt-3 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </PageShell>
  );
}

export function AdminPageFrame({ title, subtitle, children }) {
  return (
    <AdminShell title={title} subtitle={subtitle}>
      <div className="space-y-6">{children}</div>
    </AdminShell>
  );
}
