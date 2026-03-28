"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/providers/CartProvider";
import { formatPrice } from "@/lib/products";
import { CartDrawer } from "./CartDrawer";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

// =============================================================================
// Meridian Storefront — Navigation Bar
// =============================================================================

export function Navbar() {
  const { totalItems, totalPrice } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user)).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary text-white font-black text-sm">
                M
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground tracking-tight leading-none">
                  Meridian
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                  Storefront
                </p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#catalog"
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                Catalog
              </a>
              {/* <Link
                href="/architecture"
                className="text-sm font-medium text-muted hover:text-primary"
              >
                Architecture
              </Link> */}
              {user ? (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted hover:text-primary"
                >
                  Admin Dashboard
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="text-sm font-medium text-muted hover:text-primary"
                >
                  Admin Login
                </Link>
              )}
            </nav>

            {/* Right side: Auth + Cart */}
            <div className="flex items-center gap-3">
              {/* Auth button */}
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                             text-muted-foreground hover:text-foreground hover:bg-badge-bg
                             transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Logout
                </button>
              ) : (
                <Link
                  href="/admin/login"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                             text-muted-foreground hover:text-foreground hover:bg-badge-bg
                             transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Login
                </Link>
              )}

              {/* Cart button */}
              <button
                id="cart-button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-badge-bg hover:bg-card-border text-sm font-medium text-foreground
                           focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
                           transition-colors cursor-pointer"
              >
                <svg
                  className="w-4.5 h-4.5 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                <span>{totalItems}</span>

                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                    {totalItems}
                  </span>
                )}
              </button>

              {totalPrice > 0 && (
                <span className="text-sm font-semibold text-foreground hidden sm:block">
                  {formatPrice(totalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
