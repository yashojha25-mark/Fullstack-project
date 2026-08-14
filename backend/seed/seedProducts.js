require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load models
const Product = require('../models/Product');
const User = require('../models/User');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const products = [
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    brand: 'Sony',
    category: 'Technology',
    subcategory: 'Audio',
    price: 29990,
    discount: 15,
    shortDescription: 'Industry-leading noise cancellation with 30hr battery life.',
    description:
      'Experience the pinnacle of noise-cancelling technology with Sony WH-1000XM5. Features Multipoint Connection, speak-to-chat, adaptive sound control, and crystal-clear 30-hour battery life. The ultra-premium build with plush ear cushions ensures comfort for all-day listening.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600',
    ],
    colors: ['Black', 'Silver', 'Midnight Blue'],
    specifications: new Map([
      ['Driver Size', '30mm'],
      ['Frequency Response', '4Hz-40,000Hz'],
      ['Battery Life', '30 hours'],
      ['Charging Time', '3.5 hours'],
      ['Weight', '250g'],
      ['Connectivity', 'Bluetooth 5.2'],
    ]),
    stock: 45,
    rating: 4.8,
    reviewCount: 312,
    isNew: false,
    isTrending: true,
  },
  {
    name: 'Apple MacBook Air M3',
    brand: 'Apple',
    category: 'Technology',
    subcategory: 'Laptops',
    price: 114900,
    discount: 5,
    shortDescription: 'Supercharged by M3. All-day battery, no fan.',
    description:
      'The MacBook Air with M3 chip is astonishingly thin and light. Features an 18-hour battery life, 15.3-inch Liquid Retina display, 8-core CPU, 10-core GPU, and up to 24GB unified memory. Perfect for creators, students, and professionals.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
    ],
    colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'],
    specifications: new Map([
      ['Chip', 'Apple M3'],
      ['CPU', '8-core'],
      ['GPU', '10-core'],
      ['RAM', '8GB Unified Memory'],
      ['Storage', '256GB SSD'],
      ['Display', '15.3" Liquid Retina'],
      ['Battery', '18 hours'],
    ]),
    stock: 20,
    rating: 4.9,
    reviewCount: 589,
    isNew: true,
    isTrending: true,
  },
  {
    name: 'Samsung Galaxy Watch 6 Classic',
    brand: 'Samsung',
    category: 'Technology',
    subcategory: 'Wearables',
    price: 32999,
    discount: 20,
    shortDescription: 'Iconic rotating bezel. Advanced health tracking smartwatch.',
    description:
      'The Galaxy Watch 6 Classic brings back the iconic rotating bezel with a premium sapphire crystal glass face. Features advanced sleep coaching, body composition analysis, heart rate monitoring, ECG, and 40 hours of battery life. Water resistant to 5ATM.',
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    ],
    colors: ['Black', 'Silver', 'Cream'],
    specifications: new Map([
      ['Display', '1.47" Super AMOLED'],
      ['Battery', '300mAh'],
      ['Battery Life', '40 hours'],
      ['Water Resistance', '5ATM'],
      ['OS', 'Wear OS with One UI Watch'],
      ['Connectivity', 'Bluetooth 5.3, Wi-Fi, NFC'],
    ]),
    stock: 35,
    rating: 4.5,
    reviewCount: 228,
    isNew: true,
    isTrending: false,
  },
  {
    name: 'Logitech MX Master 3S Wireless Mouse',
    brand: 'Logitech',
    category: 'Technology',
    subcategory: 'Peripherals',
    price: 9995,
    discount: 10,
    shortDescription: 'Ultra-precise, whisper-quiet clicks. The master of productivity.',
    description:
      'The MX Master 3S redefines precision with its 8000 DPI electromagnetic scroll wheel and MagSpeed technology. Ultra-quiet clicks make it perfect for office use. Connect to up to 3 devices simultaneously via Bluetooth or USB receiver. Ergonomic design for all-day comfort.',
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600',
    ],
    colors: ['Graphite', 'Pale Gray', 'Midnight Teal'],
    specifications: new Map([
      ['Sensor', 'Darkfield High Precision'],
      ['DPI', '200–8000 DPI'],
      ['Battery', 'Rechargeable Li-Po'],
      ['Battery Life', '70 days'],
      ['Connectivity', 'Bluetooth Low Energy / USB'],
      ['Buttons', '7 programmable'],
    ]),
    stock: 60,
    rating: 4.7,
    reviewCount: 445,
    isNew: false,
    isTrending: true,
  },
  {
    name: 'JBL Flip 6 Portable Bluetooth Speaker',
    brand: 'JBL',
    category: 'Technology',
    subcategory: 'Audio',
    price: 11999,
    discount: 18,
    shortDescription: 'Bold JBL signature sound. IP67 waterproof. 12hr battery.',
    description:
      'JBL Flip 6 delivers powerful sound with a racetrack-shaped woofer and separate tweeter in a compact, colorful design. With IP67 water and dust resistance, 12-hour battery life, and PartyBoost to pair with multiple JBL speakers.',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
      'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600',
    ],
    colors: ['Black', 'Blue', 'Red', 'Teal', 'Squad'],
    specifications: new Map([
      ['Output Power', '30W'],
      ['Battery Life', '12 hours'],
      ['Water Resistance', 'IP67'],
      ['Connectivity', 'Bluetooth 5.1'],
      ['Charge Time', '2.5 hours'],
      ['Weight', '550g'],
    ]),
    stock: 80,
    rating: 4.6,
    reviewCount: 673,
    isNew: false,
    isTrending: true,
  },
  {
    name: 'Keychron K2 Pro Mechanical Keyboard',
    brand: 'Keychron',
    category: 'Technology',
    subcategory: 'Peripherals',
    price: 7999,
    discount: 0,
    shortDescription: 'Compact 75% layout. Hot-swappable. RGB backlit. Wireless.',
    description:
      'The Keychron K2 Pro is a compact 75% wireless mechanical keyboard with QMK/VIA support for full custom remapping. Features hot-swappable switches, per-key RGB lighting, and up to 4000mAh battery. Works seamlessly across Mac, Windows, and iOS.',
    images: [
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600',
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600',
    ],
    colors: ['Black', 'Dark Gray'],
    specifications: new Map([
      ['Layout', '75% (84 keys)'],
      ['Switch Type', 'Hot-swappable (Gateron G Pro Red)'],
      ['Backlight', 'Per-key RGB'],
      ['Battery', '4000mAh'],
      ['Connectivity', 'Bluetooth 5.1 / USB-C'],
      ['Compatibility', 'Mac / Windows / iOS'],
    ]),
    stock: 40,
    rating: 4.7,
    reviewCount: 189,
    isNew: true,
    isTrending: false,
  },
  {
    name: 'Realme Narzo 70 Pro Smartphone',
    brand: 'Realme',
    category: 'Technology',
    subcategory: 'Smartphones',
    price: 19999,
    discount: 12,
    shortDescription: '50MP OIS camera. 5G. AMOLED. 67W SuperVOOC charging.',
    description:
      'The Realme Narzo 70 Pro 5G features a 50MP OIS camera system, a brilliant 6.7" AMOLED display with 120Hz refresh rate, and the powerful Dimensity 7050 chipset. Comes with a 5000mAh battery and 67W SuperVOOC fast charging.',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
    ],
    colors: ['Glass Gold', 'Glass Blue', 'Black'],
    specifications: new Map([
      ['Processor', 'Dimensity 7050'],
      ['Display', '6.7" AMOLED 120Hz'],
      ['Camera', '50MP OIS + 8MP + 2MP'],
      ['Battery', '5000mAh'],
      ['Charging', '67W SuperVOOC'],
      ['RAM', '8GB'],
      ['Storage', '128GB'],
    ]),
    stock: 55,
    rating: 4.3,
    reviewCount: 156,
    isNew: true,
    isTrending: false,
  },
  {
    name: 'Philips SmartSleep LED Desk Lamp',
    brand: 'Philips',
    category: 'Home',
    subcategory: 'Lighting',
    price: 3499,
    discount: 22,
    shortDescription: 'Smart LED lamp with dimming, color temperature control & USB charging.',
    description:
      'The Philips SmartSleep LED Desk Lamp offers 5 brightness levels and 5 color temperatures to support focus, relaxation, and sleep. Built-in USB port for convenient device charging. Eye-care technology reduces flicker and glare for healthier, more productive work.',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600',
      'https://images.unsplash.com/photo-1513506003901-1e6a35068a15?w=600',
    ],
    colors: ['White', 'Black'],
    specifications: new Map([
      ['Power', '9W LED'],
      ['Brightness Levels', '5'],
      ['Color Temperature', '2700K–6500K'],
      ['USB Port', 'Yes, 5V/1A'],
      ['Eye Care', 'SoftBeam Technology'],
      ['Lifespan', '50,000 hours'],
    ]),
    stock: 90,
    rating: 4.4,
    reviewCount: 97,
    isNew: false,
    isTrending: false,
  },
  {
    name: 'Wildcraft Alpha 45L Trekking Backpack',
    brand: 'Wildcraft',
    category: 'Lifestyle',
    subcategory: 'Bags',
    price: 2799,
    discount: 30,
    shortDescription: '45L capacity. Waterproof. Ergonomic back support. Multiple compartments.',
    description:
      'The Wildcraft Alpha 45L backpack is built for adventure. Features a padded back panel with mesh for ventilation, adjustable sternum strap, rain cover, multiple organizational compartments, and hydration bladder compatibility. Ideal for trekking, hiking, and travel.',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600',
    ],
    colors: ['Olive Green', 'Navy Blue', 'Black', 'Orange'],
    specifications: new Map([
      ['Capacity', '45 Liters'],
      ['Material', 'Ripstop Nylon'],
      ['Rain Cover', 'Included'],
      ['Hydration Compatible', 'Yes'],
      ['Back Panel', 'Padded mesh with airflow channels'],
      ['Weight', '1.2 kg'],
    ]),
    stock: 120,
    rating: 4.2,
    reviewCount: 284,
    isNew: false,
    isTrending: false,
  },
  {
    name: 'Puma RS-X³ Puzzle Sneakers',
    brand: 'Puma',
    category: 'Fashion',
    subcategory: 'Footwear',
    price: 7999,
    discount: 25,
    shortDescription: 'Chunky retro-inspired sneaker with RS foam cushioning.',
    description:
      'The Puma RS-X³ Puzzle takes retro running design to the next level with bold colorblocking and chunky RS foam midsole for superior comfort. Features a breathable mesh upper, leather and synthetic overlays, and a durable rubber outsole for all-day wear.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
    ],
    colors: ['White/Blue', 'Black/Red', 'Gray/Yellow'],
    specifications: new Map([
      ['Upper', 'Mesh with synthetic overlays'],
      ['Midsole', 'RS Foam technology'],
      ['Outsole', 'Rubber'],
      ['Closure', 'Lace-up'],
      ['Style', 'Lifestyle/Casual'],
    ]),
    stock: 75,
    rating: 4.3,
    reviewCount: 341,
    isNew: false,
    isTrending: true,
  },
  {
    name: 'Milton Thermosteel Duo Deluxe Flask 1000ml',
    brand: 'Milton',
    category: 'Lifestyle',
    subcategory: 'Drinkware',
    price: 799,
    discount: 15,
    shortDescription: 'Keeps hot 24hr, cold 48hr. Leak-proof stainless steel thermos.',
    description:
      'Milton Thermosteel Duo Deluxe keeps beverages hot for 24 hours and cold for 48 hours with its double-wall vacuum insulation. Made from 18/8 stainless steel, it is BPA-free, rust-proof, and 100% leak-proof. Perfect for office, gym, travel, and outdoor activities.',
    images: [
      'https://images.unsplash.com/photo-1544621399-18c9b8e6b1c2?w=600',
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600',
    ],
    colors: ['Silver', 'Black', 'Blue', 'Red'],
    specifications: new Map([
      ['Capacity', '1000ml'],
      ['Material', '18/8 Stainless Steel'],
      ['Hot Retention', '24 hours'],
      ['Cold Retention', '48 hours'],
      ['BPA Free', 'Yes'],
      ['Leak Proof', 'Yes'],
    ]),
    stock: 200,
    rating: 4.5,
    reviewCount: 1102,
    isNew: false,
    isTrending: false,
  },
  {
    name: 'Godrej Interio Simplife Study Table',
    brand: 'Godrej',
    category: 'Home',
    subcategory: 'Furniture',
    price: 8499,
    discount: 8,
    shortDescription: 'Compact study/work desk with storage shelves and drawer.',
    description:
      'The Godrej Interio Simplife Study Table provides a sturdy, compact workspace at home. Features a wooden top with scratch-resistant laminate, side storage shelves, a pull-out drawer, and cable management hole. Ideal for students and work-from-home professionals.',
    images: [
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
    ],
    colors: ['Wenge', 'Oak', 'White'],
    specifications: new Map([
      ['Dimensions', '100 x 50 x 75 cm (L x W x H)'],
      ['Material', 'Engineered wood'],
      ['Surface', 'Scratch-resistant laminate'],
      ['Storage', 'Side shelves + 1 drawer'],
      ['Assembly', 'Required (tools included)'],
      ['Weight Capacity', '50 kg'],
    ]),
    stock: 30,
    rating: 4.1,
    reviewCount: 67,
    isNew: true,
    isTrending: false,
  },
];

const seedAdmin = {
  name: 'DIGItal Duniya Admin',
  email: 'admin@digitalduniya.com',
  password: 'Admin@123',
  role: 'admin',
};

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({ role: 'admin' });
    console.log('✅ Cleared existing products and admin users');

    // Seed products
    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} products`);

    // Seed admin user
    const existing = await User.findOne({ email: seedAdmin.email });
    if (!existing) {
      await User.create(seedAdmin);
      console.log(`✅ Admin user created: ${seedAdmin.email} / ${seedAdmin.password}`);
    } else {
      console.log('⚠️  Admin user already exists, skipping.');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login:');
    console.log(`  Email: ${seedAdmin.email}`);
    console.log(`  Password: ${seedAdmin.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
