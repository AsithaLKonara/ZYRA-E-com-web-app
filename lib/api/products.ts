import { Product, ProductSearchParams, ProductSearchResult } from "@/lib/types/product"

// Mock product data
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    price: 299.99,
    originalPrice: 399.99,
    images: ["/api/placeholder/300/300", "/api/placeholder/300/300"],
    category: "Electronics",
    subcategory: "Audio",
    brand: "TechSound",
    sku: "TS-WH-001",
    inStock: true,
    stockQuantity: 50,
    rating: 4.5,
    reviewCount: 128,
    tags: ["wireless", "noise-cancellation", "premium"],
    isNew: true,
    isFeatured: true,
    weight: 0.3,
    dimensions: { length: 20, width: 18, height: 8 },
    specifications: {
      "Battery Life": "30 hours",
      "Connectivity": "Bluetooth 5.0",
      "Noise Cancellation": "Active",
      "Frequency Response": "20Hz - 20kHz"
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15")
  },
  {
    id: "2",
    name: "Smart Fitness Watch",
    description: "Advanced fitness tracking watch with heart rate monitoring and GPS.",
    price: 199.99,
    originalPrice: 249.99,
    images: ["/api/placeholder/300/300"],
    category: "Electronics",
    subcategory: "Wearables",
    brand: "FitTech",
    sku: "FT-SW-002",
    inStock: true,
    stockQuantity: 75,
    rating: 4.3,
    reviewCount: 89,
    tags: ["fitness", "smartwatch", "gps"],
    isNew: false,
    isFeatured: true,
    weight: 0.05,
    dimensions: { length: 4, width: 4, height: 1 },
    specifications: {
      "Battery Life": "7 days",
      "Water Resistance": "5ATM",
      "GPS": "Built-in",
      "Heart Rate": "Continuous monitoring"
    },
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-10")
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    description: "Comfortable organic cotton t-shirt made from sustainable materials.",
    price: 29.99,
    originalPrice: 39.99,
    images: ["/api/placeholder/300/300"],
    category: "Clothing",
    subcategory: "Tops",
    brand: "EcoWear",
    sku: "EW-TS-003",
    inStock: true,
    stockQuantity: 200,
    rating: 4.7,
    reviewCount: 256,
    tags: ["organic", "cotton", "sustainable"],
    isNew: false,
    isFeatured: false,
    weight: 0.2,
    specifications: {
      "Material": "100% Organic Cotton",
      "Care Instructions": "Machine wash cold",
      "Origin": "Made in USA"
    },
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-12")
  },
  {
    id: "4",
    name: "Minimalist Backpack",
    description: "Sleek and functional backpack perfect for daily use and travel.",
    price: 79.99,
    originalPrice: 99.99,
    images: ["/api/placeholder/300/300"],
    category: "Accessories",
    subcategory: "Bags",
    brand: "MinimalGear",
    sku: "MG-BP-004",
    inStock: false,
    stockQuantity: 0,
    rating: 4.4,
    reviewCount: 67,
    tags: ["backpack", "minimalist", "travel"],
    isNew: true,
    isFeatured: false,
    weight: 0.8,
    dimensions: { length: 30, width: 20, height: 45 },
    specifications: {
      "Capacity": "25L",
      "Material": "Nylon",
      "Laptop Compartment": "15-inch",
      "Water Resistant": "Yes"
    },
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-14")
  },
  {
    id: "5",
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with excellent sound quality and long battery life.",
    price: 89.99,
    originalPrice: 119.99,
    images: ["/api/placeholder/300/300"],
    category: "Electronics",
    subcategory: "Audio",
    brand: "SoundWave",
    sku: "SW-BS-005",
    inStock: true,
    stockQuantity: 30,
    rating: 4.2,
    reviewCount: 143,
    tags: ["bluetooth", "speaker", "portable"],
    isNew: false,
    isFeatured: false,
    weight: 0.6,
    dimensions: { length: 15, width: 8, height: 8 },
    specifications: {
      "Battery Life": "12 hours",
      "Connectivity": "Bluetooth 5.0",
      "Water Resistance": "IPX7",
      "Power": "20W"
    },
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-11")
  },
  {
    id: "6",
    name: "Leather Wallet",
    description: "Genuine leather wallet with RFID blocking technology.",
    price: 49.99,
    originalPrice: 69.99,
    images: ["/api/placeholder/300/300"],
    category: "Accessories",
    subcategory: "Wallets",
    brand: "LeatherCraft",
    sku: "LC-WL-006",
    inStock: true,
    stockQuantity: 100,
    rating: 4.6,
    reviewCount: 92,
    tags: ["leather", "wallet", "rfid"],
    isNew: false,
    isFeatured: false,
    weight: 0.1,
    dimensions: { length: 10, width: 7, height: 1 },
    specifications: {
      "Material": "Genuine Leather",
      "RFID Blocking": "Yes",
      "Card Slots": "8",
      "Coin Pocket": "Yes"
    },
    createdAt: new Date("2024-01-04"),
    updatedAt: new Date("2024-01-13")
  }
]

export async function getProducts(params: ProductSearchParams = {}): Promise<ProductSearchResult> {
  const {
    query = "",
    filters = {},
    sort = { field: "name", direction: "asc" },
    page = 1,
    limit = 12
  } = params

  let filteredProducts = [...mockProducts]

  // Apply search query
  if (query) {
    const searchTerm = query.toLowerCase()
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      product.brand?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply filters
  if (filters.category) {
    filteredProducts = filteredProducts.filter(product => product.category === filters.category)
  }
  if (filters.subcategory) {
    filteredProducts = filteredProducts.filter(product => product.subcategory === filters.subcategory)
  }
  if (filters.brand) {
    filteredProducts = filteredProducts.filter(product => product.brand === filters.brand)
  }
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.price >= filters.minPrice!)
  }
  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.price <= filters.maxPrice!)
  }
  if (filters.inStock !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.inStock === filters.inStock)
  }
  if (filters.rating !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.rating >= filters.rating!)
  }
  if (filters.tags && filters.tags.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      filters.tags!.some(tag => product.tags.includes(tag))
    )
  }
  if (filters.isNew !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.isNew === filters.isNew)
  }
  if (filters.isFeatured !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.isFeatured === filters.isFeatured)
  }

  // Apply sorting
  filteredProducts.sort((a, b) => {
    let aValue: any, bValue: any

    switch (sort.field) {
      case "name":
        aValue = a.name
        bValue = b.name
        break
      case "price":
        aValue = a.price
        bValue = b.price
        break
      case "rating":
        aValue = a.rating
        bValue = b.rating
        break
      case "createdAt":
        aValue = a.createdAt.getTime()
        bValue = b.createdAt.getTime()
        break
      case "popularity":
        aValue = a.reviewCount
        bValue = b.reviewCount
        break
      default:
        aValue = a.name
        bValue = b.name
    }

    if (sort.direction === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Apply pagination
  const total = filteredProducts.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit)

  // Generate facets
  const categories = [...new Set(mockProducts.map(p => p.category))]
    .map(cat => ({
      name: cat,
      count: mockProducts.filter(p => p.category === cat).length
    }))

  const brands = [...new Set(mockProducts.map(p => p.brand).filter(Boolean))]
    .map(brand => ({
      name: brand!,
      count: mockProducts.filter(p => p.brand === brand).length
    }))

  const priceRanges = [
    { min: 0, max: 50, count: mockProducts.filter(p => p.price >= 0 && p.price <= 50).length },
    { min: 50, max: 100, count: mockProducts.filter(p => p.price > 50 && p.price <= 100).length },
    { min: 100, max: 200, count: mockProducts.filter(p => p.price > 100 && p.price <= 200).length },
    { min: 200, max: 500, count: mockProducts.filter(p => p.price > 200 && p.price <= 500).length }
  ]

  return {
    products: paginatedProducts,
    total,
    page,
    limit,
    totalPages,
    facets: {
      categories,
      brands,
      priceRanges
    }
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  return mockProducts.find(product => product.id === id) || null
}

export async function getFeaturedProducts(limit: number = 6): Promise<Product[]> {
  return mockProducts
    .filter(product => product.isFeatured)
    .slice(0, limit)
}

export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  const product = await getProductById(productId)
  if (!product) return []

  return mockProducts
    .filter(p => p.id !== productId && p.category === product.category)
    .slice(0, limit)
}



