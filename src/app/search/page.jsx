"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import { Search } from "lucide-react";
import axios from 'axios';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const nameOnly = searchParams.get("nameOnly") === "true";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nameOnly) params.set("nameOnly", "true");

    axios(`/api/parts?${params.toString()}`)
      .then((res) => res.data)
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error searching parts:", err);
        setLoading(false);
      });
  }, [q]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = e.target.q.value;
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <div className="bg-secondary/50 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center hairline bg-card max-w-3xl"
          >
            <Search className="h-5 w-5 ml-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              className="flex-1 bg-transparent px-4 py-4 text-lg outline-none"
              placeholder="Part #, model, brand, diagram # or compatibility…"
            />
            <button
              type="submit"
              className="h-full px-6 py-4 bg-ink text-bone font-mono text-[11px] tracking-[0.2em] uppercase cursor-pointer hover:bg-copper transition-colors"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {loading ? "Searching..." : `${results.length} results`}
              {q && (
                <>
                  {" "}
                  for <strong className="text-foreground">"{q}"</strong>
                </>
              )}
            </span>
            <span>·</span>
            <span className="font-mono text-xs hidden md:inline">
              Searching: name, SKU, part #, model, brand, diagram #, alt part #, compatibility
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {loading ? (
          <div className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-20 bg-card hairline">
            Searching parts catalog...
          </div>
        ) : results.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((p) => (
              <PartCard key={p.sku} part={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card hairline">
            <div className="font-display text-4xl">No matches</div>
            <p className="text-muted-foreground mt-2">Try a different SKU or brand name.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Initializing search engine...
          </div>
        }
      >
        <SearchResultsContent />
      </Suspense>
    </PageShell>
  );
}
