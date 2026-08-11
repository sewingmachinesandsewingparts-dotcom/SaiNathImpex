import React, { useEffect, useState } from 'react';

/**
 * HorizontalSalesSpotlight
 *
 * Full‑width carousel showing one promotion at a time.
 * Layout: description on the left, image on the right.
 * Data is fetched from `/api/promotions` and auto‑rotates every 6 seconds.
 */
export default function HorizontalSalesSpotlight() {
  const [promotions, setPromotions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Load promotions once on mount
  useEffect(() => {
    fetch('/api/promotions')
      .then((res) => res.json())
      .then(setPromotions)
      .catch((err) => console.error('Failed to load promotions', err));
  }, []);

  // Auto‑rotate carousel every 6 seconds
  useEffect(() => {
    if (!promotions.length) return;
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % promotions.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promotions]);

  if (!promotions.length) return null;

  const promo = promotions[activeIdx];

  return (
    <section className="max-w-7xl mx-auto p-4">
      <h2 className="font-display text-2xl mb-4 text-bone dark:text-bone/90">Latest Deals &amp; Offers</h2>
      <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-xl border border-white/20 dark:border-ink/30 bg-white/10 dark:bg-ink/10 backdrop-blur-xl transition-shadow hover:shadow-lg hover:border-copper">
        {/* Text side */}
        <div className="flex flex-col p-6 flex-1 justify-center space-y-3">
          <h3 className="font-display text-xl text-bone dark:text-bone/90">{promo.title}</h3>
          <p className="text-sm text-bone/80 dark:text-bone/70">{promo.discount}</p>
          <p className="text-xs text-bone/60 dark:text-bone/50 line-clamp-2">{promo.description}</p>
          <a href={promo.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-mono text-copper underline underline-offset-2 transition-opacity hover:opacity-80">
            Browse deals →
          </a>
        </div>
        {/* Image side */}
        <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
          <img src={promo.image} alt={promo.title} className="object-cover w-full h-full transition-transform duration-500 hover:scale-105" />
        </div>
      </div>
    </section>
  );
}
