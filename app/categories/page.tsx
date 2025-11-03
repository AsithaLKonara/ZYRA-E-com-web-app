'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Grid, 
  List, 
  Filter, 
  ChevronRight,
  Package,
  ArrowRight
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesResponse {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    parentId?: string;
    isActive?: boolean;
    search?: string;
  };
  sort: {
    by: string;
    order: string;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('sortOrder');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    fetchCategories();
  }, [pagination.page, sortBy, sortOrder, searchQuery]);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        isActive: 'true',
      });
      
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/categories?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data: CategoriesResponse = await response.json();
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    if (newSortBy) setSortBy(newSortBy);
    if (newSortOrder) setSortOrder(newSortOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const CategoryCard = ({ category }: { category: Category }) => (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <Package className="h-16 w-16 text-blue-400" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          
          {/* Product Count Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/90 text-gray-900">
              {category.productCount} products
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {category.name}
          </h3>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        
        {category.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">
            {category.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Browse {category.productCount} products
          </span>
          
          <Link href={`/categories/${category.slug}`}>
            <Button variant="outline" size="sm" className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
              View Products
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const CategoryListItem = ({ category }: { category: Category }) => (
    <Card className="group transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Category Image */}
          <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Package className="h-8 w-8 text-blue-400" />
              </div>
            )}
          </div>
          
          {/* Category Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
              <Badge variant="secondary">
                {category.productCount} products
              </Badge>
            </div>
            
            {category.description && (
              <p className="text-gray-600 mb-4">
                {category.description}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href={`/categories/${category.slug}`}>
              <Button variant="outline" className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                View Products
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Categories</h1>
          <p className="text-gray-600">
            Explore our wide range of product categories
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sortOrder-asc">Default Order</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="productCount-desc">Most Products</SelectItem>
                    <SelectItem value="productCount-asc">Least Products</SelectItem>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
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
          </CardContent>
        </Card>

        {/* Categories Grid/List */}
        {isLoading ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gray-200 rounded-t-lg"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-400 mb-4">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to load categories
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchCategories}>Try Again</Button>
            </CardContent>
          </Card>
        ) : categories.length > 0 ? (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {categories.map((category) => 
                viewMode === 'grid' ? (
                  <CategoryCard key={category.id} category={category} />
                ) : (
                  <CategoryListItem key={category.id} category={category} />
                )
              )}
            </div>

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
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No categories match "${searchQuery}"`
                  : 'No categories available at the moment'
                }
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


