import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { formatINR } from "@/src/lib/format";
import connectMongo from "@/src/lib/mongo";
import Order from "@/src/models/Order";

export default async function InvoicePage({ params }) {
  await connectMongo();
  const { id } = params;
  const order = await Order.findOne({ id });

  if (!order) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Order invoice not found.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}/ <Link href="/orders" className="hover:text-copper">Orders</Link> / Invoice
        </nav>

        <div className="rounded-4xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Invoice
              </div>
              <h1 className="font-display text-5xl mt-2">{order.id}</h1>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Order status
              </div>
              <div className="mt-2 inline-flex rounded-full bg-copper/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-copper">
                {order.status}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Billed to</div>
              <div className="mt-3 text-sm leading-relaxed">
                <div>{order.customerName}</div>
                <div>{order.customerEmail}</div>
                {order.customerPhone && <div>{order.customerPhone}</div>}
              </div>
            </div>
            <div className="rounded-3xl border border-border p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Shipping address</div>
              <div className="mt-3 text-sm leading-relaxed whitespace-pre-line">
                {order.shippingAddress || "N/A"}
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {order.items.map((item) => (
                  <tr key={item.sku} className="border-t border-border">
                    <td className="px-4 py-4">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.sku}</div>
                    </td>
                    <td className="px-4 py-4">{item.qty}</td>
                    <td className="px-4 py-4">{formatINR(item.price)}</td>
                    <td className="px-4 py-4">{formatINR(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col gap-2 items-end text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total</div>
            <div className="font-display text-4xl">{formatINR(order.total)}</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
