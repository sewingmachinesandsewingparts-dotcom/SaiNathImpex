/**
 * use-auth.js
 * -----------
 * Shared hook for getting the currently logged-in user.
 *
 * WHY THIS EXISTS:
 * Previously, both SiteHeader and SiteFooter each made their own
 * /api/auth fetch independently — that's 2 API calls per page load
 * for the same data. This hook caches the result in module memory
 * so the fetch happens only ONCE per page load no matter how many
 * components call useAuth().
 *
 * USAGE:
 *   const { user, loading } = useAuth();
 */

"use client";

import { useState, useEffect } from "react";
import api from "@/src/utils/api";

// Module-level cache — shared across all components on the same page.
// Resets on full page reload (which is correct behaviour).
let cachedUser = undefined; // undefined = not fetched yet, null = fetched, no user
let fetchPromise = null;    // prevents duplicate in-flight requests

/**
 * Fetches the logged-in user from the session cookie.
 * Results are cached at the module level so the API is only called once.
 *
 * @returns {{ user: object|null, loading: boolean }}
 */
export function useAuth() {
  // Start with the cached value if we already have it
  const [user, setUser] = useState(cachedUser !== undefined ? cachedUser : null);
  const [loading, setLoading] = useState(cachedUser === undefined);

  useEffect(() => {
    // Already have a cached result — use it immediately, no network call needed
    if (cachedUser !== undefined) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    // Only start one fetch even if multiple components call useAuth() at the same time
    if (!fetchPromise) {
      fetchPromise = api.get("/api/auth")
        .then((res) => res.data)
        .then((data) => {
          cachedUser = data.user || null; // cache the result
          return cachedUser;
        })
        .catch(() => {
          cachedUser = null; // treat errors as "not logged in"
          return null;
        });
    }

    // All callers wait on the same promise
    fetchPromise.then((resolvedUser) => {
      setUser(resolvedUser);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
