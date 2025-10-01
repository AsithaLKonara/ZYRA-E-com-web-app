"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductCard } from "@/components/products/product-card"
import { SearchFilters } from "./search-filters"
import { SearchSuggestions } from "./search-suggestions"
import { Grid, List, SortAsc, Filter, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResultsProps {
  query: string
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
  filters: any
  sort: string
  onFiltersChange: (filters: any) => void
  onSortChange: (sort: string) => void
  onPageChange: (page: number) => void
  onQueryChange: (query: string) => void
  className?: string
}

export function SearchResults({
  query,
  products,
  pagination,
  facets,
  suggestions,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onPageChange,
  onQueryChange,
  className
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onQueryChange(searchInput)
  }

  const handleClearSearch = () => {
    setSearchInput("")
    onQueryChange("")
  }

  const hasResults = products.length > 0
  const hasFilters = Object.values(filters).some(value => 
    value !== undefined && value !== false && 
    (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10 pr-10"
                />
                {searchInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Sort */}
              <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Customer Rating</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    !
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search Suggestions */}
          {suggestions.products.length > 0 && (
            <SearchSuggestions
              suggestions={suggestions}
              onSuggestionClick={onQueryChange}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className={cn(
          "lg:w-80",
          showFilters ? "block" : "hidden lg:block"
        )}>
          <SearchFilters
            facets={facets}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>

        {/* Results */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {hasResults ? `${pagination.total} results` : 'No results found'}
              </h2>
              {query && (
                <p className="text-muted-foreground">
                  for "{query}"
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          {hasResults ? (
            <>
              {/* Products Grid/List */}
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              )}>
                {products.map((product) => (
                  <div 
                    key={product.id}
                    className={viewMode === 'list' ? "flex-row" : ""}
                  >
                    <ProductCard
                      product={product}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={pagination.page === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={handleClearSearch}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
