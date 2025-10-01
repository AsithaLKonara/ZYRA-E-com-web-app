import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { monitoring } from './monitoring';
import bcrypt from 'bcryptjs';

// Seeding configuration
const SEEDING_CONFIG = {
  // Seed data directory
  seedDataDir: './prisma/seed-data',
  
  // Batch size for seeding
  batchSize: 1000,
  
  // Clear existing data before seeding
  clearBeforeSeeding: true,
  
  // Seed data files
  seedFiles: {
    users: 'users.json',
    categories: 'categories.json',
    products: 'products.json',
    orders: 'orders.json',
    reviews: 'reviews.json',
  },
} as const;

// Seed data interfaces
interface SeedUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SeedCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SeedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SeedOrder {
  id: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  currency: string;
  shippingAddress: any;
  billingAddress: any;
  createdAt: string;
  updatedAt: string;
}

interface SeedReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Database seeding class
export class DatabaseSeeding {
  private prisma: PrismaClient;
  private seedDataDir: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.seedDataDir = SEEDING_CONFIG.seedDataDir;
  }

  // Seed all data
  async seedAll(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting database seeding');
      
      // Clear existing data if configured
      if (SEEDING_CONFIG.clearBeforeSeeding) {
        await this.clearAllData();
      }
      
      // Seed data in order
      await this.seedUsers();
      await this.seedCategories();
      await this.seedProducts();
      await this.seedOrders();
      await this.seedReviews();
      
      const duration = Date.now() - startTime;
      
      logger.info('Database seeding completed successfully', {
        duration: `${duration}ms`,
      });
      
      monitoring.recordCounter('database.seeding.success', 1);
      monitoring.recordTimer('database.seeding.duration', duration);
      
    } catch (error) {
      logger.error('Database seeding failed', {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });
      
      monitoring.recordCounter('database.seeding.error', 1);
      throw error;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      logger.info('Clearing existing data');
      
      // Clear in reverse order of dependencies
      await this.prisma.review.deleteMany();
      await this.prisma.orderItem.deleteMany();
      await this.prisma.order.deleteMany();
      await this.prisma.cartItem.deleteMany();
      await this.prisma.cart.deleteMany();
      await this.prisma.wishlist.deleteMany();
      await this.prisma.product.deleteMany();
      await this.prisma.category.deleteMany();
      await this.prisma.user.deleteMany();
      
      logger.info('Existing data cleared successfully');
      
    } catch (error) {
      logger.error('Failed to clear existing data', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Seed users
  async seedUsers(): Promise<void> {
    try {
      logger.info('Seeding users');
      
      const usersData = await this.loadSeedData<SeedUser>('users');
      const hashedUsers = await Promise.all(
        usersData.map(async (user) => ({
          ...user,
          password: await bcrypt.hash(user.password, 12),
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        }))
      );
      
      // Seed in batches
      for (let i = 0; i < hashedUsers.length; i += SEEDING_CONFIG.batchSize) {
        const batch = hashedUsers.slice(i, i + SEEDING_CONFIG.batchSize);
        await this.prisma.user.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      
      logger.info('Users seeded successfully', {
        count: hashedUsers.length,
      });
      
      monitoring.recordCounter('database.seeding.users', hashedUsers.length);
      
    } catch (error) {
      logger.error('Failed to seed users', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Seed categories
  async seedCategories(): Promise<void> {
    try {
      logger.info('Seeding categories');
      
      const categoriesData = await this.loadSeedData<SeedCategory>('categories');
      const processedCategories = categoriesData.map(category => ({
        ...category,
        createdAt: new Date(category.createdAt),
        updatedAt: new Date(category.updatedAt),
      }));
      
      // Seed in batches
      for (let i = 0; i < processedCategories.length; i += SEEDING_CONFIG.batchSize) {
        const batch = processedCategories.slice(i, i + SEEDING_CONFIG.batchSize);
        await this.prisma.category.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      
      logger.info('Categories seeded successfully', {
        count: processedCategories.length,
      });
      
      monitoring.recordCounter('database.seeding.categories', processedCategories.length);
      
    } catch (error) {
      logger.error('Failed to seed categories', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Seed products
  async seedProducts(): Promise<void> {
    try {
      logger.info('Seeding products');
      
      const productsData = await this.loadSeedData<SeedProduct>('products');
      const processedProducts = productsData.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      }));
      
      // Seed in batches
      for (let i = 0; i < processedProducts.length; i += SEEDING_CONFIG.batchSize) {
        const batch = processedProducts.slice(i, i + SEEDING_CONFIG.batchSize);
        await this.prisma.product.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      
      logger.info('Products seeded successfully', {
        count: processedProducts.length,
      });
      
      monitoring.recordCounter('database.seeding.products', processedProducts.length);
      
    } catch (error) {
      logger.error('Failed to seed products', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Seed orders
  async seedOrders(): Promise<void> {
    try {
      logger.info('Seeding orders');
      
      const ordersData = await this.loadSeedData<SeedOrder>('orders');
      const processedOrders = ordersData.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
      }));
      
      // Seed in batches
      for (let i = 0; i < processedOrders.length; i += SEEDING_CONFIG.batchSize) {
        const batch = processedOrders.slice(i, i + SEEDING_CONFIG.batchSize);
        await this.prisma.order.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      
      logger.info('Orders seeded successfully', {
        count: processedOrders.length,
      });
      
      monitoring.recordCounter('database.seeding.orders', processedOrders.length);
      
    } catch (error) {
      logger.error('Failed to seed orders', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Seed reviews
  async seedReviews(): Promise<void> {
    try {
      logger.info('Seeding reviews');
      
      const reviewsData = await this.loadSeedData<SeedReview>('reviews');
      const processedReviews = reviewsData.map(review => ({
        ...review,
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.updatedAt),
      }));
      
      // Seed in batches
      for (let i = 0; i < processedReviews.length; i += SEEDING_CONFIG.batchSize) {
        const batch = processedReviews.slice(i, i + SEEDING_CONFIG.batchSize);
        await this.prisma.review.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      
      logger.info('Reviews seeded successfully', {
        count: processedReviews.length,
      });
      
      monitoring.recordCounter('database.seeding.reviews', processedReviews.length);
      
    } catch (error) {
      logger.error('Failed to seed reviews', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Load seed data from file
  private async loadSeedData<T>(dataType: keyof typeof SEEDING_CONFIG.seedFiles): Promise<T[]> {
    try {
      const filename = SEEDING_CONFIG.seedFiles[dataType];
      const filepath = `${this.seedDataDir}/${filename}`;
      
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content) as T[];
      
      logger.debug('Seed data loaded', {
        dataType,
        filename,
        count: data.length,
      });
      
      return data;
      
    } catch (error) {
      logger.error('Failed to load seed data', {
        dataType,
        error: error.message,
      });
      throw error;
    }
  }

  // Generate sample seed data
  async generateSampleData(): Promise<void> {
    try {
      logger.info('Generating sample seed data');
      
      // Generate users
      const users = this.generateUsers(100);
      await this.saveSeedData('users', users);
      
      // Generate categories
      const categories = this.generateCategories(20);
      await this.saveSeedData('categories', categories);
      
      // Generate products
      const products = this.generateProducts(500, categories);
      await this.saveSeedData('products', products);
      
      // Generate orders
      const orders = this.generateOrders(200, users);
      await this.saveSeedData('orders', orders);
      
      // Generate reviews
      const reviews = this.generateReviews(1000, products, users);
      await this.saveSeedData('reviews', reviews);
      
      logger.info('Sample seed data generated successfully');
      
    } catch (error) {
      logger.error('Failed to generate sample data', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Generate users
  private generateUsers(count: number): SeedUser[] {
    const users: SeedUser[] = [];
    const roles: ('USER' | 'ADMIN' | 'MODERATOR')[] = ['USER', 'ADMIN', 'MODERATOR'];
    
    for (let i = 0; i < count; i++) {
      const id = `user_${i + 1}`;
      const email = `user${i + 1}@example.com`;
      const name = `User ${i + 1}`;
      const password = 'password123'; // This will be hashed during seeding
      const role = roles[Math.floor(Math.random() * roles.length)];
      const emailVerified = Math.random() > 0.1; // 90% verified
      const isActive = Math.random() > 0.05; // 95% active
      const now = new Date();
      
      users.push({
        id,
        email,
        name,
        password,
        role,
        emailVerified,
        isActive,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    
    return users;
  }

  // Generate categories
  private generateCategories(count: number): SeedCategory[] {
    const categories: SeedCategory[] = [];
    const categoryNames = [
      'Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books',
      'Toys', 'Health & Beauty', 'Automotive', 'Food & Beverages', 'Jewelry',
      'Furniture', 'Office Supplies', 'Pet Supplies', 'Baby & Kids', 'Travel',
      'Music & Movies', 'Art & Crafts', 'Tools & Hardware', 'Garden', 'Kitchen'
    ];
    
    for (let i = 0; i < count; i++) {
      const id = `category_${i + 1}`;
      const name = categoryNames[i] || `Category ${i + 1}`;
      const description = `Description for ${name}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const parentId = i > 5 ? `category_${Math.floor(Math.random() * 5) + 1}` : undefined;
      const image = `https://example.com/images/categories/${slug}.jpg`;
      const isActive = Math.random() > 0.1; // 90% active
      const sortOrder = i + 1;
      const now = new Date();
      
      categories.push({
        id,
        name,
        description,
        slug,
        parentId,
        image,
        isActive,
        sortOrder,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    
    return categories;
  }

  // Generate products
  private generateProducts(count: number, categories: SeedCategory[]): SeedProduct[] {
    const products: SeedProduct[] = [];
    const productNames = [
      'Wireless Headphones', 'Smart Watch', 'Laptop', 'Smartphone', 'Tablet',
      'Gaming Console', 'Camera', 'Speaker', 'Monitor', 'Keyboard',
      'Mouse', 'Webcam', 'Microphone', 'Charger', 'Cable',
      'Case', 'Screen Protector', 'Stand', 'Dock', 'Adapter'
    ];
    
    for (let i = 0; i < count; i++) {
      const id = `product_${i + 1}`;
      const name = `${productNames[i % productNames.length]} ${i + 1}`;
      const description = `High-quality ${name} with excellent features and performance.`;
      const price = Math.round((Math.random() * 1000 + 10) * 100) / 100; // $10-$1010
      const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
      const images = [
        `https://example.com/images/products/${id}_1.jpg`,
        `https://example.com/images/products/${id}_2.jpg`,
        `https://example.com/images/products/${id}_3.jpg`
      ];
      const inStock = Math.random() > 0.1; // 90% in stock
      const stockQuantity = inStock ? Math.floor(Math.random() * 100) + 1 : 0;
      const tags = ['premium', 'quality', 'reliable', 'durable', 'innovative'];
      const now = new Date();
      
      products.push({
        id,
        name,
        description,
        price,
        categoryId,
        images,
        inStock,
        stockQuantity,
        tags,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    
    return products;
  }

  // Generate orders
  private generateOrders(count: number, users: SeedUser[]): SeedOrder[] {
    const orders: SeedOrder[] = [];
    const statuses: ('PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED')[] = 
      ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    
    for (let i = 0; i < count; i++) {
      const id = `order_${i + 1}`;
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const total = Math.round((Math.random() * 500 + 10) * 100) / 100; // $10-$510
      const currency = 'USD';
      const shippingAddress = {
        street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      };
      const billingAddress = { ...shippingAddress };
      const now = new Date();
      
      orders.push({
        id,
        userId,
        status,
        total,
        currency,
        shippingAddress,
        billingAddress,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    
    return orders;
  }

  // Generate reviews
  private generateReviews(count: number, products: SeedProduct[], users: SeedUser[]): SeedReview[] {
    const reviews: SeedReview[] = [];
    const titles = [
      'Great product!', 'Excellent quality', 'Highly recommended', 'Good value',
      'Amazing features', 'Perfect for my needs', 'Outstanding performance',
      'Worth every penny', 'Exceeded expectations', 'Fantastic purchase'
    ];
    
    for (let i = 0; i < count; i++) {
      const id = `review_${i + 1}`;
      const productId = products[Math.floor(Math.random() * products.length)].id;
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
      const title = titles[Math.floor(Math.random() * titles.length)];
      const comment = `This is a detailed review for the product. I found it to be ${rating >= 4 ? 'excellent' : 'good'} and would ${rating >= 4 ? 'definitely' : 'probably'} recommend it to others.`;
      const isVerified = Math.random() > 0.3; // 70% verified
      const now = new Date();
      
      reviews.push({
        id,
        productId,
        userId,
        rating,
        title,
        comment,
        isVerified,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    
    return reviews;
  }

  // Save seed data to file
  private async saveSeedData<T>(dataType: string, data: T[]): Promise<void> {
    try {
      const filename = SEEDING_CONFIG.seedFiles[dataType as keyof typeof SEEDING_CONFIG.seedFiles];
      const filepath = `${this.seedDataDir}/${filename}`;
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      
      logger.debug('Seed data saved', {
        dataType,
        filename,
        count: data.length,
      });
      
    } catch (error) {
      logger.error('Failed to save seed data', {
        dataType,
        error: error.message,
      });
      throw error;
    }
  }

  // Get seeding status
  async getSeedingStatus(): Promise<{
    users: number;
    categories: number;
    products: number;
    orders: number;
    reviews: number;
    total: number;
  }> {
    try {
      const [users, categories, products, orders, reviews] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.category.count(),
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.prisma.review.count(),
      ]);
      
      return {
        users,
        categories,
        products,
        orders,
        reviews,
        total: users + categories + products + orders + reviews,
      };
    } catch (error) {
      logger.error('Failed to get seeding status', {
        error: error.message,
      });
      return {
        users: 0,
        categories: 0,
        products: 0,
        orders: 0,
        reviews: 0,
        total: 0,
      };
    }
  }
}

// Create seeding instance
export const databaseSeeding = new DatabaseSeeding(new PrismaClient());

export default databaseSeeding;




