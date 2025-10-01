import { db } from "./db"
import bcrypt from "bcryptjs"

async function seed() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await db.user.upsert({
    where: { email: "admin@neoshop.com" },
    update: {},
    create: {
      email: "admin@neoshop.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  })

  // Create test customer
  const customerPassword = await bcrypt.hash("password123", 12)
  const customer = await db.user.upsert({
    where: { email: "customer@neoshop.com" },
    update: {},
    create: {
      email: "customer@neoshop.com",
      name: "Test Customer",
      password: customerPassword,
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  })

  // Create categories
  const electronics = await db.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Latest electronic devices and gadgets",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500",
    },
  })

  const smartphones = await db.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: {
      name: "Smartphones",
      slug: "smartphones",
      description: "Latest smartphones and mobile devices",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
      parentId: electronics.id,
    },
  })

  const laptops = await db.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      description: "High-performance laptops and notebooks",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
      parentId: electronics.id,
    },
  })

  const clothing = await db.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: {
      name: "Clothing",
      slug: "clothing",
      description: "Fashion and apparel for all seasons",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
    },
  })

  const homeGarden = await db.category.upsert({
    where: { slug: "home-garden" },
    update: {},
    create: {
      name: "Home & Garden",
      slug: "home-garden",
      description: "Everything for your home and garden",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
    },
  })

  // Create products
  const products = [
    {
      name: "iPhone 15 Pro Max",
      slug: "iphone-15-pro-max",
      description: "The most advanced iPhone with titanium design and A17 Pro chip",
      price: 1199,
      originalPrice: 1299,
      sku: "IPH15PM-256-TIT",
      stock: 50,
      images: [
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
      ],
      tags: ["smartphone", "apple", "premium", "new"],
      isFeatured: true,
      categoryId: smartphones.id,
    },
    {
      name: "MacBook Air M3",
      slug: "macbook-air-m3",
      description: "Supercharged by the M3 chip, incredibly thin and light",
      price: 1099,
      sku: "MBA-M3-256-SG",
      stock: 30,
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
      ],
      tags: ["laptop", "apple", "ultrabook", "new"],
      isFeatured: true,
      categoryId: laptops.id,
    },
    {
      name: "AirPods Pro 2",
      slug: "airpods-pro-2",
      description: "Active Noise Cancellation with Adaptive Transparency",
      price: 249,
      originalPrice: 279,
      sku: "APP2-USB-C",
      stock: 100,
      images: [
        "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800",
        "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800",
      ],
      tags: ["audio", "apple", "wireless", "sale"],
      isFeatured: true,
      categoryId: electronics.id,
    },
    {
      name: 'iPad Pro 12.9"',
      slug: "ipad-pro-12-9",
      description: "The ultimate iPad experience with M2 chip",
      price: 1099,
      sku: "IPP-129-M2-256",
      stock: 25,
      images: [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
        "https://images.unsplash.com/photo-1561154464-82ee9adf27f2?w=800",
      ],
      tags: ["tablet", "apple", "creative", "new"],
      isFeatured: true,
      categoryId: electronics.id,
    },
    {
      name: "Premium Cotton T-Shirt",
      slug: "premium-cotton-t-shirt",
      description: "Soft and comfortable cotton t-shirt in various colors",
      price: 29.99,
      sku: "SHIRT-001",
      stock: 200,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800",
      ],
      tags: ["clothing", "t-shirt", "cotton", "casual"],
      isFeatured: false,
      categoryId: clothing.id,
    },
    {
      name: "Ergonomic Office Chair",
      slug: "ergonomic-office-chair",
      description: "Comfortable office chair with lumbar support",
      price: 299.99,
      originalPrice: 399.99,
      sku: "CHAIR-001",
      stock: 25,
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
      ],
      tags: ["furniture", "office", "ergonomic", "chair"],
      isFeatured: true,
      categoryId: homeGarden.id,
    },
  ]

  const createdProducts = []
  for (const product of products) {
    const createdProduct = await db.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    })
    createdProducts.push(createdProduct)
  }

  // Create sample order
  const order = await db.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      status: "PENDING",
      total: 1448.99,
      subtotal: 1348.99,
      tax: 108.00,
      shipping: 12.00,
      userId: customer.id,
      shippingAddress: {
        firstName: "John",
        lastName: "Doe",
        address1: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US",
        phone: "+1234567890",
      },
      billingAddress: {
        firstName: "John",
        lastName: "Doe",
        address1: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US",
        phone: "+1234567890",
      },
      items: {
        create: [
          {
            productId: createdProducts[0]!.id,
            quantity: 1,
            price: createdProducts[0]!.price,
          },
          {
            productId: createdProducts[1]!.id,
            quantity: 1,
            price: createdProducts[1]!.price,
          },
        ],
      },
    },
  })

  // Create sample reviews
  await db.review.createMany({
    data: [
      {
        userId: customer.id,
        productId: createdProducts[0]!.id,
        rating: 5,
        comment: "Excellent phone, very fast and reliable!",
      },
      {
        userId: customer.id,
        productId: createdProducts[1]!.id,
        rating: 4,
        comment: "Great laptop, perfect for work and entertainment.",
      },
    ],
  })

  console.log("✅ Database seeded successfully!")
  console.log(`👤 Created admin user: ${admin.email}`)
  console.log(`👤 Created customer user: ${customer.email}`)
  console.log(`📦 Created 5 categories`)
  console.log(`🛍️ Created ${products.length} products`)
  console.log(`📋 Created 1 sample order`)
  console.log(`⭐ Created 2 sample reviews`)
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
