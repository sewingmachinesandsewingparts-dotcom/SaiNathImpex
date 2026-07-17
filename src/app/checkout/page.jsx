"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PageShell } from "@/src/components/site-shell";
import { useCart } from "@/src/lib/cart-context";
import { formatINR } from "@/src/lib/format";
import { Lock, Truck, CreditCard, CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import api from '@/src/utils/api';
import { toast } from 'sonner';

const BANK_OPTIONS = [
  "HDFC Bank",
  "State Bank of India",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
];

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    gstin: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentData, setPaymentData] = useState({
    upiId: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    bankName: "",
  });
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const subtotal = cart.reduce((a, i) => a + i.part.price * i.qty, 0);
  // legacy fallback calculations (used until API response arrives)
  const fallbackItemTax = cart.reduce(
    (a, i) => a + Math.round(i.part.price * i.qty * (i.part.hasMotor ? 0.18 : 0.05)),
    0,
  );
  const fallbackShipping = subtotal === 0 ? 0 : shippingMethod === "standard" ? 199 : 499;
  const fallbackShippingGst = Math.round(fallbackShipping * 0.05);
  const fallbackTotal = subtotal + fallbackItemTax + fallbackShipping + fallbackShippingGst;

  const [taxData, setTaxData] = useState(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [gstVerification, setGstVerification] = useState(null);

  const displayItemTax = taxData?.tax?.total ?? fallbackItemTax;
  const displayCgst = taxData?.tax?.cgst ?? Math.round((taxData?.tax?.total ?? fallbackItemTax) / 2);
  const displaySgst = taxData?.tax?.sgst ?? ((taxData?.tax?.total ?? fallbackItemTax) - displayCgst);
  const displayIgst = taxData?.tax?.igst ?? 0;
  const displayShipping = taxData?.shipping ?? fallbackShipping;
  const displayShippingGst = taxData?.shippingGst ?? fallbackShippingGst;
  const total = Math.round(subtotal + displayItemTax + displayShipping + displayShippingGst);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Recalculate tax + shipping when destination state, shipping method, or cart changes
    const run = async () => {
      if (!formData.state) return;
      setTaxLoading(true);
      try {
        const items = cart.map((i) => ({ sku: i.sku, qty: i.qty, price: i.part.price, hasMotor: i.part.hasMotor }));
        const res = await api('/api/tax-and-shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ state: formData.state, shippingMethod, items, subtotal }),
        });
        const data = await res.data;
        if (data?.ok) setTaxData(data);
      } catch (err) {
        console.error('tax calc error', err);
      } finally {
        setTaxLoading(false);
      }
    };

    run();
  }, [formData.state, shippingMethod, cart, subtotal]);

  const verifyGstin = async () => {
    if (!formData.gstin) return toast.error('Enter GSTIN to verify');
    try {
      const res = await api('/api/gst/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ gstin: formData.gstin.trim() }),
      });
      const data = await res.data;
      setGstVerification(data);
      if (data?.ok && (data.valid || data.data)) {
        toast.success('GSTIN looks valid');
      } else {
        toast.error('GSTIN could not be verified');
      }
    } catch (err) {
      console.error(err);
      toast.error('GST verification failed');
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.street || !formData.city) {
      toast.error("Please fill in all required shipping address fields.");
      return;
    }

    if (paymentMethod === "UPI" && !paymentData.upiId.trim()) {
      toast.error("Please enter your UPI ID to continue.");
      return;
    }

    if (
      paymentMethod === "Credit / debit card" &&
      (!paymentData.cardNumber.trim() || !paymentData.cardName.trim() || !paymentData.cardExpiry.trim() || !paymentData.cardCvv.trim())
    ) {
      toast.error("Please enter your card details to continue.");
      return;
    }

    if (paymentMethod === "Net banking" && !paymentData.bankName.trim()) {
      toast.error("Please select your bank for net banking.");
      return;
    }

    if (paymentMethod === "Cash on delivery" && total >= 10000) {
      toast.error("Cash on delivery is only available for orders under ₹10,000.");
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      items: cart.map((i) => ({
        sku: i.sku,
        name: i.part.name,
        price: i.part.price,
        qty: i.qty,
        image: i.part.images?.[0],
      })),
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: `${formData.street}, ${formData.city}, ${formData.state} - ${formData.zip}`,
      paymentMethod,
      paymentDetails: {
        upiId: paymentData.upiId,
        cardNumber: paymentData.cardNumber,
        cardName: paymentData.cardName,
        cardExpiry: paymentData.cardExpiry,
        cardCvv: paymentData.cardCvv,
        bankName: paymentData.bankName,
      },
      total,
      taxBreakdown: taxData?.tax || { total: displayItemTax, cgst: displayCgst, sgst: displaySgst, igst: displayIgst },
      shipping: displayShipping,
      shippingGst: displayShippingGst,
      gstVerification,
    };

    try {
      const { data } = await api("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(orderPayload),
      });
      setOrderResult(data);
      clearCart();
    } catch (err) {
      console.error("Order API error:", err);
      toast.error("Network error: Could not reach ordering server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully placed, show success state
  if (orderResult) {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center flex flex-col items-center gap-6">
          <CheckCircle2 className="h-16 w-16 text-success animate-bounce" />
          <h1 className="font-display text-5xl">Order Placed!</h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            Thank you for your order. We have received your order and are preparing
            it for shipment from Ludhiana.
          </p>
          <div className="w-full hairline bg-card p-6 text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">ORDER ID</span>
              <span className="font-bold text-copper">{orderResult.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CUSTOMER</span>
              <span>{orderResult.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TOTAL AMOUNT</span>
              <span className="font-bold">{formatINR(orderResult.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DELIVERY TO</span>
              <span className="truncate max-w-50">{orderResult.shippingAddress}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/orders"
              className="h-12 px-6 inline-flex items-center gap-2 bg-ink text-bone hover:bg-copper font-mono text-xs uppercase tracking-[0.2em] transition-colors"
            >
              Order history
            </Link>
            <Link
              href="/catalog"
              className="h-12 px-6 inline-flex items-center gap-2 border border-ink hover:bg-ink hover:text-bone font-mono text-xs uppercase tracking-[0.2em] transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/cart" className="hover:text-copper">
            Cart
          </Link>{" "}
          / Checkout
        </nav>
        <h1 className="font-display text-6xl">Checkout</h1>

        {cart.length === 0 ? (
          <div className="mt-10 hairline bg-card p-12 text-center flex flex-col items-center gap-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <div className="font-display text-3xl">No items to checkout</div>
            <Link
              href="/catalog"
              className="h-11 px-6 inline-flex items-center bg-ink text-bone hover:bg-copper font-mono text-xs uppercase tracking-[0.2em]"
            >
              Browse parts
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="mt-10 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Step n="01" title="Shipping address" Icon={Truck}>
                <div className="grid md:grid-cols-2 gap-3">
                  <Input
                    label="Full name"
                    name="name"
                    required
                    placeholder="Amit Sharma"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    required
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Email"
                    name="email"
                    required
                    type="email"
                    placeholder="you@workshop.in"
                    className="md:col-span-2"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Street address"
                    name="street"
                    required
                    placeholder="Street 4, Model Town"
                    className="md:col-span-2"
                    value={formData.street}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="City"
                    name="city"
                    required
                    placeholder="Ludhiana"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="State"
                    name="state"
                    required
                    placeholder="Punjab"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Postal code"
                    name="zip"
                    required
                    placeholder="141002"
                    value={formData.zip}
                    onChange={handleInputChange}
                  />
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        label="GSTIN (optional)"
                        name="gstin"
                        placeholder="03AAACX0000X1Z2"
                        value={formData.gstin}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={verifyGstin}
                        className="h-10 px-3 rounded-md border border-border bg-background text-sm hover:border-copper"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              </Step>

              <Step n="02" title="Delivery" Icon={Truck}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Radio
                    name="shippingMethod"
                    checked={shippingMethod === "standard"}
                    onChange={() => setShippingMethod("standard")}
                    label="Standard · 48–72h"
                    sub="₹199 flat rate"
                  />
                  <Radio
                    name="shippingMethod"
                    checked={shippingMethod === "express"}
                    onChange={() => setShippingMethod("express")}
                    label="Express · 24h"
                    sub="₹499 flat rate"
                  />
                </div>
              </Step>

              <Step n="03" title="Payment" Icon={CreditCard}>
                <div className="space-y-2">
                  {["UPI", "Credit / debit card", "Net banking", "Cash on delivery"].map(
                    (method) => (
                      <Radio
                        key={method}
                        name="paymentMethod"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        label={method}
                        sub={
                          method === "UPI"
                            ? "Pay via any UPI app"
                            : method === "Cash on delivery"
                              ? "Available for orders under ₹10,000"
                              : "Pay securely via Gateway"
                        }
                      />
                    ),
                  )}
                </div>
                {paymentMethod === "UPI" && (
                  <div className="mt-4 grid gap-3">
                    <Input
                      label="UPI ID"
                      name="upiId"
                      placeholder="yourname@okhdfcbank"
                      value={paymentData.upiId}
                      onChange={handlePaymentInputChange}
                    />
                  </div>
                )}
                {paymentMethod === "Credit / debit card" && (
                  <div className="mt-4 grid gap-3">
                    <Input
                      label="Card number"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={handlePaymentInputChange}
                    />
                    <Input
                      label="Cardholder name"
                      name="cardName"
                      placeholder="Amit Sharma"
                      value={paymentData.cardName}
                      onChange={handlePaymentInputChange}
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        label="Expiry (MM/YY)"
                        name="cardExpiry"
                        placeholder="09/29"
                        value={paymentData.cardExpiry}
                        onChange={handlePaymentInputChange}
                      />
                      <Input
                        label="CVV"
                        name="cardCvv"
                        placeholder="123"
                        type="password"
                        value={paymentData.cardCvv}
                        onChange={handlePaymentInputChange}
                      />
                    </div>
                  </div>
                )}
                {paymentMethod === "Net banking" && (
                  <div className="mt-4">
                    <label className="block">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                        Select bank
                      </span>
                      <select
                        name="bankName"
                        value={paymentData.bankName}
                        onChange={handlePaymentInputChange}
                        className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                      >
                        <option value="">Choose your bank</option>
                        {BANK_OPTIONS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                {paymentMethod === "Cash on delivery" && (
                  <div className="mt-4 rounded-3xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                    Cash on delivery is available for orders under ₹10,000. Pay the courier when your order arrives.
                  </div>
                )}
              </Step>
            </div>

            <aside className="lg:col-span-4">
              <div className="hairline bg-card p-6 sticky top-28">
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-4">
                  Your order
                </div>
                <ul className="space-y-3 max-h-72 overflow-auto pr-1">
                  {cart.map(({ sku, qty, part }) => (
                    <li key={sku} className="flex gap-3 text-sm">
                      <img
                        src={
                          part.images?.[0] ||
                          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"
                        }
                        className="h-12 w-12 object-cover hairline shrink-0"
                        alt={part.name}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{part.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">× {qty}</div>
                      </div>
                      <div className="font-mono text-xs">{formatINR(part.price * qty)}</div>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
                  <Row k="Subtotal" v={formatINR(subtotal)} />
                  <Row k="GST (item-wise)" v={formatINR(displayItemTax)} />
                  {displayIgst > 0 ? (
                    <Row k="IGST" v={formatINR(displayIgst)} />
                  ) : (
                    <Row k="CGST + SGST" v={`${formatINR(displayCgst)} + ${formatINR(displaySgst)}`} />
                  )}
                  <Row k="Shipping" v={formatINR(displayShipping)} />
                  <Row k="GST on shipping (5%)" v={formatINR(displayShippingGst)} />
                  <div className="border-t border-border mt-3 pt-3 flex items-end justify-between">
                    <dt className="font-mono text-xs uppercase tracking-widest">Total</dt>
                    <dd className="font-display text-3xl">{formatINR(total)}</dd>
                  </div>
                </dl>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 w-full h-12 bg-ink text-bone hover:bg-copper font-mono text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" /> {isSubmitting ? "Placing order..." : "Place order"}
                </button>
                <p className="mt-3 text-[11px] text-muted-foreground text-center">
                  By placing this order you agree to our terms & refund policy.
                </p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </PageShell>
  );
}

function Step({ n, title, Icon, children }) {
  return (
    <section className="hairline bg-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-display text-3xl text-copper">{n}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-2xl tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className = "",
  value,
  onChange,
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {label} {required && <span className="text-copper">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
      />
    </label>
  );
}

function Radio({ name, checked, onChange, label, sub }) {
  return (
    <label className="hairline p-3 flex items-center gap-3 cursor-pointer hover:border-ink">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="accent-copper"
      />
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </label>
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
