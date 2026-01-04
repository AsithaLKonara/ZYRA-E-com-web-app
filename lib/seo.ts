import { Metadata } from 'next'
import { Product, Category } from '@prisma/client'

// SEO configuration
const seoConfig = {
  siteName: 'NEOSHOP ULTRA',
  siteUrl: process.env.NEXTAUTH_URL || 'https://neoshop-ultra.com',
  defaultTitle: 'NEOSHOP ULTRA - Ultra-Modern E-commerce Platform',
  defaultDescription: 'Discover the latest products with NEOSHOP ULTRA. Fast, secure, and modern e-commerce experience with cutting-edge technology.',
  defaultKeywords: 'e-commerce, online shopping, modern, fast, secure, products, technology',
  twitterHandle: '@neoshopultra',
  facebookAppId: process.env.FACEBOOK_APP_ID,
  googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
  googleTagManagerId: process.env.GOOGLE_TAG_MANAGER_ID,
}

// Generate structured data for products
export function generateProductStructuredData(product: Product & { category?: Category }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.[0] || `${seoConfig.siteUrl}/images/placeholder.jpg`,
    brand: {
      '@type': 'Brand',
      name: seoConfig.siteName,
    },
    category: product.category?.name || 'General',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: seoConfig.siteName,
      },
    },
    // Note: Rating data would need to be calculated from reviews table
    // aggregateRating: {
    //   '@type': 'AggregateRating',
    //   ratingValue: averageRating,
    //   reviewCount: reviewCount,
    // },
  }
}

// Generate structured data for categories
export function generateCategoryStructuredData(category: Category & { products?: Product[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `${seoConfig.siteUrl}/categories/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: category.products?.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: `${seoConfig.siteUrl}/products/${product.slug}`,
          image: product.images?.[0] || `${seoConfig.siteUrl}/images/placeholder.jpg`,
        },
      })) || [],
    },
  }
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// Generate organization structured data
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/images/logo.png`,
    sameAs: [
      'https://twitter.com/neoshopultra',
      'https://facebook.com/neoshopultra',
      'https://instagram.com/neoshopultra',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-0123',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
  }
}

// Generate website structured data
export function generateWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

// Generate metadata for pages
export function generatePageMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  section,
  tags,
  noindex = false,
  nofollow = false,
}: {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  section?: string
  tags?: string[]
  noindex?: boolean
  nofollow?: boolean
}): Metadata {
  const fullTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle
  const fullDescription = description || seoConfig.defaultDescription
  const fullKeywords = keywords || seoConfig.defaultKeywords
  const fullImage = image || `${seoConfig.siteUrl}/images/og-image.jpg`
  const fullUrl = url ? `${seoConfig.siteUrl}${url}` : seoConfig.siteUrl

  const robots = []
  if (noindex) robots.push('noindex')
  if (nofollow) robots.push('nofollow')
  if (!noindex && !nofollow) robots.push('index', 'follow')

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    robots: robots.join(', '),
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: seoConfig.siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type: type === 'product' ? 'website' : type,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: seoConfig.twitterHandle,
    },
    alternates: {
      canonical: fullUrl,
    },
  }

  // Add article-specific metadata
  if (type === 'article') {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors,
      section,
      tags,
    }
  } else if (type === 'product') {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'website', // OpenGraph doesn't support 'product' type, use 'website'
    }
  }

  return metadata
}

// Generate sitemap data
export function generateSitemapData(pages: Array<{
  url: string
  lastModified: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}>) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
    <url>
      <loc>${seoConfig.siteUrl}${page.url}</loc>
      <lastmod>${page.lastModified}</lastmod>
      <changefreq>${page.changeFrequency}</changefreq>
      <priority>${page.priority}</priority>
    </url>
  `).join('')}
</urlset>`

  return sitemap
}

// Generate robots.txt
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${seoConfig.siteUrl}/sitemap.xml

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /products/
Allow: /categories/
Allow: /search/
`
}

// SEO utilities
export const seoUtils = {
  // Generate meta tags for HTML
  generateMetaTags: (metadata: Metadata) => {
    const tags = []
    
    // Basic meta tags
    if (metadata.title) {
      tags.push(`<title>${metadata.title}</title>`)
    }
    
    if (metadata.description) {
      tags.push(`<meta name="description" content="${metadata.description}">`)
    }
    
    if (metadata.keywords) {
      tags.push(`<meta name="keywords" content="${metadata.keywords}">`)
    }
    
    if (metadata.robots) {
      tags.push(`<meta name="robots" content="${metadata.robots}">`)
    }
    
    // Open Graph tags
    if (metadata.openGraph) {
      const og = metadata.openGraph
      if (og.title) tags.push(`<meta property="og:title" content="${og.title}">`)
      if (og.description) tags.push(`<meta property="og:description" content="${og.description}">`)
      if (og.url) tags.push(`<meta property="og:url" content="${og.url}">`)
      if (og.siteName) tags.push(`<meta property="og:site_name" content="${og.siteName}">`)
      if ((og as any).type) tags.push(`<meta property="og:type" content="${(og as any).type}">`)
      if (og.images) {
        const image = Array.isArray(og.images) ? og.images[0] : og.images
        if (image) {
          const imageUrl = typeof image === 'string' ? image : 
                          image instanceof URL ? image.toString() : 
                          (image as any).url || image.toString()
          const imageWidth = typeof image === 'string' ? 1200 : 
                            image instanceof URL ? 1200 : 
                            (image as any).width || 1200
          const imageHeight = typeof image === 'string' ? 630 : 
                             image instanceof URL ? 630 : 
                             (image as any).height || 630
          tags.push(`<meta property="og:image" content="${imageUrl}">`)
          tags.push(`<meta property="og:image:width" content="${imageWidth}">`)
          tags.push(`<meta property="og:image:height" content="${imageHeight}">`)
        }
      }
    }
    
    // Twitter tags
    if (metadata.twitter) {
      const twitter = metadata.twitter as any
      if (twitter.card) tags.push(`<meta name="twitter:card" content="${twitter.card}">`)
      if (twitter.title) tags.push(`<meta name="twitter:title" content="${twitter.title}">`)
      if (twitter.description) tags.push(`<meta name="twitter:description" content="${twitter.description}">`)
      if (twitter.images?.[0]) tags.push(`<meta name="twitter:image" content="${twitter.images[0]}">`)
      if (twitter.creator) tags.push(`<meta name="twitter:creator" content="${twitter.creator}">`)
    }
    
    // Canonical URL
    if (metadata.alternates?.canonical) {
      tags.push(`<link rel="canonical" href="${metadata.alternates.canonical}">`)
    }
    
    return tags.join('\n')
  },
  
  // Validate URL for SEO
  validateUrl: (url: string) => {
    const urlPattern = /^https?:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/
    return urlPattern.test(url)
  },
  
  // Generate URL slug
  generateSlug: (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },
  
  // Truncate text for meta description
  truncateDescription: (text: string, maxLength: number = 160) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  },
}


