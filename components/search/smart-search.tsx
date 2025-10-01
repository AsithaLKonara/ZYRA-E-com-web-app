'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchModal } from './search-modal';
import { 
  Search, 
  Mic, 
  Camera, 
  X,
  TrendingUp,
  Clock,
  Package,
  Star,
  ArrowRight
} from 'lucide-react';

interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  showModal?: boolean;
}

interface QuickSuggestion {
  id: string;
  type: 'product' | 'category' | 'trending';
  title: string;
  subtitle?: string;
  count?: number;
}

export function SmartSearch({ 
  placeholder = "Search for products...", 
  className = "",
  showModal = true 
}: SmartSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock suggestions data
  const mockSuggestions: QuickSuggestion[] = [
    { id: '1', type: 'trending', title: 'iPhone 15 Pro', count: 1250 },
    { id: '2', type: 'product', title: 'MacBook Air M2', subtitle: 'Ultra-thin laptop' },
    { id: '3', type: 'category', title: 'Electronics', count: 2500 },
    { id: '4', type: 'trending', title: 'Gaming Laptops', count: 890 },
    { id: '5', type: 'product', title: 'Samsung Galaxy S24', subtitle: 'Android flagship' },
    { id: '6', type: 'category', title: 'Smartphones', count: 1800 },
  ];

  useEffect(() => {
    // Load recent searches
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (value.trim()) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const filtered = mockSuggestions.filter(item =>
          item.title.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 6));
        setIsLoading(false);
        setShowSuggestions(true);
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: QuickSuggestion) => {
    handleSearch(suggestion.title);
  };

  const handleRecentSearchClick = (search: string) => {
    handleSearch(search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const openModal = () => {
    if (showModal) {
      setIsOpen(true);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'category':
        return <Search className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
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
      case 'trending':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) {
              setShowSuggestions(true);
            }
          }}
          onClick={openModal}
          placeholder={placeholder}
          className="pl-10 pr-20 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0 mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={openModal}
              className="h-8 w-8 p-0"
              title="Voice search"
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={openModal}
              className="h-8 w-8 p-0"
              title="Visual search"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Searching...</span>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Suggestions
                </h3>
              </div>
              
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
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
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          ) : query.trim() && !isLoading ? (
            <div className="p-4 text-center">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No suggestions found</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch()}
                className="mt-2"
              >
                Search for "{query}"
              </Button>
            </div>
          ) : null}

          {/* Recent Searches */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </h3>
              </div>
              
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Modal */}
      {showModal && (
        <SearchModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSearch={handleSearch}
        />
      )}
    </div>
  );
}


