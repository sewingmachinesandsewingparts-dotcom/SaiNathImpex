"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';

const CartContext = createContext(null);

/**
 * CartProvider Context Wrapper
 * 
 * Performance Optimizations:
 * 1. Removed full-catalog API fetch on mount.
 * 2. Details of parts are now fetched dynamically and cached in state.
 * 3. Empty initial states for cart and wishlist (cleared demo data).
 */
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  // Local parts cache containing details for cart & wishlist items
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dynamic on-demand parts fetcher
  useEffect(() => {
    // Find all unique SKUs currently needed (in cart or wishlist) that aren't already cached
    const neededSkus = [
      ...new Set([
        ...cart.map((item) => item.sku),
        ...wishlist,
      ]),
    ].filter((sku) => !parts.some((p) => p.sku === sku));

    // If we already have details for all items, we can stop loading
    if (neededSkus.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch only the specific SKUs we need
    axios(`/api/parts?skus=${neededSkus.join(",")}`)
      .then((res) => {
        setParts((prev) => {
          // Merge newly fetched parts with already cached ones
          const newParts = res.data.filter((np) => !prev.some((p) => p.sku === np.sku));
          return [...prev, ...newParts];
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch needed parts in cart context:", err);
        setLoading(false);
      });
  }, [cart, wishlist]); // Runs only when cart or wishlist changes

  // Cart operations
  const saveCart = (newCart) => {
    setCart(newCart);
  };

  const saveWishlist = (newWishlist) => {
    setWishlist(newWishlist);
  };

  const addToCart = (sku, qty = 1) => {
    const existing = cart.find((item) => item.sku === sku);
    if (existing) {
      saveCart(cart.map((item) => (item.sku === sku ? { ...item, qty: item.qty + qty } : item)));
    } else {
      saveCart([...cart, { sku, qty }]);
    }
  };

  const removeFromCart = (sku) => {
    saveCart(cart.filter((item) => item.sku !== sku));
  };

  const updateQty = (sku, qty) => {
    if (qty <= 1) {
      saveCart(cart.map((item) => (item.sku === sku ? { ...item, qty: 1 } : item)));
      return;
    }

    saveCart(cart.map((item) => (item.sku === sku ? { ...item, qty } : item)));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const toggleWishlist = (sku) => {
    if (wishlist.includes(sku)) {
      saveWishlist(wishlist.filter((s) => s !== sku));
    } else {
      saveWishlist([...wishlist, sku]);
    }
  };

  const isInWishlist = (sku) => wishlist.includes(sku);

  // Resolve parts details for items in cart
  const cartItems = cart
    .map((item) => {
      const part = parts.find((p) => p.sku === item.sku);
      return part ? { ...item, part } : null;
    })
    .filter(Boolean);

  const cartCount = cart.reduce((acc, curr) => acc + curr.qty, 0); // Calculate total quantity, not unique skus
  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider
      value={{
        cart: cartItems,
        rawCart: cart,
        wishlist,
        parts,
        loading,
        cartCount,
        wishlistCount,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
