import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZYRA Fashion database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zyra-fashion.com' },
    update: {},
    create: {
      email: 'admin@zyra-fashion.com',
      name: 'ZYRA Admin',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@zyra-fashion.com' },
    update: {},
    create: {
      email: 'customer@zyra-fashion.com',
      name: 'Fashion Lover',
      password: customerPassword,
      role: 'CUSTOMER',
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log('✅ Created customer user:', customer.email);

  // Create Categories for Women's Fashion
  const categories = [
    {
      name: 'Dresses',
      slug: 'dresses',
      description: 'Elegant dresses for every occasion - from casual to formal',
      image: '/placeholder.jpg',
    },
    {
      name: 'Tops',
      slug: 'tops',
      description: 'Stylish tops, blouses, and shirts for modern women',
      image: '/placeholder.jpg',
    },
    {
      name: 'Bottoms',
      slug: 'bottoms',
      description: 'Premium pants, skirts, and shorts',
      image: '/placeholder.jpg',
    },
    {
      name: 'Outerwear',
      slug: 'outerwear',
      description: 'Coats, jackets, and blazers for every season',
      image: '/placeholder.jpg',
    },
    {
      name: 'Activewear',
      slug: 'activewear',
      description: 'Fashion-forward fitness and athleisure wear',
      image: '/placeholder.jpg',
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Complete your look with our curated accessories',
      image: '/placeholder.jpg',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    console.log(`✅ Created category: ${category.name}`);
  }

  // Create Products - Dresses
  const dressProducts = [
    {
      name: 'Elegant Floral Maxi Dress',
      slug: 'elegant-floral-maxi-dress',
      description: 'Beautiful flowing maxi dress with delicate floral print. Perfect for summer events and garden parties. Features adjustable straps and a flattering V-neckline.',
      price: 89.99,
      originalPrice: 129.99,
      categorySlug: 'dresses',
      inStock: true,
      stockQuantity: 50,
      featured: true,
      rating: 4.8,
      reviewCount: 127,
      images: ['/placeholder.jpg'],
      tags: ['summer', 'floral', 'maxi', 'elegant'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Floral Pink', 'Floral Blue', 'Floral White'],
      }),
    },
    {
      name: 'Classic Little Black Dress',
      slug: 'classic-little-black-dress',
      description: 'Timeless little black dress that every wardrobe needs. Versatile design works for office, dinner, or cocktail events. Made from premium stretch fabric.',
      price: 79.99,
      originalPrice: 119.99,
      categorySlug: 'dresses',
      inStock: true,
      stockQuantity: 75,
      featured: true,
      rating: 4.9,
      reviewCount: 203,
      images: ['/placeholder.jpg'],
      tags: ['classic', 'versatile', 'evening', 'essential'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black'],
      }),
    },
    {
      name: 'Boho Midi Wrap Dress',
      slug: 'boho-midi-wrap-dress',
      description: 'Effortlessly chic wrap dress with bohemian flair. Features adjustable tie waist and flowing midi length. Perfect for casual summer days.',
      price: 69.99,
      originalPrice: 99.99,
      categorySlug: 'dresses',
      inStock: true,
      stockQuantity: 60,
      featured: false,
      rating: 4.7,
      reviewCount: 89,
      images: ['/placeholder.jpg'],
      tags: ['boho', 'midi', 'casual', 'summer'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Terracotta', 'Sage Green', 'Dusty Rose'],
      }),
    },
  ];

  // Create Products - Tops
  const topProducts = [
    {
      name: 'Silk Satin Blouse',
      slug: 'silk-satin-blouse',
      description: 'Luxurious silk satin blouse with elegant drape. Features button-front closure and French cuffs. Perfect for professional and evening wear.',
      price: 59.99,
      originalPrice: 89.99,
      categorySlug: 'tops',
      inStock: true,
      stockQuantity: 80,
      featured: true,
      rating: 4.6,
      reviewCount: 145,
      images: ['/placeholder.jpg'],
      tags: ['silk', 'professional', 'elegant', 'luxury'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Ivory', 'Black', 'Blush', 'Navy'],
      }),
    },
    {
      name: 'Relaxed Cotton T-Shirt',
      slug: 'relaxed-cotton-tshirt',
      description: 'Premium soft cotton tee in a relaxed fit. Versatile essential that pairs with everything. Sustainable and comfortable.',
      price: 29.99,
      originalPrice: 39.99,
      categorySlug: 'tops',
      inStock: true,
      stockQuantity: 150,
      featured: false,
      rating: 4.8,
      reviewCount: 312,
      images: ['/placeholder.jpg'],
      tags: ['casual', 'essential', 'cotton', 'comfortable'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: ['White', 'Black', 'Gray', 'Navy', 'Blush'],
      }),
    },
    {
      name: 'Off-Shoulder Crop Top',
      slug: 'off-shoulder-crop-top',
      description: 'Trendy off-shoulder crop top with smocked elastic neckline. Perfect for summer outfits. Pairs beautifully with high-waisted bottoms.',
      price: 39.99,
      originalPrice: 54.99,
      categorySlug: 'tops',
      inStock: true,
      stockQuantity: 95,
      featured: false,
      rating: 4.5,
      reviewCount: 167,
      images: ['/placeholder.jpg'],
      tags: ['trendy', 'summer', 'crop', 'casual'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['White', 'Black', 'Red', 'Yellow'],
      }),
    },
  ];

  // Create Products - Bottoms
  const bottomProducts = [
    {
      name: 'High-Waisted Wide Leg Pants',
      slug: 'high-waisted-wide-leg-pants',
      description: 'Flattering high-waisted pants with elegant wide leg. Made from premium fabric with perfect drape. Professional yet comfortable.',
      price: 69.99,
      originalPrice: 99.99,
      categorySlug: 'bottoms',
      inStock: true,
      stockQuantity: 70,
      featured: true,
      rating: 4.7,
      reviewCount: 198,
      images: ['/placeholder.jpg'],
      tags: ['professional', 'elegant', 'wide-leg', 'high-waist'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black', 'Navy', 'Beige', 'Gray'],
      }),
    },
    {
      name: 'Classic Denim Jeans',
      slug: 'classic-denim-jeans',
      description: 'Perfect-fit jeans in premium stretch denim. Classic 5-pocket styling with modern skinny fit. Comfortable all-day wear.',
      price: 79.99,
      originalPrice: 109.99,
      categorySlug: 'bottoms',
      inStock: true,
      stockQuantity: 120,
      featured: true,
      rating: 4.9,
      reviewCount: 456,
      images: ['/placeholder.jpg'],
      tags: ['denim', 'classic', 'essential', 'casual'],
      variants: JSON.stringify({
        sizes: ['24', '25', '26', '27', '28', '29', '30', '31', '32'],
        colors: ['Dark Wash', 'Medium Wash', 'Light Wash', 'Black'],
      }),
    },
    {
      name: 'Pleated Midi Skirt',
      slug: 'pleated-midi-skirt',
      description: 'Romantic pleated skirt in flowing midi length. Elastic waistband for comfort. Pairs beautifully with tucked-in tops.',
      price: 54.99,
      originalPrice: 74.99,
      categorySlug: 'bottoms',
      inStock: true,
      stockQuantity: 85,
      featured: false,
      rating: 4.6,
      reviewCount: 134,
      images: ['/placeholder.jpg'],
      tags: ['midi', 'pleated', 'feminine', 'versatile'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black', 'Navy', 'Blush', 'Burgundy'],
      }),
    },
  ];

  // Create Products - Outerwear
  const outerwearProducts = [
    {
      name: 'Oversized Blazer',
      slug: 'oversized-blazer',
      description: 'Modern oversized blazer with structured shoulders. Perfect for layering over any outfit. Professional yet effortlessly cool.',
      price: 129.99,
      originalPrice: 179.99,
      categorySlug: 'outerwear',
      inStock: true,
      stockQuantity: 45,
      featured: true,
      rating: 4.8,
      reviewCount: 156,
      images: ['/placeholder.jpg'],
      tags: ['blazer', 'professional', 'oversized', 'modern'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black', 'Camel', 'Gray', 'Navy'],
      }),
    },
    {
      name: 'Leather Moto Jacket',
      slug: 'leather-moto-jacket',
      description: 'Classic moto jacket in premium vegan leather. Features asymmetric zip, belt detail, and multiple pockets. Timeless edge.',
      price: 159.99,
      originalPrice: 229.99,
      categorySlug: 'outerwear',
      inStock: true,
      stockQuantity: 35,
      featured: true,
      rating: 4.9,
      reviewCount: 289,
      images: ['/placeholder.jpg'],
      tags: ['leather', 'moto', 'edgy', 'classic'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black', 'Brown'],
      }),
    },
  ];

  // Create Products - Activewear
  const activewearProducts = [
    {
      name: 'High-Performance Leggings',
      slug: 'high-performance-leggings',
      description: 'Premium activewear leggings with moisture-wicking technology. High-waisted with phone pocket. Perfect for yoga, gym, or casual wear.',
      price: 49.99,
      originalPrice: 69.99,
      categorySlug: 'activewear',
      inStock: true,
      stockQuantity: 200,
      featured: true,
      rating: 4.8,
      reviewCount: 523,
      images: ['/placeholder.jpg'],
      tags: ['activewear', 'leggings', 'fitness', 'comfortable'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black', 'Navy', 'Burgundy', 'Olive'],
      }),
    },
    {
      name: 'Sports Bra Set',
      slug: 'sports-bra-set',
      description: 'Supportive sports bra with matching leggings. Breathable fabric with four-way stretch. Complete activewear set.',
      price: 69.99,
      originalPrice: 94.99,
      categorySlug: 'activewear',
      inStock: true,
      stockQuantity: 150,
      featured: false,
      rating: 4.7,
      reviewCount: 267,
      images: ['/placeholder.jpg'],
      tags: ['activewear', 'set', 'sports-bra', 'fitness'],
      variants: JSON.stringify({
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black', 'Pink', 'Blue', 'Purple'],
      }),
    },
  ];

  // Combine all products
  const allProducts = [
    ...dressProducts,
    ...topProducts,
    ...bottomProducts,
    ...outerwearProducts,
    ...activewearProducts,
  ];

  // Create products
  for (const productData of allProducts) {
    const category = await prisma.category.findUnique({
      where: { slug: productData.categorySlug },
    });

    if (category) {
      await prisma.product.upsert({
        where: { slug: productData.slug },
        update: {},
        create: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          originalPrice: productData.originalPrice,
          sku: `SKU-${productData.slug.toUpperCase()}`,
          categoryId: category.id,
          stock: productData.stockQuantity,
          isFeatured: productData.featured,
          images: productData.images,
          tags: productData.tags,
        },
      });
      console.log(`✅ Created product: ${productData.name}`);
    }
  }

  console.log('✨ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('- Admin User: admin@zyra-fashion.com (password: admin123)');
  console.log('- Test Customer: customer@zyra-fashion.com (password: customer123)');
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Products: ${allProducts.length}`);
  console.log('\n🚀 You can now start the development server!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

