"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Mic, Camera, X, TrendingUp, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useLoading } from "@/components/providers/loading-provider"
import { useRouter } from "next/navigation"
import { debounce } from "lodash"
import { clientLogger } from "@/lib/client-logger"

interface SearchSuggestion {
  id: string
  text: string
  type: "product" | "category" | "brand"
  count?: number
}

export function SmartSearch() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const { withLoading } = useLoading()
  const router = useRouter()

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch('/api/search/advanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5
          }),
        })

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        const searchData = data.data

        const suggestions: SearchSuggestion[] = [
          ...searchData.products.map((product: any) => ({
            id: product.id,
            text: product.name,
            type: "product" as const,
            count: 1,
          })),
          ...searchData.suggestions.brands.map((brand: string, index: number) => ({
            id: `brand-${index}`,
            text: brand,
            type: "brand" as const,
            count: searchData.facets.brands.find((b: any) => b.value === brand)?.count || 0,
          })),
          ...searchData.suggestions.categories.map((category: string, index: number) => ({
            id: `cat-${index}`,
            text: category,
            type: "category" as const,
            count: searchData.facets.categories.find((c: any) => c.value === category)?.count || 0,
          })),
        ]

        setSuggestions(suggestions.slice(0, 6))
        setShowSuggestions(true)
      } catch (error) {
        clientLogger.error("Search failed", {}, error instanceof Error ? error : undefined)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300),
    [],
  )

  useEffect(() => {
    debouncedSearch(query)
    return () => {
      debouncedSearch.cancel()
    }
  }, [query, debouncedSearch])

  const handleVoiceSearch = () => {
    setIsListening(true)
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      setIsListening(false)
      alert("Voice search not supported in this browser")
    }
  }

  const handleImageSearch = async () => {
    await withLoading(new Promise((resolve) => setTimeout(resolve, 1500)))
    clientLogger.info("Image search triggered")
  }

  const clearSearch = () => {
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    handleSearch(suggestion.text)
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products, brands, categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query)
            }
          }}
          className="pl-10 pr-24"
          onFocus={() => query.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          aria-label="Search products"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSearch}>
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleVoiceSearch} disabled={isListening}>
            <Mic className={`h-3 w-3 ${isListening ? "text-red-500 animate-pulse" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleImageSearch}>
            <Camera className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Smart Suggestions */}
      {showSuggestions && (
        <Card className="absolute top-full mt-1 w-full z-50 p-2 animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {isSearching ? (
            <div className="flex items-center justify-center p-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center space-x-2">
                    {suggestion.type === 'product' && <Search className="h-3 w-3 text-muted-foreground" />}
                    {suggestion.type === 'brand' && <TrendingUp className="h-3 w-3 text-muted-foreground" />}
                    {suggestion.type === 'category' && <Clock className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-sm">{suggestion.text}</span>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </div>
                  {suggestion.count && suggestion.count > 0 && (
                    <span className="text-xs text-muted-foreground">{suggestion.count} results</span>
                  )}
                </div>
              ))}
            </div>
          ) : query.length > 1 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">No results found for "{query}"</div>
          ) : null}
        </Card>
      )}
    </div>
  )
}
