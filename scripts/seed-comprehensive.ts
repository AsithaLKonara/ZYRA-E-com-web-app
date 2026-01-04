#!/usr/bin/env tsx
/**
 * Comprehensive Database Seeding Script for ZYRA Fashion
 * 
 * This script seeds the database with realistic fashion e-commerce data including:
 * - Categories with images (hierarchical)
 * - Users (customers, admins, moderators)
 * - Products with multiple high-quality images
 * - Orders with order items
 * - Reviews with ratings
 * - Wishlist items
 * - Cart items
 * - Admin reels with products
 * - Reel interactions and comments
 * 
 * Usage:
 *   npm run db:seed
 *   tsx scripts/seed-comprehensive.ts
 * 
 * Options:
 *   --clear     Clear all existing data before seeding
 *   --products  Number of products to create (default: 50)
 *   --users     Number of users to create (default: 30)
 */

import { PrismaClient, UserRole, OrderStatus, ReelStatus, ReelInteractionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

// Simple logger to avoid circular dependency
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Create Prisma client with adapter for Prisma 7.2.0
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

// Configuration
const CONFIG = {
  products: parseInt(process.argv.find(arg => arg.startsWith('--products='))?.split('=')[1] || '50'),
  users: parseInt(process.argv.find(arg => arg.startsWith('--users='))?.split('=')[1] || '30'),
  clearExisting: process.argv.includes('--clear'),
};

// Image URLs - Using Unsplash for high-quality fashion images
const IMAGE_URLS = {
  categories: {
    dresses: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
    tops: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
    bottoms: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=600&fit=crop',
    outerwear: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
    shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
    accessories: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop',
    bags: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    jewelry: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop',
  },
  productImages: [
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=800&fit=crop',
  ],
  userAvatars: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  ],
};

// Fashion-specific seed data
const FASHION_DATA = {
  dressStyles: ['A-Line', 'Bodycon', 'Maxi', 'Midi', 'Mini', 'Wrap', 'Shift', 'Sundress', 'Cocktail', 'Formal'],
  topStyles: ['Blouse', 'T-Shirt', 'Crop Top', 'Tank Top', 'Sweater', 'Cardigan', 'Hoodie', 'Blazer', 'Shirt', 'Camisole'],
  bottomStyles: ['Jeans', 'Trousers', 'Leggings', 'Shorts', 'Skirt', 'Culottes', 'Palazzo', 'Joggers', 'Wide Leg', 'Skinny'],
  colors: ['Black', 'White', 'Navy', 'Beige', 'Red', 'Pink', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Grey'],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  materials: ['Cotton', 'Silk', 'Linen', 'Wool', 'Polyester', 'Denim', 'Leather', 'Cashmere', 'Chiffon', 'Velvet'],
};

// Helper: Generate random item from array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

// Helper: Generate random items from array
function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

// Helper: Generate SKU
function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(6, '0')}`;
}

// Helper: Generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Clear existing data
async function clearData() {
  logger.info('Clearing existing data...');
  
  // Delete in correct order (respecting foreign keys)
  await prisma.reelComment.deleteMany();
  await prisma.reelInteraction.deleteMany();
  await prisma.reelProduct.deleteMany();
  await prisma.reelHashtag.deleteMany();
  await prisma.adminReel.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  
  logger.info('Data cleared successfully');
}

// Seed Categories
async function seedCategories() {
  logger.info('Seeding categories...');
  
  const categoriesData = [
    {
      name: 'Dresses',
      slug: 'dresses',
      description: 'Elegant dresses for every occasion',
      image: IMAGE_URLS.categories.dresses,
      children: [
        { name: 'Casual Dresses', slug: 'casual-dresses', description: 'Comfortable everyday dresses' },
        { name: 'Formal Dresses', slug: 'formal-dresses', description: 'Elegant evening and formal wear' },
        { name: 'Party Dresses', slug: 'party-dresses', description: 'Stylish party and event dresses' },
      ],
    },
    {
      name: 'Tops',
      slug: 'tops',
      description: 'Stylish tops and blouses',
      image: IMAGE_URLS.categories.tops,
      children: [
        { name: 'Blouses', slug: 'blouses', description: 'Elegant blouses for work and casual wear' },
        { name: 'T-Shirts', slug: 't-shirts', description: 'Comfortable everyday t-shirts' },
        { name: 'Sweaters', slug: 'sweaters', description: 'Warm and cozy sweaters' },
      ],
    },
    {
      name: 'Bottoms',
      slug: 'bottoms',
      description: 'Pants, jeans, and skirts',
      image: IMAGE_URLS.categories.bottoms,
      children: [
        { name: 'Jeans', slug: 'jeans', description: 'Classic and trendy jeans' },
        { name: 'Skirts', slug: 'skirts', description: 'Versatile skirts for all occasions' },
        { name: 'Trousers', slug: 'trousers', description: 'Professional and casual trousers' },
      ],
    },
    {
      name: 'Outerwear',
      slug: 'outerwear',
      description: 'Jackets, coats, and blazers',
      image: IMAGE_URLS.categories.outerwear,
      children: [
        { name: 'Jackets', slug: 'jackets', description: 'Stylish jackets for every season' },
        { name: 'Coats', slug: 'coats', description: 'Warm winter coats' },
        { name: 'Blazers', slug: 'blazers', description: 'Professional blazers' },
      ],
    },
    {
      name: 'Shoes',
      slug: 'shoes',
      description: 'Footwear for every occasion',
      image: IMAGE_URLS.categories.shoes,
      children: [
        { name: 'Heels', slug: 'heels', description: 'Elegant high heels' },
        { name: 'Sneakers', slug: 'sneakers', description: 'Comfortable sneakers' },
        { name: 'Boots', slug: 'boots', description: 'Stylish boots' },
      ],
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Fashion accessories',
      image: IMAGE_URLS.categories.accessories,
      children: [
        { name: 'Belts', slug: 'belts', description: 'Stylish belts' },
        { name: 'Hats', slug: 'hats', description: 'Trendy hats' },
        { name: 'Scarves', slug: 'scarves', description: 'Cozy scarves' },
      ],
    },
    {
      name: 'Bags',
      slug: 'bags',
      description: 'Handbags and purses',
      image: IMAGE_URLS.categories.bags,
    },
    {
      name: 'Jewelry',
      slug: 'jewelry',
      description: 'Necklaces, earrings, and rings',
      image: IMAGE_URLS.categories.jewelry,
    },
  ];
  
  const categories = [];
  
  for (const catData of categoriesData) {
    const category = await prisma.category.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        image: catData.image,
      },
    });
    
    categories.push(category);
    
    // Create children categories
    if (catData.children) {
      for (const childData of catData.children) {
        const child = await prisma.category.create({
          data: {
            name: childData.name,
            slug: childData.slug,
            description: childData.description,
            parentId: category.id,
          },
        });
        categories.push(child);
      }
    }
  }
  
  logger.info(`Created ${categories.length} categories`);
  return categories;
}

// Seed Users
async function seedUsers() {
  logger.info('Seeding users...');
  
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  // Create admin users
  const adminUsers = [
    {
      email: 'admin@zyra-fashion.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      avatar: IMAGE_URLS.userAvatars[0],
    },
    {
      email: 'moderator@zyra-fashion.com',
      name: 'Moderator User',
      password: hashedPassword,
      role: UserRole.MODERATOR,
      emailVerified: new Date(),
      avatar: IMAGE_URLS.userAvatars[1],
    },
  ];
  
  const users = [];
  
  // Create admin/moderator users
  for (const userData of adminUsers) {
    const user = await prisma.user.create({
      data: userData,
    });
    users.push(user);
  }
  
  // Create customer users
  const firstNames = ['Emma', 'Olivia', 'Sophia', 'Isabella', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  for (let i = 0; i < CONFIG.users; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const email = `customer${i + 1}@example.com`;
    
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        emailVerified: Math.random() > 0.3 ? new Date() : null, // 70% verified
        avatar: randomItem(IMAGE_URLS.userAvatars),
        isActive: Math.random() > 0.1, // 90% active
      },
    });
    users.push(user);
  }
  
  logger.info(`Created ${users.length} users (${adminUsers.length} admins, ${CONFIG.users} customers)`);
  return users;
}

// Seed Products
async function seedProducts(categories: any[], users: any[]) {
  logger.info('Seeding products...');
  
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.slug] = cat;
    return acc;
  }, {} as Record<string, any>);
  
  const productTemplates = [
    // Dresses
    { categorySlug: 'dresses', styles: FASHION_DATA.dressStyles, basePrice: 80, maxPrice: 300 },
    { categorySlug: 'casual-dresses', styles: ['Summer', 'Floral', 'Striped'], basePrice: 60, maxPrice: 150 },
    { categorySlug: 'formal-dresses', styles: ['Evening', 'Cocktail', 'Gown'], basePrice: 150, maxPrice: 500 },
    
    // Tops
    { categorySlug: 'tops', styles: FASHION_DATA.topStyles, basePrice: 30, maxPrice: 120 },
    { categorySlug: 'blouses', styles: ['Silk', 'Cotton', 'Chiffon'], basePrice: 40, maxPrice: 150 },
    { categorySlug: 't-shirts', styles: ['Basic', 'Graphic', 'V-neck'], basePrice: 20, maxPrice: 60 },
    
    // Bottoms
    { categorySlug: 'bottoms', styles: FASHION_DATA.bottomStyles, basePrice: 50, maxPrice: 200 },
    { categorySlug: 'jeans', styles: ['Skinny', 'Straight', 'Wide'], basePrice: 60, maxPrice: 150 },
    { categorySlug: 'skirts', styles: ['Pencil', 'A-line', 'Pleated'], basePrice: 40, maxPrice: 120 },
    
    // Outerwear
    { categorySlug: 'outerwear', styles: ['Trench', 'Wool', 'Leather'], basePrice: 100, maxPrice: 400 },
    { categorySlug: 'jackets', styles: ['Denim', 'Bomber', 'Blazer'], basePrice: 80, maxPrice: 250 },
    
    // Shoes
    { categorySlug: 'shoes', styles: ['High Heels', 'Flats', 'Sandals'], basePrice: 60, maxPrice: 300 },
    { categorySlug: 'heels', styles: ['Stiletto', 'Block', 'Platform'], basePrice: 80, maxPrice: 250 },
    { categorySlug: 'sneakers', styles: ['Running', 'Casual', 'Fashion'], basePrice: 50, maxPrice: 150 },
    
    // Accessories
    { categorySlug: 'accessories', styles: ['Leather', 'Metal', 'Fabric'], basePrice: 20, maxPrice: 100 },
    { categorySlug: 'bags', styles: ['Tote', 'Crossbody', 'Clutch'], basePrice: 40, maxPrice: 300 },
    { categorySlug: 'jewelry', styles: ['Gold', 'Silver', 'Pearl'], basePrice: 30, maxPrice: 500 },
  ];
  
  const products = [];
  let productIndex = 1;
  
  // Distribute products across categories
  const productsPerTemplate = Math.ceil(CONFIG.products / productTemplates.length);
  
  for (const template of productTemplates) {
    const category = categoryMap[template.categorySlug];
    if (!category) continue;
    
    const productsToCreate = Math.min(
      productsPerTemplate,
      CONFIG.products - products.length
    );
    
    for (let i = 0; i < productsToCreate && products.length < CONFIG.products; i++) {
      const style = randomItem(template.styles);
      const color = randomItem(FASHION_DATA.colors);
      const material = randomItem(FASHION_DATA.materials);
      const name = `${color} ${style} ${category.name}`;
      const slug = generateSlug(name);
      
      const basePrice = template.basePrice + (Math.random() * (template.maxPrice - template.basePrice));
      const price = Math.round(basePrice * 100) / 100;
      const originalPrice = Math.random() > 0.5 ? Math.round(price * 1.3 * 100) / 100 : null;
      
      // Generate multiple product images
      const numImages = 3 + Math.floor(Math.random() * 4); // 3-6 images
      const images = randomItems(IMAGE_URLS.productImages, numImages);
      
      // Generate tags
      const tags = [
        color.toLowerCase(),
        style.toLowerCase(),
        material.toLowerCase(),
        category.slug,
        randomItem(['trending', 'new', 'sale', 'popular', 'featured']),
      ];
      
      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description: `Elegant ${color.toLowerCase()} ${style.toLowerCase()} ${category.name.toLowerCase()} made from premium ${material.toLowerCase()}. Perfect for any occasion.`,
          price,
          originalPrice,
          sku: generateSKU(category.slug, productIndex++),
          stock: Math.floor(Math.random() * 100) + 10,
          images,
          tags,
          isActive: Math.random() > 0.1, // 90% active
          isFeatured: Math.random() > 0.7, // 30% featured
          categoryId: category.id,
        },
      });
      
      products.push(product);
    }
  }
  
  logger.info(`Created ${products.length} products`);
  return products;
}

// Seed Orders
async function seedOrders(users: any[], products: any[]) {
  logger.info('Seeding orders...');
  
  const customerUsers = users.filter(u => u.role === UserRole.CUSTOMER);
  const orders = [];
  
  // Create 2-5 orders per customer
  for (const user of customerUsers) {
    const numOrders = Math.floor(Math.random() * 4) + 2; // 2-5 orders
        
    for (let i = 0; i < numOrders; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
      
      const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
      const orderProducts = randomItems(products, numItems);
      
      let subtotal = 0;
      const orderItems = [];
      
      for (const product of orderProducts) {
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        const itemPrice = product.price;
        subtotal += itemPrice * quantity;
        
        orderItems.push({
          quantity,
          price: itemPrice,
          productId: product.id,
        });
      }
      
      const tax = subtotal * 0.1; // 10% tax
      const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
      const total = subtotal + tax + shipping;
      
      const statuses = [
        OrderStatus.DELIVERED,
        OrderStatus.SHIPPED,
        OrderStatus.PROCESSING,
        OrderStatus.PENDING,
      ];
      const weights = [40, 30, 20, 10]; // More delivered orders
      const status = statuses[Math.floor(Math.random() * weights.length)];
      
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const shippingAddress = {
        street: `${Math.floor(Math.random() * 9999)} Main Street`,
        city: randomItem(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia']),
        state: randomItem(['NY', 'CA', 'IL', 'TX', 'AZ', 'PA']),
        zipCode: String(Math.floor(Math.random() * 90000) + 10000),
        country: 'United States',
      };
      
      const order = await prisma.order.create({
        data: {
          orderNumber,
          status,
          total,
          subtotal,
          tax,
          shipping,
          userId: user.id,
          shippingAddress,
          billingAddress: shippingAddress,
          createdAt: orderDate,
          items: {
            create: orderItems,
          },
        },
      });
      
      orders.push(order);
    }
  }
  
  logger.info(`Created ${orders.length} orders`);
  return orders;
}

// Seed Reviews
async function seedReviews(users: any[], products: any[]) {
  logger.info('Seeding reviews...');
  
  const customerUsers = users.filter(u => u.role === UserRole.CUSTOMER);
  const reviews = [];
  
  const reviewComments = [
    'Absolutely love this! Great quality and perfect fit.',
    'Beautiful piece, exactly as described. Highly recommend!',
    'Good quality for the price. Very satisfied with my purchase.',
    'The color is even more beautiful in person. Perfect!',
    'Excellent customer service and fast shipping.',
    'Not quite what I expected, but still a nice piece.',
    'Good value for money. Will definitely order again.',
    'The material feels very premium. Worth every penny!',
    'Fast shipping and the product exceeded my expectations.',
    'Love the design and quality. Perfect addition to my wardrobe.',
  ];
  
  // 30-50% of products get reviews
  const productsWithReviews = randomItems(products, Math.floor(products.length * 0.4));
  
  for (const product of productsWithReviews) {
    const numReviews = Math.floor(Math.random() * 5) + 1; // 1-5 reviews per product
    const reviewers = randomItems(customerUsers, numReviews);
    
    for (const reviewer of reviewers) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars (mostly positive)
      const hasComment = Math.random() > 0.3; // 70% have comments
      
      const review = await prisma.review.create({
        data: {
          rating,
          comment: hasComment ? randomItem(reviewComments) : null,
          userId: reviewer.id,
          productId: product.id,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      });
      
      reviews.push(review);
    }
  }
  
  logger.info(`Created ${reviews.length} reviews`);
  return reviews;
}

// Seed Wishlist Items
async function seedWishlistItems(users: any[], products: any[]) {
  logger.info('Seeding wishlist items...');
  
  const customerUsers = users.filter(u => u.role === UserRole.CUSTOMER);
  const wishlistItems = [];
  
  for (const user of customerUsers) {
    const numItems = Math.floor(Math.random() * 8) + 2; // 2-9 items per user
    const userProducts = randomItems(products, numItems);
    
    for (const product of userProducts) {
      try {
        const wishlistItem = await prisma.wishlistItem.create({
          data: {
            userId: user.id,
            productId: product.id,
          },
        });
        wishlistItems.push(wishlistItem);
      } catch (error) {
        // Skip if already exists (unique constraint)
      }
    }
  }
  
  logger.info(`Created ${wishlistItems.length} wishlist items`);
  return wishlistItems;
}

// Seed Cart Items
async function seedCartItems(users: any[], products: any[]) {
  logger.info('Seeding cart items...');
  
  const customerUsers = users.filter(u => u.role === UserRole.CUSTOMER);
  const cartItems = [];
  
  // 40% of users have items in cart
  const usersWithCarts = randomItems(customerUsers, Math.floor(customerUsers.length * 0.4));
  
  for (const user of usersWithCarts) {
    const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items per cart
    const cartProducts = randomItems(products, numItems);
    
    for (const product of cartProducts) {
      try {
        const cartItem = await prisma.cartItem.create({
          data: {
            quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
            userId: user.id,
            productId: product.id,
          },
        });
        cartItems.push(cartItem);
      } catch (error) {
        // Skip if already exists
      }
    }
  }
  
  logger.info(`Created ${cartItems.length} cart items`);
  return cartItems;
}

// Seed Admin Reels
async function seedAdminReels(users: any[], products: any[]) {
  logger.info('Seeding admin reels...');
  
  const adminUsers = users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.MODERATOR);
  if (adminUsers.length === 0) {
    logger.warn('No admin users found, skipping reels');
    return [];
  }
  
  const reels = [];
  const reelTitles = [
    'Summer Collection 2024',
    'New Arrivals',
    'Trending Now',
    'Styling Tips',
    'Outfit Inspiration',
    'Behind the Scenes',
    'Fashion Week Highlights',
    'Weekend Lookbook',
  ];
  
  // Create 5-8 reels
  const numReels = Math.floor(Math.random() * 4) + 5;
  
  for (let i = 0; i < numReels; i++) {
    const admin = randomItem(adminUsers);
    const title = randomItem(reelTitles);
    const isFeatured = Math.random() > 0.7; // 30% featured
    
    // Generate video/thumbnail URLs (using placeholder)
    const videoUrl = `https://videos.unsplash.com/video-${Math.random().toString(36).substr(2, 9)}.mp4`;
    const thumbnailUrl = randomItem(IMAGE_URLS.productImages);
    
    const reel = await prisma.adminReel.create({
      data: {
        title,
        description: `Check out our ${title.toLowerCase()}! Featuring the latest fashion trends.`,
        videoUrl,
        thumbnailUrl,
        duration: Math.floor(Math.random() * 60) + 15, // 15-75 seconds
        fileSize: Math.floor(Math.random() * 50000000) + 5000000, // 5-55 MB
        status: ReelStatus.PUBLISHED,
        featured: isFeatured,
        viewCount: Math.floor(Math.random() * 10000) + 100,
        likeCount: Math.floor(Math.random() * 500) + 10,
        commentCount: Math.floor(Math.random() * 50),
        shareCount: Math.floor(Math.random() * 100) + 5,
        adminId: admin.id,
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        products: {
          create: randomItems(products, Math.floor(Math.random() * 4) + 1).map(product => ({
            productId: product.id,
            positionX: 0.5,
            positionY: 0.5 + (Math.random() * 0.3), // Vary Y position
          })),
        },
        hashtags: {
          create: randomItems(['fashion', 'style', 'trending', 'new', 'sale', 'outfit', 'ootd'], 3).map(tag => ({
            hashtag: tag,
          })),
        },
      },
    });
    
    reels.push(reel);
    
    // Create some interactions
    const customerUsers = users.filter(u => u.role === UserRole.CUSTOMER);
    const interactors = randomItems(customerUsers, Math.floor(Math.random() * 20) + 5);
    
    for (const user of interactors) {
      try {
        // Some users like the reel
        if (Math.random() > 0.5) {
          await prisma.reelInteraction.create({
            data: {
              reelId: reel.id,
              userId: user.id,
              interactionType: ReelInteractionType.LIKE,
            },
          });
        }
        
        // Some users view
        if (Math.random() > 0.3) {
          await prisma.reelInteraction.create({
            data: {
              reelId: reel.id,
              userId: user.id,
              interactionType: ReelInteractionType.VIEW,
            },
          });
        }
        
        // Some users comment (10% chance)
        if (Math.random() > 0.9) {
          await prisma.reelComment.create({
            data: {
              reelId: reel.id,
              userId: user.id,
              content: randomItem([
                'Love this! 💖',
                'So stylish!',
                'Need this in my wardrobe',
                'Beautiful collection!',
                'Amazing!',
              ]),
            },
          });
        }
      } catch (error) {
        // Skip if already exists
      }
    }
  }
  
  logger.info(`Created ${reels.length} admin reels with interactions`);
  return reels;
}

// Main seeding function
async function main() {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Starting comprehensive database seeding...');
    logger.info(`Configuration: ${CONFIG.products} products, ${CONFIG.users} users`);
    
    // Clear data if requested
    if (CONFIG.clearExisting) {
      await clearData();
    } else {
      // Check if data exists
      const userCount = await prisma.user.count();
      const productCount = await prisma.product.count();
      
      if (userCount > 0 || productCount > 0) {
        logger.warn('Database already contains data. Use --clear to clear existing data first.');
        logger.warn('Skipping seeding to prevent duplicates.');
        return;
      }
    }
    
    // Seed in order (respecting dependencies)
    const categories = await seedCategories();
    const users = await seedUsers();
    const products = await seedProducts(categories, users);
    const orders = await seedOrders(users, products);
    const reviews = await seedReviews(users, products);
    const wishlistItems = await seedWishlistItems(users, products);
    const cartItems = await seedCartItems(users, products);
    const reels = await seedAdminReels(users, products);
    
    const duration = Date.now() - startTime;
    
    // Summary
    logger.info('✅ Database seeding completed successfully!');
    logger.info('\n📊 Seeding Summary:');
    logger.info(`   Categories: ${categories.length}`);
    logger.info(`   Users: ${users.length}`);
    logger.info(`   Products: ${products.length}`);
    logger.info(`   Orders: ${orders.length}`);
    logger.info(`   Reviews: ${reviews.length}`);
    logger.info(`   Wishlist Items: ${wishlistItems.length}`);
    logger.info(`   Cart Items: ${cartItems.length}`);
    logger.info(`   Admin Reels: ${reels.length}`);
    logger.info(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    
    logger.info('\n🔑 Test Accounts:');
    logger.info('   Admin: admin@zyra-fashion.com / password123');
    logger.info('   Moderator: moderator@zyra-fashion.com / password123');
    logger.info('   Customer: customer1@example.com / password123');
    
  } catch (error) {
    logger.error('❌ Database seeding failed:', {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as seedComprehensive };

