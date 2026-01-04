"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { X, Filter, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchFiltersProps {
  facets: {
    categories: Array<{ value: string; count: number }>
    brands: Array<{ value: string; count: number }>
    priceRange: { min: number; max: number }
    ratings: Array<{ value: number; count: number }>
  }
  filters: {
    category?: string
    brand?: string
    priceMin?: number
    priceMax?: number
    rating?: number
    inStock?: boolean
    isNew?: boolean
    tags?: string[]
  }
  onFiltersChange: (filters: any) => void
  className?: string
}

export function SearchFilters({ 
  facets, 
  filters, 
  onFiltersChange, 
  className 
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [priceRange, setPriceRange] = useState([
    filters.priceMin || facets.priceRange.min,
    filters.priceMax || facets.priceRange.max
  ])

  useEffect(() => {
    setLocalFilters(filters)
    setPriceRange([
      filters.priceMin || facets.priceRange.min,
      filters.priceMax || facets.priceRange.max
    ])
  }, [filters, facets])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values)
    handleFilterChange('priceMin', values[0])
    handleFilterChange('priceMax', values[1])
  }

  const handleCategoryToggle = (category: string) => {
    const newCategory = localFilters.category === category ? undefined : category
    handleFilterChange('category', newCategory)
  }

  const handleBrandToggle = (brand: string) => {
    const newBrand = localFilters.brand === brand ? undefined : brand
    handleFilterChange('brand', newBrand)
  }

  const handleRatingToggle = (rating: number) => {
    const newRating = localFilters.rating === rating ? undefined : rating
    handleFilterChange('rating', newRating)
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    handleFilterChange('tags', newTags)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      category: undefined,
      brand: undefined,
      priceMin: undefined,
      priceMax: undefined,
      rating: undefined,
      inStock: undefined,
      isNew: undefined,
      tags: []
    }
    setLocalFilters(clearedFilters)
    setPriceRange([facets.priceRange.min, facets.priceRange.max])
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== false && 
    (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="px-3">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              min={facets.priceRange.min}
              max={facets.priceRange.max}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {facets.categories.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.value}`}
                  checked={localFilters.category === category.value}
                  onCheckedChange={() => handleCategoryToggle(category.value)}
                />
                <Label
                  htmlFor={`category-${category.value}`}
                  className="flex-1 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm">{category.value}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Brands */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Brands</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {facets.brands.map((brand) => (
              <div key={brand.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.value}`}
                  checked={localFilters.brand === brand.value}
                  onCheckedChange={() => handleBrandToggle(brand.value)}
                />
                <Label
                  htmlFor={`brand-${brand.value}`}
                  className="flex-1 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm">{brand.value}</span>
                  <Badge variant="secondary" className="text-xs">
                    {brand.count}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Customer Rating</Label>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = facets.ratings.find(r => r.value >= rating)?.count || 0
              return (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={localFilters.rating === rating}
                    onCheckedChange={() => handleRatingToggle(rating)}
                  />
                  <Label
                    htmlFor={`rating-${rating}`}
                    className="flex-1 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          )}
                        />
                      ))}
                      <span className="text-sm ml-1">& up</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </Label>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Availability */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Availability</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={localFilters.inStock === true}
                onCheckedChange={(checked) => handleFilterChange('inStock', checked ? true : undefined)}
              />
              <Label htmlFor="inStock" className="text-sm cursor-pointer">
                In Stock Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isNew"
                checked={localFilters.isNew === true}
                onCheckedChange={(checked) => handleFilterChange('isNew', checked ? true : undefined)}
              />
              <Label htmlFor="isNew" className="text-sm cursor-pointer">
                New Products
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



