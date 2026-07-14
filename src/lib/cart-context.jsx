"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch parts catalog on mount to resolve sku details in cart
  useEffect(() => {
    axios("/api/parts")
      .then((res) => res.data)
      .then((data) => {
        setParts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch parts in cart context:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const defaultCart = [
      { sku: "SKU-JUKI-HX48300", qty: 1 },
      { sku: "SKU-SIRUBA-KD14", qty: 2 },
      { sku: "SKU-OTHERS-EG01", qty: 4 },
    ];
    setCart(defaultCart);

    const defaultWishlist = ["SKU-JUKI-MO6716-KNF", "SKU-OTHERS-MOT550", "SKU-BROTHER-S7200-FT"];
    setWishlist(defaultWishlist);
  }, []);

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

  const cartCount = cart.length;
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
