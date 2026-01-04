'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  X, 
  TrendingUp, 
  Clock, 
  Star,
  Package,
  ArrowRight,
  Keyboard
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

interface SearchSuggestion {
  id: string;
  type: 'product' | 'category' | 'brand' | 'recent' | 'trending';
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  rating?: number;
  count?: number;
}

export function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock data - in production, this would come from API
  const mockSuggestions: SearchSuggestion[] = [
    // Products
    { id: '1', type: 'product', title: 'iPhone 15 Pro', subtitle: 'Latest Apple smartphone', price: 999, rating: 4.8, image: '/placeholder-product.jpg' },
    { id: '2', type: 'product', title: 'MacBook Air M2', subtitle: 'Ultra-thin laptop', price: 1199, rating: 4.9, image: '/placeholder-product.jpg' },
    { id: '3', type: 'product', title: 'Samsung Galaxy S24', subtitle: 'Android flagship phone', price: 799, rating: 4.7, image: '/placeholder-product.jpg' },
    
    // Categories
    { id: '4', type: 'category', title: 'Electronics', count: 1250 },
    { id: '5', type: 'category', title: 'Smartphones', count: 450 },
    { id: '6', type: 'category', title: 'Laptops', count: 320 },
    
    // Brands
    { id: '7', type: 'brand', title: 'Apple', count: 180 },
    { id: '8', type: 'brand', title: 'Samsung', count: 95 },
    { id: '9', type: 'brand', title: 'Sony', count: 67 },
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Load recent searches from localStorage
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);
    
    // Mock trending searches
    setTrendingSearches(['iPhone 15', 'Gaming laptops', 'Wireless headphones', 'Smart watches', 'Tablets']);
  }, []);

  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      
      // Simulate API call delay
      const timer = setTimeout(() => {
        const filtered = mockSuggestions.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 8));
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      return undefined;
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    onClose();
    onSearch?.(searchQuery);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.title);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  const handleTrendingSearchClick = (search: string) => {
    handleSearch(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'category':
        return <Search className="h-4 w-4" />;
      case 'brand':
        return <Star className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'product':
        return 'text-blue-600';
      case 'category':
        return 'text-green-600';
      case 'brand':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="sr-only">Search Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, categories, brands..."
              className="pl-10 pr-12 text-lg h-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(query);
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.trim() ? (
              <>
                {/* Search Suggestions */}
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500 px-3 py-2">
                      Suggestions
                    </h3>
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className={`${getSuggestionColor(suggestion.type)}`}>
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {suggestion.title}
                            </span>
                            {suggestion.count && (
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.count}
                              </Badge>
                            )}
                          </div>
                          
                          {suggestion.subtitle && (
                            <p className="text-sm text-gray-500 truncate">
                              {suggestion.subtitle}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-1">
                            {suggestion.price && (
                              <span className="text-sm font-medium text-green-600">
                                {formatPrice(suggestion.price)}
                              </span>
                            )}
                            {suggestion.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-500">
                                  {suggestion.rating}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No suggestions found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent Searches
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 px-3 py-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Searches
                  </h3>
                  <div className="space-y-1">
                    {trendingSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleTrendingSearchClick(search)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex items-center justify-between pt-4 border-t text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                <span>Press Enter to search</span>
              </div>
              <div className="flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                <span>Press Esc to close</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}