"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/src/lib/cart-context";

/**
 * Formats a numeric value into Indian Rupee (INR) currency format.
 * 
 * @param {number} n - The amount to format.
 * @returns {string} Formatted currency string.
 */
export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Renders a preview card of a compatible machine part.
 * Includes interactive wishlist toggle and cart action buttons.
 * 
 * @param {object} props
 * @param {object} props.part - The part document object.
 * @param {number} [props.span=1] - Grid span layout.
 * @param {("default"|"dark")} [props.variant="default"] - Card color theme style.
 */
export function PartCard({ part, span = 1, variant = "default" }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const onSale = part.compareAt && part.compareAt > part.price;
  const wishlisted = isInWishlist(part.sku);
  const isDark = variant === "dark";

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(part.sku);
  };

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(part.sku, 1);
  };

  return (
    <Link
      href={`/part/${part.sku}`}
      className={`group relative flex flex-col hairline ${isDark ? "bg-ink text-bone hover:border-copper" : "bg-card hover:border-ink"} transition-colors ${
        span === 2 ? "md:col-span-2" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${isDark ? "bg-background" : "bg-secondary"} ${span === 2 ? "aspect-2/1" : "aspect-square"}`}
      >
        <img
          src={
            part.images?.[0] ||
            "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"
          }
          alt={part.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {onSale && (
          <div className="absolute top-3 left-3 bg-copper text-copper-foreground font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-1 shadow-sm">
            Sale
          </div>
        )}
        {part.hasMotor && (
          <div className="absolute top-3 right-3 bg-ink text-bone font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-1 shadow-sm">
            18% GST
          </div>
        )}
        <button
          aria-label="Add to wishlist"
          onClick={handleWishlistClick}
          className={`absolute bottom-3 right-3 h-9 w-9 grid place-items-center transition-colors border border-border ${
            wishlisted
              ? "bg-copper text-copper-foreground"
              : "bg-bone text-ink hover:bg-copper hover:text-copper-foreground"
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${isDark ? "text-bone/70" : "text-muted-foreground"}`}>
            {part.brandName} · {part.modelName}
          </span>
          <span className={`font-mono text-[10px] ${isDark ? "text-bone/70" : "text-muted-foreground"}`}>{part.id1}</span>
        </div>
        <h3 className={`font-display text-xl tracking-wide leading-none ${isDark ? "text-bone" : "text-foreground"}`}>{part.name}</h3>
        <p className={`text-xs ${isDark ? "text-bone/70" : "text-muted-foreground"} line-clamp-2`}>{part.description}</p>
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div>
            <div className={`font-display text-2xl ${isDark ? "text-bone" : ""}`}>{formatINR(part.price)}</div>
            {onSale && (
              <div className={`font-mono text-[11px] line-through ${isDark ? "text-bone/70" : "text-muted-foreground"}`}>
                {formatINR(part.compareAt)}
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCartClick}
            className="h-9 px-3 inline-flex items-center gap-1.5 bg-ink text-bone hover:bg-copper transition-colors font-mono text-[11px] tracking-[0.15em] uppercase cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </Link>
  );
}
