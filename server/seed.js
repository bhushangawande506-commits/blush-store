const { db, initDatabase } = require('./db');

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
    images: JSON.stringify(["/images/Golden-Hour Mediterranean Terrace Portrait.png"]),
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
      "/images/Airy Floral Dress Portrait.png",
      "/images/Romantic Mediterranean Summer Twirl.png",
      "/images/Elegant Floral Dress Portrait.png"
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
    images: JSON.stringify(["/images/Elegant Black Dress in a Sunlit Interior.png"]),
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
    description: "Artisan eyelet lace embroidery in warm antique ivory. Flattering square neck, delicate ladder lace trim, and a tiered A-line flounce skirt.",
    fabric: "100% Broderie Anglaise Cotton with Cotton Lining",
    care: "Delicate wash in mesh bag. Warm iron.",
    images: JSON.stringify(["/images/Sunlit Ivory Sundress in a Mediterranean Courtyard.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Antique Ivory"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 10
  },
  {
    name: "Burgundy Draped Evening Dress",
    slug: "burgundy-draped-evening-dress",
    category: "Dresses",
    price: 4290,
    compare_at_price: 5190,
    description: "Sweeping floor-length gown in deep wine burgundy with finely gathered corset bodice, flowing waterfall drape, and asymmetrical cascade skirt.",
    fabric: "Georgette Chiffon with Satin Lining",
    care: "Professional dry clean only.",
    images: JSON.stringify(["/images/Burgundy Elegance by Candlelight.png"]),
    sizes: JSON.stringify(["S", "M", "L", "XL"]),
    colors: JSON.stringify(["Deep Burgundy"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 8
  },
  {
    name: "Blue Floral Wrap Dress",
    slug: "blue-floral-wrap-dress",
    category: "Dresses",
    price: 3190,
    compare_at_price: 3790,
    description: "Charming French provincial floral print in dusty blue and ivory. Features romantic puff sleeves, flattering square neck, and tiered midi silhouette.",
    fabric: "100% Breathable Rayon Viscose",
    care: "Cold hand wash. Dry in shade.",
    images: JSON.stringify(["/images/Smiling in a Blue Floral Dress.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
    colors: JSON.stringify(["Dusty Blue"]),
    is_featured: 0,
    is_new_arrival: 1,
    stock: 14
  },
  {
    name: "Black Square-Neck Fitted Top",
    slug: "black-square-neck-fitted-top",
    category: "Tops",
    price: 1490,
    compare_at_price: 1890,
    description: "The essential modern staple. Ribbed knit square-neck sleeveless crop top engineered for seamless everyday styling and maximum shape retention.",
    fabric: "Premium Compact Modal Rib Knit (95% Modal, 5% Elastane)",
    care: "Machine wash cold. Do not tumble dry.",
    images: JSON.stringify([
      "/images/Modern Indoor Lifestyle Portrait.png",
      "/images/Modern Neutral Interior Portrait.png"
    ]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Jet Black"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 25
  },
  {
    name: "Burgundy Ribbed Crop Top",
    slug: "burgundy-ribbed-crop-top",
    category: "Tops",
    price: 1390,
    compare_at_price: 1790,
    description: "Sleek cropped silhouette in rich berry burgundy with ribbed texture, wide square neckline, and comfortable short cap sleeves.",
    fabric: "Organic Cotton Rib (96% Cotton, 4% Spandex)",
    care: "Machine wash cold with like colors.",
    images: JSON.stringify([
      "/images/ChatGPT Image Oct 27, 2026, 10_37_57 PM.png",
      "/images/ChatGPT Image Oct 27, 2026, 10_57_56 PM.png"
    ]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Berry Burgundy"]),
    is_featured: 0,
    is_new_arrival: 1,
    stock: 20
  },
  {
    name: "White Off-Shoulder Blouse",
    slug: "white-off-shoulder-blouse",
    category: "Tops",
    price: 2190,
    compare_at_price: 2690,
    description: "Architectural off-shoulder blouse in crisp optic white cotton poplin. Features wide structured foldover collar and statement bishop sleeves with button cuffs.",
    fabric: "100% High-Thread Count Cotton Poplin",
    care: "Dry clean or gentle wash. Steam iron.",
    images: JSON.stringify([
      "/images/ChatGPT Image Oct 27, 2026, 11_02_51 PM.png",
      "/images/Sunlit Modern Fashion Portrait.png"
    ]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Optic White"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 15
  },
  {
    name: "Pastel Pink Satin Blouse",
    slug: "pastel-pink-satin-blouse",
    category: "Tops",
    price: 2490,
    compare_at_price: 2990,
    description: "A fluid, liquid-silk draped cowl neck blouse in delicate blush pastel pink. Tailored long sleeves with elongated button cuffs for refined luxury.",
    fabric: "Silk-Touch Poly Satin",
    care: "Dry clean recommended or hand wash with mild silk detergent.",
    images: JSON.stringify(["/images/pink_satin_blouse_1793149441010.jpg"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Blush Pink"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 12
  },
  {
    name: "Sage Green Sleeveless Top",
    slug: "sage-green-sleeveless-top",
    category: "Tops",
    price: 1590,
    compare_at_price: 1990,
    description: "Understated elegance in soft sage green. Contoured square neckline, fine micro-rib texture, and versatile styling potential.",
    fabric: "Micro-Modal Ribbed Blend",
    care: "Machine wash delicate.",
    images: JSON.stringify([
      "/images/ChatGPT Image Oct 27, 2026, 10_43_40 PM.png",
      "/images/ChatGPT Image Oct 27, 2026, 10_50_49 PM.png",
      "/images/Sunlit Sage Lookbook Stroll.png"
    ]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Sage Green"]),
    is_featured: 0,
    is_new_arrival: 0,
    stock: 22
  },
  {
    name: "Beige Linen Shirt and Trouser Set",
    slug: "beige-linen-shirt-and-trouser-set",
    category: "Co-ord Sets",
    price: 4490,
    compare_at_price: 5490,
    description: "Effortlessly tailored two-piece set in pure natural beige linen. Includes relaxed single-button blazer and high-waisted front-pleated wide-leg trousers.",
    fabric: "100% Pure French Flax Linen",
    care: "Dry clean or cold delicate cycle. Hang to dry.",
    images: JSON.stringify(["/images/ChatGPT Image Oct 27, 2026, 10_40_01 PM.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
    colors: JSON.stringify(["Natural Beige"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 9
  },
  {
    name: "Burgundy Blazer and Trouser Set",
    slug: "burgundy-blazer-and-trouser-set",
    category: "Co-ord Sets",
    price: 4990,
    compare_at_price: 5990,
    description: "Sharp sartorial suiting tailored in deep wine burgundy. Single-breasted peak lapel blazer paired with elongating pleated wide trousers.",
    fabric: "Fine Poly-Viscose Suiting with Stretch Silk Lining",
    care: "Specialist dry clean only.",
    images: JSON.stringify(["/images/burgundy_blazer_set_1793149498559.jpg"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Wine Burgundy"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 8
  },
  {
    name: "Pastel Blue Matching Top and Skirt Set",
    slug: "pastel-blue-matching-top-and-skirt-set",
    category: "Co-ord Sets",
    price: 3790,
    compare_at_price: 4490,
    description: "Sun-drenched Mediterranean charm in serene powder blue linen. Features structured square-neck crop top and high-waist A-line midi skirt with thigh slit.",
    fabric: "Premium Washed Linen-Cotton Blend",
    care: "Gentle cold wash. Line dry in shade.",
    images: JSON.stringify(["/images/pastel_blue_set_1793149586294.jpg"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Powder Blue"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 11
  },
  {
    name: "Black Pleated Midi Skirt",
    slug: "black-pleated-midi-skirt",
    category: "Skirts",
    price: 2690,
    compare_at_price: 3290,
    description: "Crisp accordion sunburst pleats that billow with every stride. High-waisted elasticized grosgrain waistband and flattering midi length.",
    fabric: "Permanent Pleat Georgette Chiffon with Soft Satin Lining",
    care: "Hand wash cold. Do not iron pleats.",
    images: JSON.stringify(["/images/ChatGPT Image Oct 27, 2026, 11_02_51 PM.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Noir Black"]),
    is_featured: 0,
    is_new_arrival: 0,
    stock: 14
  },
  {
    name: "Chocolate Brown Satin Midi Skirt",
    slug: "chocolate-brown-satin-midi-skirt",
    category: "Skirts",
    price: 2590,
    compare_at_price: 3190,
    description: "Bias-cut fluid skirt falling in a rich chocolate brown liquid sheen. Designed to hug the hips before gently flaring into an effortless midi hemline.",
    fabric: "Heavyweight Poly-Satin (Anti-Static Finish)",
    care: "Cold hand wash with delicate silk detergent.",
    images: JSON.stringify(["/images/Burgundy Elegance by Candlelight.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Rich Chocolate"]),
    is_featured: 0,
    is_new_arrival: 1,
    stock: 12
  },
  {
    name: "Floral Midi Skirt",
    slug: "floral-midi-skirt",
    category: "Skirts",
    price: 2490,
    compare_at_price: 2990,
    description: "Tiered romantic floral midi skirt with soft gathers and a fluid flared drape. Versatile for casual garden brunches or weekend styling.",
    fabric: "Chiffon with Light Cotton Voile Lining",
    care: "Machine wash cold delicate.",
    images: JSON.stringify(["/images/ChatGPT Image Oct 27, 2026, 09_48_52 PM.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Rose Garden Print"]),
    is_featured: 0,
    is_new_arrival: 0,
    stock: 16
  },
  {
    name: "Black Eveningwear Dress",
    slug: "black-eveningwear-dress",
    category: "Partywear",
    price: 4190,
    compare_at_price: 4990,
    description: "Sculpted cocktail dress tailored with clean lines, square neckline, and understated modern elegance. Perfect for dinners and festive galas.",
    fabric: "Sculpting Crepe Ponte with Elastane",
    care: "Professional dry clean.",
    images: JSON.stringify(["/images/Elegant Black Dress in a Sunlit Interior.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Onyx Black"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 10
  },
  {
    name: "Burgundy Occasionwear Outfit",
    slug: "burgundy-occasionwear-outfit",
    category: "Partywear",
    price: 4790,
    compare_at_price: 5690,
    description: "Opulent wine burgundy party silhouette with cascading fluid layers, structured bodice, and graceful movement under evening lights.",
    fabric: "Luxe Georgette and Liquid Chiffon",
    care: "Dry clean only.",
    images: JSON.stringify(["/images/Burgundy Elegance by Candlelight.png"]),
    sizes: JSON.stringify(["S", "M", "L"]),
    colors: JSON.stringify(["Wine Burgundy"]),
    is_featured: 1,
    is_new_arrival: 1,
    stock: 7
  },
  {
    name: "Cream Partywear Dress",
    slug: "cream-partywear-dress",
    category: "Partywear",
    price: 3890,
    compare_at_price: 4590,
    description: "Festive ivory celebration dress embellished with delicate tonal embroidery, scalloped trims, and a playful tiered silhouette.",
    fabric: "Cotton Voile with Fine Silk Embroidery",
    care: "Dry clean or hand wash cold inside out.",
    images: JSON.stringify(["/images/Sunlit Ivory Sundress in a Mediterranean Courtyard.png"]),
    sizes: JSON.stringify(["XS", "S", "M", "L"]),
    colors: JSON.stringify(["Ivory Gold"]),
    is_featured: 1,
    is_new_arrival: 0,
    stock: 11
  }
];

async function seed() {
  await initDatabase();
  console.log('Seeding initial products...');

  db.serialize(() => {
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM products');
    checkStmt.get((err, row) => {
      if (err) {
        console.error('Check error:', err);
        return;
      }

      if (row.count === 0) {
        const stmt = db.prepare(`
          INSERT INTO products (
            name, slug, category, price, compare_at_price, description, fabric, care, images, sizes, colors, is_featured, is_new_arrival, stock
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        initialProducts.forEach(prod => {
          stmt.run(
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
          );
        });

        stmt.finalize(() => {
          console.log(`Successfully seeded ${initialProducts.length} distinct products!`);
        });
      } else {
        console.log(`Database already has ${row.count} products.`);
      }
    });

    // Seed default store settings
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

    const setStmt = db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)');
    settings.forEach(([k, v]) => setStmt.run(k, v));
    setStmt.finalize();
  });
}

seed().catch(console.error);
