// Demo and Sample Review Data for Blush Boutique Preview
// NOTE: These are curated preview/sample reviews for pitch and presentation purposes.
// They are kept isolated from real customer database records for future API integration.

export const SAMPLE_REVIEWS = [
  {
    id: 'demo-rev-1',
    productId: 1, // Red Satin Midi Dress
    author: 'Aanya S.',
    location: 'Pune',
    rating: 5,
    title: 'Impeccable silhouette and luxurious drape',
    comment: 'The satin has a rich, weighted fluidity that hangs effortlessly. Wore this to an evening gala in Koregaon Park and received constant compliments.',
    date: '2 weeks ago'
  },
  {
    id: 'demo-rev-2',
    productId: 1,
    author: 'Rhea M.',
    location: 'Mumbai',
    rating: 5,
    title: 'Stunning crimson shade',
    comment: 'The color is a true editorial red. The asymmetrical slit is tasteful and flattering. Size Small fit true to measurement.',
    date: '3 weeks ago'
  },
  {
    id: 'demo-rev-3',
    productId: 1,
    author: 'Tanvi K.',
    location: 'Pune',
    rating: 4,
    title: 'Elegant cut, premium finish',
    comment: 'Very delicate shoulder straps and neat lining. Needed a slight steam out of the garment bag, but the fabric looks breathtaking.',
    date: '1 month ago'
  },
  {
    id: 'demo-rev-4',
    productId: 2, // Pink and White Floral
    author: 'Meera P.',
    location: 'Pune',
    rating: 5,
    title: 'Dreamy puff sleeves and airy fabric',
    comment: 'The organza chiffon feels feather-light. Perfect for brunch or daytime celebrations. The sweetheart neckline is sculpted beautifully.',
    date: '1 week ago'
  },
  {
    id: 'demo-rev-5',
    productId: 2,
    author: 'Sneha D.',
    location: 'Delhi',
    rating: 5,
    title: 'Chic botanical print',
    comment: 'So flattering! The lining is soft cotton voile, so it is breathable even in warm weather. Highly recommend.',
    date: '3 weeks ago'
  },
  {
    id: 'demo-rev-6',
    productId: 3, // Black Fitted Bodycon
    author: 'Pooja G.',
    location: 'Pune',
    rating: 5,
    title: 'The ultimate minimalist statement dress',
    comment: 'Heavyweight sculpt ponte knit that holds its shape all evening. Clean architectural square neckline. An absolute wardrobe staple.',
    date: '2 weeks ago'
  },
  {
    id: 'demo-rev-7',
    productId: 3,
    author: 'Ananya V.',
    location: 'Bengaluru',
    rating: 4,
    title: 'Flattering contoured fit',
    comment: 'Thick, premium fabric that smooths without feeling restrictive. Ideal length for formal dinners.',
    date: '1 month ago'
  }
];

// Fallback sample reviews for any boutique piece without specific seed entries
const GENERIC_BOUTIQUE_SAMPLE_REVIEWS = [
  {
    id: 'generic-demo-1',
    author: 'Ishita R.',
    location: 'Pune',
    rating: 5,
    title: 'Boutique craftsmanship shows in every seam',
    comment: 'The garment cut is thoughtfully tailored with fine stitching and lining. Truly feels like a bespoke boutique creation.',
    date: '2 weeks ago'
  },
  {
    id: 'generic-demo-2',
    author: 'Kavya T.',
    location: 'Mumbai',
    rating: 5,
    title: 'Flattering fit and premium textile',
    comment: 'Accurate sizing according to the size guide. The fabric handfeel is elevated and comfortable throughout wear.',
    date: '3 weeks ago'
  },
  {
    id: 'generic-demo-3',
    author: 'Divya N.',
    location: 'Hyderabad',
    rating: 4,
    title: 'Refined modern aesthetic',
    comment: 'Clean lines and elegant silhouette. Prompt dispatch from the Pune studio.',
    date: '1 month ago'
  }
];

/**
 * Returns demo reviews for a given product with calculated summary statistics.
 */
export function getProductDemoReviews(productId) {
  const specific = SAMPLE_REVIEWS.filter(r => r.productId === Number(productId));
  const reviews = specific.length > 0 ? specific : GENERIC_BOUTIQUE_SAMPLE_REVIEWS;

  const totalReviews = reviews.length;
  const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = totalReviews > 0 ? (ratingSum / totalReviews).toFixed(1) : '5.0';

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (breakdown[r.rating] !== undefined) {
      breakdown[r.rating]++;
    }
  });

  return {
    isDemoData: true,
    disclaimer: 'Curated boutique preview feedback (Sample/Demo presentation data)',
    averageRating: parseFloat(averageRating),
    totalReviews,
    breakdown,
    reviews
  };
}

