'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/products/product-card';
import { clientLogger } from '@/lib/client-logger';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal,
  X,
  ChevronDown
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  tags: string[];
  reviews?: {
    averageRating: number;
    totalReviews: number;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FilterState {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean | null;
  sortBy: string;
  sortOrder: string;
  tags: string[];
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') === 'true' ? true : null,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    tags: searchParams.get('tags')?.split(',') || [],
  });

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'price', label: 'Price Low to High' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const priceRanges = [
    { label: 'Under $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: 'Over $200', min: 200, max: null },
  ];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.inStock !== null) params.set('inStock', filters.inStock.toString());
      if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
      
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/products/enhanced?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        }));
      }
    } catch (error) {
      clientLogger.error('Failed to fetch products', {}, error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      clientLogger.error('Failed to fetch categories', {}, error instanceof Error ? error : undefined);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tags: [],
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== null && (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
          <p className="text-gray-600">
            Discover our amazing collection of products
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <Button type="submit" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.label} className="flex items-center">
                        <input
                          type="radio"
                          name="priceRange"
                          className="mr-2"
                          checked={
                            (filters.minPrice === range.min.toString() && 
                             filters.maxPrice === (range.max?.toString() || '')) ||
                            (range.min === 0 && range.max === null && 
                             filters.minPrice === '' && filters.maxPrice === '')
                          }
                          onChange={() => {
                            handleFilterChange('minPrice', range.min.toString());
                            handleFilterChange('maxPrice', range.max?.toString() || '');
                          }}
                        />
                        <span className="text-sm text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stock Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="stock"
                        className="mr-2"
                        checked={filters.inStock === null}
                        onChange={() => handleFilterChange('inStock', null)}
                      />
                      <span className="text-sm text-gray-700">All Products</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="stock"
                        className="mr-2"
                        checked={filters.inStock === true}
                        onChange={() => handleFilterChange('inStock', true)}
                      />
                      <span className="text-sm text-gray-700">In Stock Only</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                
                <p className="text-sm text-gray-600">
                  {pagination.total} products found
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={`${option.value}-desc`} value={`${option.value}-desc`}>
                        {option.label}
                      </SelectItem>
                    ))}
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
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-0">
                      <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const page = i + 1;
                    const isCurrentPage = page === pagination.page;
                    const isNearCurrentPage = Math.abs(page - pagination.page) <= 2;
                    
                    if (!isNearCurrentPage && page !== 1 && page !== pagination.totalPages) {
                      return null;
                    }
                    
                    if (!isNearCurrentPage && page === pagination.totalPages && pagination.page > 4) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={isCurrentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}