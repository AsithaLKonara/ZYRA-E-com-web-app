import { db } from './db-connection'
import { logger } from './logger'
import { config } from './config'
import bcrypt from 'bcryptjs'

// Seeding configuration
const seedingConfig = {
  maxRetries: 3,
  batchSize: 100,
  delayBetweenBatches: 100, // ms
}

// Seed data interfaces
interface SeedData {
  users: any[]
  categories: any[]
  products: any[]
  orders: any[]
  reviews: any[]
}

// Database seeding class
class DatabaseSeeding {
  private seedData: SeedData = {
    users: [],
    categories: [],
    products: [],
    orders: [],
    reviews: [],
  }

  // Initialize seed data
  private async initializeSeedData(): Promise<void> {
    // Admin user
    const adminPassword = await bcrypt.hash('admin123!@#', 12)
    const adminUser = {
      email: 'admin@zyra-fashion.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    }

    // Test customer
    const customerPassword = await bcrypt.hash('password123', 12)
    const customerUser = {
      email: 'customer@neoshop.com',
      name: 'Test Customer',
      password: customerPassword,
      role: 'CUSTOMER',
      emailVerified: new Date(),
      isActive: true,
    }

    this.seedData.users = [adminUser, customerUser]

    // Categories
    this.seedData.categories = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest electronic devices and gadgets',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
      },
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Latest smartphones and mobile devices',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'High-performance laptops and notebooks',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel for all seasons',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Everything for your home and garden',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
      },
    ]

    // Products
    this.seedData.products = [
      {
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        description: 'The most advanced iPhone with titanium design and A17 Pro chip',
        price: 1199,
        originalPrice: 1299,
        sku: 'IPH15PM-256-TIT',
        stock: 50,
        images: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
        ],
        tags: ['smartphone', 'apple', 'premium', 'new'],
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'MacBook Air M3',
        slug: 'macbook-air-m3',
        description: 'Supercharged by the M3 chip, incredibly thin and light',
        price: 1099,
        sku: 'MBA-M3-256-SG',
        stock: 30,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
        ],
        tags: ['laptop', 'apple', 'ultrabook', 'new'],
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'AirPods Pro 2',
        slug: 'airpods-pro-2',
        description: 'Active Noise Cancellation with Adaptive Transparency',
        price: 249,
        originalPrice: 279,
        sku: 'APP2-USB-C',
        stock: 100,
        images: [
          'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800',
          'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800',
        ],
        tags: ['audio', 'apple', 'wireless', 'sale'],
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        description: 'Soft and comfortable cotton t-shirt in various colors',
        price: 29.99,
        sku: 'SHIRT-001',
        stock: 200,
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800',
        ],
        tags: ['clothing', 't-shirt', 'cotton', 'casual'],
        isActive: true,
        isFeatured: false,
      },
      {
        name: 'Ergonomic Office Chair',
        slug: 'ergonomic-office-chair',
        description: 'Comfortable office chair with lumbar support',
        price: 299.99,
        originalPrice: 399.99,
        sku: 'CHAIR-001',
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
        ],
        tags: ['furniture', 'office', 'ergonomic', 'chair'],
        isActive: true,
        isFeatured: true,
      },
    ]

    // Orders
    this.seedData.orders = [
      {
        orderNumber: `ORD-${Date.now()}`,
        status: 'PENDING',
        total: 1448.99,
        subtotal: 1348.99,
        tax: 108.00,
        shipping: 12.00,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          phone: '+1234567890',
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          phone: '+1234567890',
        },
      },
    ]

    // Reviews
    this.seedData.reviews = [
      {
        rating: 5,
        comment: 'Excellent phone, very fast and reliable!',
      },
      {
        rating: 4,
        comment: 'Great laptop, perfect for work and entertainment.',
      },
    ]
  }

  // Seed users
  private async seedUsers(): Promise<void> {
    logger.info('Seeding users...')
    
    for (const userData of this.seedData.users) {
      await db.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData,
      })
    }
    
    logger.info(`Seeded ${this.seedData.users.length} users`)
  }

  // Seed categories
  private async seedCategories(): Promise<void> {
    logger.info('Seeding categories...')
    
    for (const categoryData of this.seedData.categories) {
      await db.category.upsert({
        where: { slug: categoryData.slug },
        update: {},
        create: categoryData,
      })
    }
    
    logger.info(`Seeded ${this.seedData.categories.length} categories`)
  }

  // Seed products
  private async seedProducts(): Promise<void> {
    logger.info('Seeding products...')
    
    // Get categories for product assignment
    const categories = await db.category.findMany()
    const electronics = categories.find(c => c.slug === 'electronics')
    const smartphones = categories.find(c => c.slug === 'smartphones')
    const laptops = categories.find(c => c.slug === 'laptops')
    const clothing = categories.find(c => c.slug === 'clothing')
    const homeGarden = categories.find(c => c.slug === 'home-garden')

    const productsWithCategories = [
      { ...this.seedData.products[0], categoryId: smartphones?.id },
      { ...this.seedData.products[1], categoryId: laptops?.id },
      { ...this.seedData.products[2], categoryId: electronics?.id },
      { ...this.seedData.products[3], categoryId: clothing?.id },
      { ...this.seedData.products[4], categoryId: homeGarden?.id },
    ]

    for (const productData of productsWithCategories) {
      await db.product.upsert({
        where: { sku: productData.sku },
        update: {},
        create: productData,
      })
    }
    
    logger.info(`Seeded ${productsWithCategories.length} products`)
  }

  // Seed orders
  private async seedOrders(): Promise<void> {
    logger.info('Seeding orders...')
    
    const customer = await db.user.findFirst({ where: { role: 'CUSTOMER' } })
    const products = await db.product.findMany({ take: 2 })

    if (customer && products.length >= 2) {
      const orderData = {
        ...this.seedData.orders[0],
        userId: customer.id,
        items: {
          create: [
            {
              productId: products[0]!.id,
              quantity: 1,
              price: products[0]!.price,
            },
            {
              productId: products[1]!.id,
              quantity: 1,
              price: products[1]!.price,
            },
          ],
        },
      }

      await db.order.create({ data: orderData })
      logger.info('Seeded 1 order')
    }
  }

  // Seed reviews
  private async seedReviews(): Promise<void> {
    logger.info('Seeding reviews...')
    
    const customer = await db.user.findFirst({ where: { role: 'CUSTOMER' } })
    const products = await db.product.findMany({ take: 2 })

    if (customer && products.length >= 2) {
      const reviewsData = [
        {
          ...this.seedData.reviews[0],
          userId: customer.id,
          productId: products[0]!.id,
        },
        {
          ...this.seedData.reviews[1],
          userId: customer.id,
          productId: products[1]!.id,
        },
      ]

      for (const reviewData of reviewsData) {
        await db.review.create({ data: reviewData })
      }
      
      logger.info(`Seeded ${reviewsData.length} reviews`)
    }
  }

  // Clear existing data
  private async clearData(): Promise<void> {
    logger.info('Clearing existing data...')
    
    // Delete in reverse order of dependencies
    await db.review.deleteMany()
    await db.orderItem.deleteMany()
    await db.order.deleteMany()
    await db.wishlistItem.deleteMany()
    await db.cartItem.deleteMany()
    await db.product.deleteMany()
    await db.category.deleteMany()
    await db.user.deleteMany()
    
    logger.info('Existing data cleared')
  }

  // Run full seeding process
  async seed(): Promise<{
    success: boolean
    errors: string[]
    stats: {
      users: number
      categories: number
      products: number
      orders: number
      reviews: number
    }
  }> {
    const result = {
      success: true,
      errors: [] as string[],
      stats: {
        users: 0,
        categories: 0,
        products: 0,
        orders: 0,
        reviews: 0,
      },
    }

    try {
      logger.info('Starting database seeding...')
      
      // Initialize seed data
      await this.initializeSeedData()
      
      // Clear existing data
      await this.clearData()
      
      // Seed data in order
      await this.seedUsers()
      await this.seedCategories()
      await this.seedProducts()
      await this.seedOrders()
      await this.seedReviews()
      
      // Get final counts
      result.stats.users = await db.user.count()
      result.stats.categories = await db.category.count()
      result.stats.products = await db.product.count()
      result.stats.orders = await db.order.count()
      result.stats.reviews = await db.review.count()
      
      logger.info('Database seeding completed successfully')
      
    } catch (error) {
      logger.error('Database seeding failed:', {}, error instanceof Error ? error : new Error(String(error)))
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  // Check if database is already seeded
  async isSeeded(): Promise<boolean> {
    try {
      const userCount = await db.user.count()
      const productCount = await db.product.count()
      const categoryCount = await db.category.count()
      
      return userCount > 0 && productCount > 0 && categoryCount > 0
    } catch (error) {
      logger.error('Failed to check seeding status:', {}, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }
}

// Database seeding instance
export const dbSeeding = new DatabaseSeeding()

// Export seeding functions
export const seedingUtils = {
  seed: () => dbSeeding.seed(),
  isSeeded: () => dbSeeding.isSeeded(),
}


