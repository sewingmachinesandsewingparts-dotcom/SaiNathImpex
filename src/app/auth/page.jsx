"use client";

import api from "@/src/utils/api";
import { ensureTabSession } from "@/src/lib/tab-session";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { PageShell } from "@/src/components/site-shell";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

// Inner component that uses useSearchParams — must be wrapped in Suspense
function AuthInner() {
  const [mode, setMode] = useState("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationMessage("");

    if (!email || !password) {
      setValidationMessage("Email and password are required.");
      return;
    }

    if (mode === "in" && /@(gmail\.com|googlemail\.com)$/i.test(email.trim())) {
      const normalizedEmail = email.trim().toLowerCase();
      const redirectUrl = `/api/auth/google${normalizedEmail ? `?login_hint=${encodeURIComponent(normalizedEmail)}` : ""}`;
      window.location.assign(redirectUrl);
      return;
    }

    if (mode === "up") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        setValidationMessage("Please enter a valid email address.");
        return;
      }
      if (!name || name.trim().length < 2) {
        setValidationMessage("Name must be at least 2 characters long.");
        return;
      }
      if (password.length < 8) {
        setValidationMessage("Password must be at least 8 characters long.");
        return;
      }
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setValidationMessage("Password must include at least one uppercase letter and one number.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const tabSession = ensureTabSession();
      const response = await api.post(
        "/api/auth",
        { mode, name, email, password, tabId: tabSession.tabId },
        { headers: { "Content-Type": "application/json" } },
      );

      setIsSubmitting(false);
      const role = response?.data?.user?.role;
      router.push(["admin", "superadmin"].includes(role) ? "/admin" : "/profile");
    } catch (error) {
      setIsSubmitting(false);
      const message = error?.response?.data?.message || error.message || "Unable to authenticate.";
      toast.error(message);
    }
  };

  return (
    <PageShell>
      <div className="grid md:grid-cols-2 min-h-[calc(100vh-200px)]">
        <div className="bg-ink text-bone blueprint-grid p-10 md:p-16 flex flex-col justify-between">
          <Link href="/" className="font-display text-3xl">
            Sewing Parts
          </Link>
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-4">
              Trade account
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[0.85]">
              The workshop's
              <br />
              supply room.
            </h2>
            <p className="mt-4 text-bone/70 max-w-sm">
              Track orders, reorder fast, manage GST invoices and get bulk pricing on 50+ unit
              orders.
            </p>
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-bone/40">
            Trusted by 4,200+ workshops across India
          </div>
        </div>

        <div className="p-10 md:p-16 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-2">
              {mode === "in" ? "Welcome back" : "Create account"}
            </div>
            <h1 className="font-display text-5xl">{mode === "in" ? "Sign in" : "Sign up"}</h1>

            <button
              onClick={() => {
                const loginHint = email.trim();
                window.location.href = `/api/auth/google${loginHint ? `?login_hint=${encodeURIComponent(loginHint)}` : ""}`;
              }}
              className="mt-8 w-full h-12 hairline hover:bg-secondary flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-widest">or email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "up" && (
                <Field
                  label="Full name"
                  name="name"
                  placeholder="Amit Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <Field
                label="Email"
                name="email"
                placeholder="you@workshop.in"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Field
                label="Password"
                name="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {validationMessage ? (
                <p className="text-sm text-red-600">{validationMessage}</p>
              ) : null}
              {mode === "in" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => toast.success("Password reset link sent")}
                    className="font-mono text-[11px] uppercase tracking-widest hover:text-copper cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-ink text-bone hover:bg-copper transition-colors font-mono text-xs uppercase tracking-[0.2em] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : mode === "in" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-sm text-center text-muted-foreground">
              {mode === "in" ? "New here?" : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "in" ? "up" : "in")}
                className="text-copper underline-offset-4 hover:underline cursor-pointer"
              >
                {mode === "in" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// Default export wraps AuthInner in Suspense to satisfy Next.js static prerender requirements
export default function Auth() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}

function Field({ label, name, placeholder, type = "text", value, onChange }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="mt-1 w-full hairline bg-background px-3 py-3 text-sm outline-none focus:border-copper"
      />
    </label>
  );
}
