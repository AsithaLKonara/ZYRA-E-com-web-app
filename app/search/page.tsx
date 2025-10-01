"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchResults } from "@/components/search/search-results"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"

interface SearchData {
  products: any[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  facets: {
    categories: Array<{ value: string; count: number }>
    brands: Array<{ value: string; count: number }>
    priceRange: { min: number; max: number }
    ratings: Array<{ value: number; count: number }>
  }
  suggestions: {
    products: string[]
    brands: string[]
    categories: string[]
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [searchData, setSearchData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const sort = searchParams.get('sort') || 'relevance'
  
  // Parse filters from URL
  const filters = {
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
    priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
    isNew: searchParams.get('isNew') === 'true' ? true : undefined,
    tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
  }

  const performSearch = useCallback(async (
    searchQuery: string,
    searchFilters: any,
    searchSort: string,
    searchPage: number
  ) => {
    if (!searchQuery.trim()) {
      setSearchData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: searchFilters,
          sort: searchSort,
          page: searchPage,
          limit: 20
        }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchData(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update URL parameters
  const updateURL = useCallback((
    newQuery?: string,
    newFilters?: any,
    newSort?: string,
    newPage?: number
  ) => {
    const params = new URLSearchParams()
    
    if (newQuery !== undefined) {
      if (newQuery) params.set('q', newQuery)
    } else if (query) {
      params.set('q', query)
    }

    if (newSort !== undefined) {
      if (newSort !== 'relevance') params.set('sort', newSort)
    } else if (sort !== 'relevance') {
      params.set('sort', sort)
    }

    if (newPage !== undefined && newPage > 1) {
      params.set('page', newPage.toString())
    } else if (page > 1) {
      params.set('page', page.toString())
    }

    // Add filters to URL
    const filtersToUse = newFilters || filters
    Object.entries(filtersToUse).forEach(([key, value]) => {
      if (value !== undefined && value !== false && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(','))
        } else if (!Array.isArray(value)) {
          params.set(key, value.toString())
        }
      }
    })

    const newURL = params.toString() ? `?${params.toString()}` : '/search'
    router.push(newURL, { scroll: false })
  }, [query, sort, page, filters, router])

  // Handle search
  const handleQueryChange = useCallback((newQuery: string) => {
    updateURL(newQuery, undefined, undefined, 1)
  }, [updateURL])

  const handleFiltersChange = useCallback((newFilters: any) => {
    updateURL(undefined, newFilters, undefined, 1)
  }, [updateURL])

  const handleSortChange = useCallback((newSort: string) => {
    updateURL(undefined, undefined, newSort, 1)
  }, [updateURL])

  const handlePageChange = useCallback((newPage: number) => {
    updateURL(undefined, undefined, undefined, newPage)
  }, [updateURL])

  // Perform search when parameters change
  useEffect(() => {
    if (query) {
      performSearch(query, filters, sort, page)
    }
  }, [query, filters, sort, page, performSearch])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-80">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
            
            <div className="flex-1">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Products</h3>
            <p className="text-muted-foreground">
              Enter a search term to find products
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!searchData) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SearchResults
        query={query}
        products={searchData.products}
        pagination={searchData.pagination}
        facets={searchData.facets}
        suggestions={searchData.suggestions}
        filters={filters}
        sort={sort}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onQueryChange={handleQueryChange}
      />
    </div>
  )
}



