const { query, initDatabase, pool } = require('./db');

const initialProducts = [
  {
    name: "Red Satin Midi Dress",
    slug: "red-satin-midi-dress",
    category: "Dresses",
    price: 3490,
    compare_at_price: 4290,
    description: "An editorial silhouette draped in rich crimson satin with a sweeping asymmetrical slit and delicate shoulder straps. Designed for evening affairs and sun-drenched European terraces.",
    fabric: "100% Poly-Satin with Chiffon Draped Overlay",
    care: "Dry clean only. Cool iron on reverse.",
    images: JSON.stringify(["/images/Golden-Hour Mediterranean Terrace Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Crimson Red"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 12
  },
  {
    name: "Pink and White Floral Puff-Sleeve Mini Dress",
    slug: "pink-floral-mini-dress",
    category: "Dresses",
    price: 2890,
    compare_at_price: 3490,
    description: "Delicate pink botanical florals printed on airy organza chiffon. Features sculpted sweetheart neckline, romantic puff sleeves, and a tiered flared hemline.",
    fabric: "Chiffon Silk Blend with Soft Cotton Voile Lining",
    care: "Hand wash cold or gentle machine cycle. Line dry.",
    images: JSON.stringify([
      "/images/Airy Floral Dress Portrait.webp",
      "/images/Romantic Mediterranean Summer Twirl.webp",
      "/images/Elegant Floral Dress Portrait.webp"
    ]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Blush Floral"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 15
  },
  {
    name: "Black Fitted Bodycon Midi Dress",
    slug: "black-fitted-bodycon-midi-dress",
    category: "Dresses",
    price: 2990,
    compare_at_price: 3690,
    description: "A timeless minimalist statement. Contoured bodycon silhouette featuring an architectural square neckline, premium sculpting ponte knit, and a modest back vent.",
    fabric: "Heavyweight Sculpt Ponte Fabric (68% Rayon, 28% Nylon, 4% Spandex)",
    care: "Machine wash cold inside out. Lay flat to dry.",
    images: JSON.stringify(["/images/Elegant Black Dress in a Sunlit Interior.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
    colors: JSON.stringify(["Classic Black"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 18
  },
  {
    name: "Cream A-Line Dress",
    slug: "cream-aline-dress",
    category: "Dresses",
    price: 3290,
    compare_at_price: 3990,
    description: "Effortlessly elegant champagne ivory A-line day dress with subtle pleating, structured bodice, and functional side seam pockets.",
    fabric: "100% Textured Cotton Poplin",
    care: "Machine wash delicate. Hang dry in shade.",
    images: JSON.stringify(["/images/Graceful Cream Dress Portrait.webp"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Champagne Cream"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 10
  },
  {
    name: "Burgundy Draped Evening Dress",
    slug: "burgundy-draped-evening-dress",
    category: "Dresses",
    price: 4490,
    compare_at_price: 5490,
    description: "Sensual high-slit formal gown crafted in deep merlot liquid jersey with an artfully twisted Grecian neckline and floor-sweeping drape.",
    fabric: "Luxe Stretch Velvet & Micro-Modal Jersey",
    care: "Professional dry clean recommended.",
    images: JSON.stringify(["/images/Elegance in Red Evening Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Deep Burgundy"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 8
  },
  {
    name: "Golden Silk Halter Maxi Dress",
    slug: "golden-silk-halter-maxi-dress",
    category: "Dresses",
    price: 4990,
    compare_at_price: 5990,
    description: "Luminous antique gold mulberry silk with an open back, cascading bias-cut skirt, and hand-finished micro-hem. An iconic reception centerpiece.",
    fabric: "Pure Mulberry Silk Satin (19 Momme)",
    care: "Specialist dry clean only.",
    images: JSON.stringify(["/images/Golden-Hour Mediterranean Terrace Portrait.webp"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Antique Gold"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 6
  },
  {
    name: "White Embroidered Puff-Sleeve Top",
    slug: "white-embroidered-puff-sleeve-top",
    category: "Tops",
    price: 1890,
    compare_at_price: 2290,
    description: "Crisp optic white cotton voile adorned with tone-on-tone broderie anglaise florals, scalloped square neckline, and romantic statement sleeves.",
    fabric: "100% Certified Organic Cotton Batiste",
    care: "Hand wash cold. Warm iron while slightly damp.",
    images: JSON.stringify(["/images/Romantic Mediterranean Summer Twirl.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Optic White"]),
    is_featured: 0,
    is_new_arrival: 1,
    stock: 20
  },
  {
    name: "Rose Pink Silk Camisole",
    slug: "rose-pink-silk-camisole",
    category: "Tops",
    price: 1690,
    compare_at_price: 2090,
    description: "Sensual bias-cut camisole framed with French eyelash lace across the V-neckline. Features adjustable double spaghetti straps and curved French seams.",
    fabric: "Stretch Silk Georgette (92% Silk, 8% Elastane)",
    care: "Hand wash cold with silk detergent.",
    images: JSON.stringify(["/images/Airy Floral Dress Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Dusty Rose"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 14
  },
  {
    name: "Black Sheer Lace Blouse",
    slug: "black-sheer-lace-blouse",
    category: "Tops",
    price: 2190,
    compare_at_price: 2690,
    description: "Dramatic gothic-romance sheer chantilly lace top with Victoriana high collar, mother-of-pearl back buttons, and scalloped bishop cuffs.",
    fabric: "Corded French Chantilly Lace",
    care: "Gentle hand wash inside mesh pouch.",
    images: JSON.stringify(["/images/Graceful Cream Dress Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M"]),
    colors: JSON.stringify(["Noir Black"]),
    is_featured: 0,
    is_new_arrival: 1,
    stock: 11
  },
  {
    name: "Lavender Smocked Peplum Top",
    slug: "lavender-smocked-peplum-top",
    category: "Tops",
    price: 1790,
    compare_at_price: 2190,
    description: "Feminine pastel lilac crop blouse featuring artisan hand-smocked bodice, flutter cap sleeves, and a tiered ruffled peplum silhouette.",
    fabric: "100% Linen Cotton Blend",
    care: "Machine wash cold. Warm steam iron.",
    images: JSON.stringify(["/images/Airy Floral Dress Portrait.webp"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Pastel Lilac"]),
    is_featured: 0,
    is_new_arrival: 0,
    stock: 16
  },
  {
    name: "Satin Wrap Blouse in Emerald",
    slug: "satin-wrap-blouse-emerald",
    category: "Tops",
    price: 2290,
    compare_at_price: 2790,
    description: "Rich jewel-toned forest emerald silk-touch satin wrap blouse with an adjustable side sash tie, shawl collar, and structured elongated cuffs.",
    fabric: "Luxe Crepe-Back Satin",
    care: "Dry clean or gentle hand wash.",
    images: JSON.stringify(["/images/Elegance in Red Evening Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
    colors: JSON.stringify(["Emerald Green"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 12
  },
  {
    name: "Baby Pink Linen Co-ord Set",
    slug: "baby-pink-linen-coord-set",
    category: "Co-ord Sets",
    price: 3790,
    compare_at_price: 4590,
    description: "Two-piece resort ensemble featuring an oversized notch-lapel short sleeve shirt paired with high-waisted relaxed trousers with a drawstring waist.",
    fabric: "100% Washed European Flax Linen",
    care: "Machine wash cold delicate. Hang to air dry.",
    images: JSON.stringify([
      "/images/Romantic Mediterranean Summer Twirl.webp",
      "/images/Airy Floral Dress Portrait.webp"
    ]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Blush Powder Pink"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 9
  },
  {
    name: "Emerald Green Satin Crop Top & Wide-Leg Trouser Set",
    slug: "emerald-satin-coord-set",
    category: "Co-ord Sets",
    price: 4290,
    compare_at_price: 5190,
    description: "High-impact evening two-piece. Structured corset-inspired boned crop top paired with ultra-wide pleated trousers that sweep the floor with fluid grace.",
    fabric: "Heavy Dutchess Satin with Viscose Lining",
    care: "Specialist dry clean only.",
    images: JSON.stringify(["/images/Elegance in Red Evening Portrait.webp"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Deep Emerald"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 7
  },
  {
    name: "Oatmeal Ribbed Knit Lounge Co-ord",
    slug: "oatmeal-ribbed-knit-lounge-coord",
    category: "Co-ord Sets",
    price: 3490,
    compare_at_price: 4190,
    description: "Ultra-plush cashmere-infused ribbed knit duo including an asymmetrical batwing pullover sweater and straight-leg floor-length knit trousers.",
    fabric: "50% Viscose, 30% Merino Wool, 20% Recycled Poly",
    care: "Hand wash cold. Dry flat, do not wring.",
    images: JSON.stringify(["/images/Graceful Cream Dress Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Heather Oatmeal"]),
    is_featured: 0,
    is_new_arrival: 1,
    stock: 13
  },
  {
    name: "Floral Print Wrap Top & Maxi Skirt Co-ord",
    slug: "floral-wrap-top-maxi-skirt-coord",
    category: "Co-ord Sets",
    price: 3990,
    compare_at_price: 4890,
    description: "Romantic garden party ensemble comprising a cropped puff-sleeve tie-front wrap top and a high-rise tiered A-line maxi skirt with side slit.",
    fabric: "Pure Rayon Crepe de Chine",
    care: "Hand wash cold. Line dry in shade.",
    images: JSON.stringify(["/images/Airy Floral Dress Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["English Rose Print"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 8
  },
  {
    name: "Champagne Pleated Satin Midi Skirt",
    slug: "champagne-pleated-satin-midi-skirt",
    category: "Skirts",
    price: 2490,
    compare_at_price: 2990,
    description: "Fluid permanent sunburst accordion pleats catch the light in shimmering metallic champagne. Features a comfortable concealed elastic waistband.",
    fabric: "High-Lustre Microfiber Satin",
    care: "Do not iron pleats. Hand wash cold or steam lightly.",
    images: JSON.stringify(["/images/Golden-Hour Mediterranean Terrace Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
    colors: JSON.stringify(["Champagne Gold"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 17
  },
  {
    name: "High-Waisted Black Tiered Ruffle Skirt",
    slug: "black-tiered-ruffle-skirt",
    category: "Skirts",
    price: 2290,
    compare_at_price: 2790,
    description: "Voluminous triple-tier flounced skirt with structured yoke waistband, side zip closure, and flirty asymmetrical high-low hem.",
    fabric: "Heavyweight Cotton Sateen",
    care: "Machine wash cold. Tumble dry low.",
    images: JSON.stringify(["/images/Elegant Black Dress in a Sunlit Interior.webp"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Jet Black"]),
    is_featured: 0,
    is_new_arrival: 1,
    stock: 14
  },
  {
    name: "Floral Chiffon Asymmetrical Maxi Skirt",
    slug: "floral-chiffon-maxi-skirt",
    category: "Skirts",
    price: 2690,
    compare_at_price: 3290,
    description: "Breezy watercolor pastels float across featherlight chiffon with an undulating handkerchief hemline and whisper-soft full jersey lining.",
    fabric: "Fine Crinkle Chiffon with Viscose Lining",
    care: "Gentle cold hand wash.",
    images: JSON.stringify(["/images/Romantic Mediterranean Summer Twirl.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Pastel Watercolor"]),
    is_featured: 0,
    is_new_arrival: 0,
    stock: 11
  },
  {
    name: "Gold Sequin Bodycon Mini Dress",
    slug: "gold-sequin-bodycon-mini-dress",
    category: "Partywear",
    price: 3890,
    compare_at_price: 4690,
    description: "Dazzling 3mm micro-sequins densely embroidered over stretch mesh. Features a deep scoop cowl back, boat neckline, and soft anti-scratch lining.",
    fabric: "Micro-Sequin on Stretch Mesh with Soft Poly-Knit Lining",
    care: "Specialist spot clean or professional dry clean.",
    images: JSON.stringify(["/images/Golden-Hour Mediterranean Terrace Portrait.webp"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Starlight Gold"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 10
  },
  {
    name: "Midnight Blue Velvet Slit Gown",
    slug: "midnight-blue-velvet-slit-gown",
    category: "Partywear",
    price: 4690,
    compare_at_price: 5690,
    description: "Sumptuous nocturnal royal sapphire velvet gown with an off-the-shoulder sweetheart neckline, thigh-high slit, and hourglass corseted back.",
    fabric: "Rich Silk-Blend Stretch Velvet",
    care: "Dry clean only. Steam from interior.",
    images: JSON.stringify(["/images/Elegance in Red Evening Portrait.webp"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Midnight Sapphire"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 5
  }
];

async function seed() {
  await initDatabase();
  console.log('Verifying initial products and settings in Supabase...');

  const countRes = await query('SELECT COUNT(*)::int as count FROM products');
  if (countRes.rows[0].count === 0) {
    for (const prod of initialProducts) {
      await query(`
        INSERT INTO products (
          name, slug, category, price, compare_at_price, description, fabric, care, images, sizes, colors, is_featured, is_new_arrival, stock
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        prod.name,
        prod.slug,
        prod.category,
        prod.price,
        prod.compare_at_price,
        prod.description,
        prod.fabric,
        prod.care,
        prod.images,
        prod.sizes,
        prod.colors,
        prod.is_featured,
        prod.is_new_arrival,
        prod.stock
      ]);
    }
    console.log(`Successfully seeded ${initialProducts.length} distinct products!`);
  } else {
    console.log(`Database already has ${countRes.rows[0].count} products. Skipping product insertion.`);
  }

  // Seed default store settings using PostgreSQL ON CONFLICT
  const settings = [
    ['store_name', 'Blush'],
    ['brand_location', 'Pune, Maharashtra, India'],
    ['contact_phone', '9503917333'],
    ['instagram_handle', '@blushpune'],
    ['established_year', '2014'],
    ['free_shipping_threshold', '2499'],
    ['standard_shipping_fee', '150'],
    ['razorpay_enabled', '1']
  ];

  for (const [k, v] of settings) {
    await query(`
      INSERT INTO store_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [k, v]);
  }

  console.log('Store settings verified.');
  await pool.end();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { seed, initialProducts };
