"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { ProductFilter } from "@/lib/types/product"

interface ProductFiltersProps {
  filters: ProductFilter
  onFiltersChange: (filters: ProductFilter) => void
  facets: {
    categories: Array<{ name: string; count: number }>
    brands: Array<{ name: string; count: number }>
    priceRanges: Array<{ min: number; max: number; count: number }>
  }
  totalProducts: number
}

export function ProductFilters({ 
  filters, 
  onFiltersChange, 
  facets, 
  totalProducts 
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilter>(filters)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key: keyof ProductFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceRangeChange = (value: number[]) => {
    handleFilterChange("minPrice", value[0])
    handleFilterChange("maxPrice", value[1])
  }

  const handleCategoryToggle = (category: string) => {
    const newCategory = localFilters.category === category ? undefined : category
    handleFilterChange("category", newCategory)
  }

  const handleBrandToggle = (brand: string) => {
    const newBrand = localFilters.brand === brand ? undefined : brand
    handleFilterChange("brand", newBrand)
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    handleFilterChange("tags", newTags.length > 0 ? newTags : undefined)
  }

  const clearFilters = () => {
    const clearedFilters: ProductFilter = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && 
    (Array.isArray(value) ? value.length > 0 : true)
  )

  const activeFilterCount = Object.values(localFilters).filter(value => 
    value !== undefined && value !== null && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden"
            >
              {isExpanded ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {totalProducts} products found
        </p>
      </CardHeader>
      
      <CardContent className={`space-y-6 ${isExpanded ? "block" : "hidden md:block"}`}>
        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="px-3">
            <Slider
              value={[localFilters.minPrice || 0, localFilters.maxPrice || 1000]}
              onValueChange={handlePriceRangeChange}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>${localFilters.minPrice || 0}</span>
              <span>${localFilters.maxPrice || 1000}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="space-y-2">
            {facets.categories.map((category) => (
              <div key={category.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.name}`}
                  checked={localFilters.category === category.name}
                  onCheckedChange={() => handleCategoryToggle(category.name)}
                />
                <Label
                  htmlFor={`category-${category.name}`}
                  className="text-sm flex-1 cursor-pointer"
                >
                  {category.name} ({category.count})
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Brands</Label>
          <div className="space-y-2">
            {facets.brands.map((brand) => (
              <div key={brand.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.name}`}
                  checked={localFilters.brand === brand.name}
                  onCheckedChange={() => handleBrandToggle(brand.name)}
                />
                <Label
                  htmlFor={`brand-${brand.name}`}
                  className="text-sm flex-1 cursor-pointer"
                >
                  {brand.name} ({brand.count})
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Availability</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={localFilters.inStock === true}
                onCheckedChange={(checked) => 
                  handleFilterChange("inStock", checked ? true : undefined)
                }
              />
              <Label htmlFor="in-stock" className="text-sm cursor-pointer">
                In Stock Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-products"
                checked={localFilters.isNew === true}
                onCheckedChange={(checked) => 
                  handleFilterChange("isNew", checked ? true : undefined)
                }
              />
              <Label htmlFor="new-products" className="text-sm cursor-pointer">
                New Products
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={localFilters.isFeatured === true}
                onCheckedChange={(checked) => 
                  handleFilterChange("isFeatured", checked ? true : undefined)
                }
              />
              <Label htmlFor="featured" className="text-sm cursor-pointer">
                Featured Products
              </Label>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Minimum Rating</Label>
          <Select
            value={localFilters.rating?.toString() || ""}
            onValueChange={(value) => 
              handleFilterChange("rating", value ? parseFloat(value) : undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any rating</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
              <SelectItem value="2">2+ stars</SelectItem>
              <SelectItem value="1">1+ stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}