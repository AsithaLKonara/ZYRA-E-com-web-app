export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  subcategory?: string
  brand?: string
  sku: string
  inStock: boolean
  stockQuantity: number
  rating: number
  reviewCount: number
  tags: string[]
  isNew: boolean
  isFeatured: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  specifications?: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  price: number
  sku: string
  inStock: boolean
  stockQuantity: number
  attributes: Record<string, string>
}

export interface ProductFilter {
  category?: string
  subcategory?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  rating?: number
  tags?: string[]
  isNew?: boolean
  isFeatured?: boolean
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'popularity'
  direction: 'asc' | 'desc'
}

export interface ProductSearchParams {
  query?: string
  filters?: ProductFilter
  sort?: ProductSort
  page?: number
  limit?: number
}

export interface ProductSearchResult {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
  facets: {
    categories: Array<{ name: string; count: number }>
    brands: Array<{ name: string; count: number }>
    priceRanges: Array<{ min: number; max: number; count: number }>
  }
}



