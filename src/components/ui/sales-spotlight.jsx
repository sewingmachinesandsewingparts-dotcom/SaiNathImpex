import React from 'react';

// Static promotional data (as provided by the user)
const promotions = [
  {
    id: 1,
    title: 'Brandsummer3',
    discount: '10% off',
    description: 'Applies to Kingtex brand. Ends 12 Dec 1212.',
    link: '/catalog?brand=kingtex',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 2,
    title: 'Juki Summer',
    discount: '10% off',
    description: 'Limited time offer. Ends 4 May 2027.',
    link: '/catalog?brand=juki',
    image: 'https://images.unsplash.com/photo-1602524813545-5f5c3d6f2c9e?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 3,
    title: 'Pegasus',
    discount: 'Limited time',
    description: 'Summer2 special.',
    link: '/catalog?brand=pegasus',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 4,
    title: 'Jbiunhd',
    discount: 'Limited time',
    description: 'Pegasus – Summer3',
    link: '/catalog?brand=pegasus',
    image: 'https://images.unsplash.com/photo-1526318472351-bc0b3b0a6c79?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 5,
    title: 'Kingtex',
    discount: '10% Brand',
    description: 'Hgcut – Limited time',
    link: '/catalog?brand=kingtex',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=60',
  },
];

export default function SalesSpotlight() {
  return (
    <section className="max-w-7xl mx-auto p-4 grid gap-6 md:grid-cols-2">
      {promotions.map((promo) => (
        <a
          key={promo.id}
          href={promo.link}
          className="group relative flex flex-col-reverse md:flex-row items-center bg-white/10 dark:bg-ink/10 backdrop-blur-xl rounded-xl border border-white/20 dark:border-ink/30 hover:border-copper transition-colors overflow-hidden shadow-lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* Text section (left on larger screens) */}
          <div className="p-6 flex-1">
            <h3 className="font-display text-2xl text-bone dark:text-bone/90 mb-2 transition-transform group-hover:translate-x-1">
              {promo.title}
            </h3>
            <p className="text-sm text-bone/80 dark:text-bone/70 mb-1">{promo.discount}</p>
            <p className="text-xs text-bone/60 dark:text-bone/50 line-clamp-2 mb-3">
              {promo.description}
            </p>
            <span className="inline-block text-xs font-mono text-copper underline underline-offset-2 transition-opacity group-hover:opacity-80">
              Browse deals →
            </span>
          </div>
          {/* Image on the right */}
          <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden">
            <img
              src={promo.image}
              alt={promo.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </a>
      ))}
    </section>
  );
}
