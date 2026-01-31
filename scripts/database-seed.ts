#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()

interface SeedData {
  categories: any[]
  products: any[]
  users: any[]
  adminUsers: any[]
}

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...')

    // Check if data already exists
    const existingData = await checkExistingData()
    if (existingData.hasData) {
      logger.warn('Database already contains data. Skipping seeding.')
      return
    }

    // Generate seed data
    const seedData = await generateSeedData()

    // Seed categories
    logger.info('Seeding categories...')
    await seedCategories(seedData.categories)

    // Seed users
    logger.info('Seeding users...')
    await seedUsers(seedData.users)

    // Seed admin users
    logger.info('Seeding admin users...')
    await seedAdminUsers(seedData.adminUsers)

    // Seed products
    logger.info('Seeding products...')
    await seedProducts(seedData.products)

    // Create sample orders
    logger.info('Creating sample orders...')
    await createSampleOrders()

    // Create sample reviews
    logger.info('Creating sample reviews...')
    await createSampleReviews()

    logger.info('Database seeding completed successfully!')
  } catch (error) {
    logger.error('Database seeding failed:', {}, error instanceof Error ? error : new Error(String(error)))
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function checkExistingData() {
  const [userCount, productCount, categoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
  ])

  return {
    hasData: userCount > 0 || productCount > 0 || categoryCount > 0,
    userCount,
    productCount,
    categoryCount,
  }
}

async function generateSeedData(): Promise<SeedData> {
  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest electronic devices and gadgets',
      image: '/images/categories/electronics.jpg',
      isActive: true,
    },
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel for all seasons',
      image: '/images/categories/clothing.jpg',
      isActive: true,
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Everything for your home and garden',
      image: '/images/categories/home-garden.jpg',
      isActive: true,
    },
    {
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      description: 'Sports equipment and fitness gear',
      image: '/images/categories/sports-fitness.jpg',
      isActive: true,
    },
    {
      name: 'Books & Media',
      slug: 'books-media',
      description: 'Books, movies, music and digital media',
      image: '/images/categories/books-media.jpg',
      isActive: true,
    },
    {
      name: 'Health & Beauty',
      slug: 'health-beauty',
      description: 'Health and beauty products',
      image: '/images/categories/health-beauty.jpg',
      isActive: true,
    },
  ]

  const users = Array.from({ length: 50 }, (_, i) => ({
    email: `user${i + 1}@example.com`,
    name: `User ${i + 1}`,
    password: 'password123',
    emailVerified: new Date(),
    isActive: true,
    role: 'USER' as const,
  }))

  const adminUsers = [
    {
      email: 'admin@zyra-ultra.com',
      name: 'Admin User',
      password: 'admin123',
      emailVerified: new Date(),
      isActive: true,
      role: 'ADMIN' as const,
    },
    {
      email: 'superadmin@zyra-ultra.com',
      name: 'Super Admin',
      password: 'superadmin123',
      emailVerified: new Date(),
      isActive: true,
      role: 'SUPER_ADMIN' as const,
    },
  ]

  const products = [
    // Electronics
    {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'Latest iPhone with advanced camera system and A17 Pro chip',
      price: 999.99,
      comparePrice: 1099.99,
      sku: 'IPH15PRO-256',
      stock: 50,
      categoryId: 1, // Will be updated after categories are created
      images: [
        '/images/products/iphone-15-pro-1.jpg',
        '/images/products/iphone-15-pro-2.jpg',
        '/images/products/iphone-15-pro-3.jpg',
      ],
      isActive: true,
      isFeatured: true,
      weight: 0.187,
      dimensions: '14.67 x 7.15 x 0.83 cm',
    },
    {
      name: 'MacBook Pro 16"',
      slug: 'macbook-pro-16',
      description: 'Powerful laptop with M3 Pro chip and Liquid Retina XDR display',
      price: 2499.99,
      comparePrice: 2699.99,
      sku: 'MBP16-M3PRO-512',
      stock: 25,
      categoryId: 1,
      images: [
        '/images/products/macbook-pro-16-1.jpg',
        '/images/products/macbook-pro-16-2.jpg',
      ],
      isActive: true,
      isFeatured: true,
      weight: 2.16,
      dimensions: '35.57 x 24.81 x 1.68 cm',
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      slug: 'sony-wh-1000xm5',
      description: 'Industry-leading noise canceling wireless headphones',
      price: 399.99,
      comparePrice: 449.99,
      sku: 'SONY-WH1000XM5',
      stock: 100,
      categoryId: 1,
      images: [
        '/images/products/sony-wh-1000xm5-1.jpg',
        '/images/products/sony-wh-1000xm5-2.jpg',
      ],
      isActive: true,
      isFeatured: false,
      weight: 0.25,
      dimensions: '27.0 x 20.0 x 7.0 cm',
    },
    // Clothing
    {
      name: 'Classic White T-Shirt',
      slug: 'classic-white-tshirt',
      description: 'Premium cotton t-shirt in classic white',
      price: 29.99,
      comparePrice: 39.99,
      sku: 'TSHIRT-WHITE-M',
      stock: 200,
      categoryId: 2,
      images: [
        '/images/products/white-tshirt-1.jpg',
        '/images/products/white-tshirt-2.jpg',
      ],
      isActive: true,
      isFeatured: false,
      weight: 0.2,
      dimensions: '30 x 25 x 2 cm',
    },
    {
      name: 'Denim Jacket',
      slug: 'denim-jacket',
      description: 'Classic blue denim jacket with vintage wash',
      price: 89.99,
      comparePrice: 119.99,
      sku: 'JACKET-DENIM-L',
      stock: 75,
      categoryId: 2,
      images: [
        '/images/products/denim-jacket-1.jpg',
        '/images/products/denim-jacket-2.jpg',
      ],
      isActive: true,
      isFeatured: true,
      weight: 0.8,
      dimensions: '35 x 30 x 5 cm',
    },
    // Home & Garden
    {
      name: 'Smart Home Hub',
      slug: 'smart-home-hub',
      description: 'Central hub for controlling all your smart home devices',
      price: 199.99,
      comparePrice: 249.99,
      sku: 'SMART-HUB-V2',
      stock: 30,
      categoryId: 3,
      images: [
        '/images/products/smart-hub-1.jpg',
        '/images/products/smart-hub-2.jpg',
      ],
      isActive: true,
      isFeatured: true,
      weight: 0.5,
      dimensions: '15 x 15 x 5 cm',
    },
    // Sports & Fitness
    {
      name: 'Yoga Mat Pro',
      slug: 'yoga-mat-pro',
      description: 'Premium non-slip yoga mat with carrying strap',
      price: 79.99,
      comparePrice: 99.99,
      sku: 'YOGA-MAT-PRO',
      stock: 150,
      categoryId: 4,
      images: [
        '/images/products/yoga-mat-1.jpg',
        '/images/products/yoga-mat-2.jpg',
      ],
      isActive: true,
      isFeatured: false,
      weight: 1.2,
      dimensions: '183 x 61 x 0.6 cm',
    },
    // Books & Media
    {
      name: 'The Great Gatsby',
      slug: 'the-great-gatsby',
      description: 'Classic American novel by F. Scott Fitzgerald',
      price: 12.99,
      comparePrice: 15.99,
      sku: 'BOOK-GATSBY',
      stock: 500,
      categoryId: 5,
      images: [
        '/images/products/great-gatsby-1.jpg',
      ],
      isActive: true,
      isFeatured: false,
      weight: 0.3,
      dimensions: '20 x 13 x 2 cm',
    },
    // Health & Beauty
    {
      name: 'Vitamin C Serum',
      slug: 'vitamin-c-serum',
      description: 'Anti-aging vitamin C serum for radiant skin',
      price: 49.99,
      comparePrice: 69.99,
      sku: 'SERUM-VITC-30ML',
      stock: 80,
      categoryId: 6,
      images: [
        '/images/products/vitamin-c-serum-1.jpg',
        '/images/products/vitamin-c-serum-2.jpg',
      ],
      isActive: true,
      isFeatured: false,
      weight: 0.1,
      dimensions: '8 x 3 x 3 cm',
    },
  ]

  return { categories, users, adminUsers, products }
}

async function seedCategories(categories: any[]) {
  for (const category of categories) {
    await prisma.category.create({
      data: category,
    })
  }
  logger.info(`Created ${categories.length} categories`)
}

async function seedUsers(users: any[]) {
  for (const user of users) {
    const hashedPassword = await hash(user.password, 12)
    await prisma.user.create({
      data: {
        ...user,
        password: hashedPassword,
      },
    })
  }
  logger.info(`Created ${users.length} users`)
}

async function seedAdminUsers(adminUsers: any[]) {
  for (const admin of adminUsers) {
    const hashedPassword = await hash(admin.password, 12)
    await prisma.user.create({
      data: {
        ...admin,
        password: hashedPassword,
      },
    })
  }
  logger.info(`Created ${adminUsers.length} admin users`)
}

async function seedProducts(products: any[]) {
  // Get category IDs
  const categories = await prisma.category.findMany()
  const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]))

  for (const product of products) {
    // Update category ID based on category name
    let categoryId = product.categoryId
    if (categoryId === 1) categoryId = categoryMap.get('Electronics') || 1
    else if (categoryId === 2) categoryId = categoryMap.get('Clothing') || 2
    else if (categoryId === 3) categoryId = categoryMap.get('Home & Garden') || 3
    else if (categoryId === 4) categoryId = categoryMap.get('Sports & Fitness') || 4
    else if (categoryId === 5) categoryId = categoryMap.get('Books & Media') || 5
    else if (categoryId === 6) categoryId = categoryMap.get('Health & Beauty') || 6

    await prisma.product.create({
      data: {
        ...product,
        categoryId,
      },
    })
  }
  logger.info(`Created ${products.length} products`)
}

async function createSampleOrders() {
  const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 10 })
  const products = await prisma.product.findMany({ take: 20 })

  if (users.length === 0 || products.length === 0) {
    logger.warn('No users or products found for creating sample orders')
    return
  }

  const orders = []
  for (let i = 0; i < 25; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const product = products[Math.floor(Math.random() * products.length)]
    
    if (!user || !product) continue
    
    const quantity = Math.floor(Math.random() * 3) + 1
    const status = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'][
      Math.floor(Math.random() * 5)
    ] as any

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i}`,
        userId: user.id,
        status,
        total: product.price * quantity,
        subtotal: product.price * quantity,
        tax: 0,
        shipping: 0,
        shippingAddress: {
          street: `${Math.floor(Math.random() * 9999)} Main St`,
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        billingAddress: {
          street: `${Math.floor(Math.random() * 9999)} Main St`,
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        items: {
          create: {
            productId: product.id,
            quantity,
            price: product.price,
          },
        },
      },
    })

    orders.push(order)
  }

  logger.info(`Created ${orders.length} sample orders`)
}

async function createSampleReviews() {
  const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 20 })
  const products = await prisma.product.findMany({ take: 15 })

  if (users.length === 0 || products.length === 0) {
    logger.warn('No users or products found for creating sample reviews')
    return
  }

  const reviews = []
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const product = products[Math.floor(Math.random() * products.length)]
    
    if (!user || !product) continue
    
    const rating = Math.floor(Math.random() * 5) + 1

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating,
        comment: `This is a sample review for ${product.name}. ${rating >= 4 ? 'Great product!' : 'Could be better.'}`,
      },
    })

    reviews.push(review)
  }

  logger.info(`Created ${reviews.length} sample reviews`)
}

// CLI interface
async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'seed':
        await seedDatabase()
        break

      case 'reset':
        logger.info('Resetting database...')
        await prisma.$executeRaw`TRUNCATE TABLE "Review", "OrderItem", "Order", "CartItem", "WishlistItem", "Product", "Category", "User" RESTART IDENTITY CASCADE`
        await seedDatabase()
        break

      case 'check':
        const data = await checkExistingData()
        console.log('Database status:', data)
        break

      default:
        console.log(`
Database Seeding Tool

Usage:
  npm run db:seed seed     Seed the database with sample data
  npm run db:seed reset    Reset and seed the database
  npm run db:seed check    Check if database has data
        `)
    }
  } catch (error) {
    logger.error('Seeding operation failed:', {}, error instanceof Error ? error : new Error(String(error)))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { seedDatabase, checkExistingData, generateSeedData }


