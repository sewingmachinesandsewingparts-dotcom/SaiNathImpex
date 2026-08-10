export async function GET() {
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
  return new Response(JSON.stringify(promotions), {
    headers: { 'Content-Type': 'application/json' },
  });
}
