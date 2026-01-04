'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from './product-card';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

interface RelatedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  reviews?: {
    averageRating: number;
    totalReviews: number;
  };
}

interface ProductRelatedProps {
  productId: string;
  categoryId: string;
  className?: string;
}

export function ProductRelated({ 
  productId, 
  categoryId,
  className = "" 
}: ProductRelatedProps) {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const productsPerPage = 4;

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId, categoryId]);

  const fetchRelatedProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/products/related?productId=${productId}&categoryId=${categoryId}&limit=${productsPerPage * 2}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch related products');
      }
      
      const data = await response.json();
      setRelatedProducts(data.products || []);
      setTotalPages(Math.ceil((data.products || []).length / productsPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load related products');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const currentProducts = relatedProducts.slice(
    currentPage * productsPerPage,
    (currentPage + 1) * productsPerPage
  );

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Related Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Related Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchRelatedProducts} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Related Products
              <Badge variant="secondary">{relatedProducts.length}</Badge>
            </CardTitle>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-gray-600">
                  {currentPage + 1} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showQuickActions={true}
                className="transition-transform hover:scale-105"
              />
            ))}
          </div>

          {/* View All Button */}
          {relatedProducts.length > productsPerPage && (
            <div className="text-center mt-6">
              <Button variant="outline" className="px-8">
                View All Related Products ({relatedProducts.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Viewed */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Viewed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recently viewed products</p>
            <p className="text-sm">Browse our catalog to see your recent views here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


