import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { generateSitemapData } from '@/lib/seo'

export async function GET(request: NextRequest) {
  try {
    // Get all products
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })

    // Get all categories
    const categories = await db.category.findMany({
      // Note: Category model doesn't have isActive or updatedAt field
      select: { slug: true },
    })

    // Get all pages
    const pages = [
      { url: '/', lastModified: new Date().toISOString(), changeFrequency: 'daily' as const, priority: 1.0 },
      { url: '/products', lastModified: new Date().toISOString(), changeFrequency: 'daily' as const, priority: 0.9 },
      { url: '/categories', lastModified: new Date().toISOString(), changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: '/about', lastModified: new Date().toISOString(), changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: '/contact', lastModified: new Date().toISOString(), changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: '/privacy', lastModified: new Date().toISOString(), changeFrequency: 'yearly' as const, priority: 0.3 },
      { url: '/terms', lastModified: new Date().toISOString(), changeFrequency: 'yearly' as const, priority: 0.3 },
    ]

    // Add product pages
    products.forEach(product => {
      pages.push({
        url: `/products/${product.slug}`,
        lastModified: product.updatedAt.toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })
    })

    // Add category pages
    categories.forEach(category => {
      pages.push({
        url: `/categories/${category.slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })
    })

    // Generate sitemap
    const sitemap = generateSitemapData(pages)

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    )
  }
}

