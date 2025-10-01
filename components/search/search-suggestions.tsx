"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchSuggestionsProps {
  suggestions: {
    products: string[]
    brands: string[]
    categories: string[]
  }
  onSuggestionClick: (suggestion: string) => void
  className?: string
}

export function SearchSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  className 
}: SearchSuggestionsProps) {
  const hasSuggestions = 
    suggestions.products.length > 0 || 
    suggestions.brands.length > 0 || 
    suggestions.categories.length > 0

  if (!hasSuggestions) {
    return null
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Products */}
          {suggestions.products.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Products
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.products.slice(0, 5).map((product, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSuggestionClick(product)}
                    className="h-8 text-xs"
                  >
                    {product}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {suggestions.brands.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Brands
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.brands.slice(0, 5).map((brand, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSuggestionClick(brand)}
                    className="h-8 text-xs"
                  >
                    {brand}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {suggestions.categories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Categories
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.categories.slice(0, 5).map((category, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSuggestionClick(category)}
                    className="h-8 text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}



