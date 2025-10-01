'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/products/product-card';
import { useWishlist } from '@/hooks/use-wishlist';
import { 
  Heart,
  ShoppingCart,
  Grid,
  List,
  Search,
  SortAsc,
  Trash2,
  Eye
} from 'lucide-react';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
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
  };
  addedAt: string;
}

interface WishlistSectionProps {
  userId: string;
  className?: string;
}

export function WishlistSection({ userId, className = "" }: WishlistSectionProps) {
  const { items: wishlistItems, removeItem, isLoading: wishlistLoading } = useWishlist();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('addedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const sortOptions = [
    { value: 'addedAt', label: 'Recently Added' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'price', label: 'Price Low to High' },
    { value: 'price-desc', label: 'Price High to Low' },
  ];

  const handleSortChange = (value: string) => {
    if (value.includes('-desc')) {
      setSortBy(value.split('-')[0]);
      setSortOrder('desc');
    } else {
      setSortBy(value);
      setSortOrder('asc');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setIsRemoving(productId);
    try {
      await removeItem(productId);
    } catch (error) {
      console.error('Failed to remove item from wishlist:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  const handleBulkRemove = async () => {
    for (const productId of selectedItems) {
      try {
        await removeItem(productId);
      } catch (error) {
        console.error(`Failed to remove item ${productId}:`, error);
      }
    }
    setSelectedItems([]);
  };

  const handleSelectItem = (productId: string) => {
    setSelectedItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === sortedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedItems.map(item => item.productId));
    }
  };

  const sortedItems = [...wishlistItems].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'addedAt':
        aValue = new Date(a.addedAt);
        bValue = new Date(b.addedAt);
        break;
      case 'name':
        aValue = a.product.name.toLowerCase();
        bValue = b.product.name.toLowerCase();
        break;
      case 'price':
        aValue = a.product.price;
        bValue = b.product.price;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const WishlistItemCard = ({ item }: { item: WishlistItem }) => {
    const isSelected = selectedItems.includes(item.productId);
    const isRemovingItem = isRemoving === item.productId;

    return (
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        {viewMode === 'list' && (
          <div className="absolute top-4 left-4 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectItem(item.productId)}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
        )}
        
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden">
            {item.product.images.length > 0 ? (
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Actions Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => handleRemoveItem(item.productId)}
                  disabled={isRemovingItem}
                >
                  {isRemovingItem ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
                
                <Link href={`/products/${item.product.id}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 rounded-full p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stock Badge */}
            {!item.product.inStock && (
              <div className="absolute top-4 left-4">
                <Badge variant="destructive">Out of Stock</Badge>
              </div>
            )}

            {/* Sale Badge */}
            {item.product.originalPrice && item.product.originalPrice > item.product.price && (
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="bg-red-500 text-white">
                  Sale
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                <Link href={`/products/${item.product.id}`}>
                  {item.product.name}
                </Link>
              </h3>
              
              {viewMode === 'grid' && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectItem(item.productId)}
                  className="h-4 w-4 text-blue-600 rounded ml-2 flex-shrink-0"
                />
              )}
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">
              {item.product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">
                  ${item.product.price.toFixed(2)}
                </span>
                {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${item.product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              
              <Badge variant="outline" className="text-xs">
                {item.product.category.name}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Added {formatDate(item.addedAt)}</span>
              {item.product.reviews && item.product.reviews.totalReviews > 0 && (
                <span>
                  ⭐ {item.product.reviews.averageRating.toFixed(1)} ({item.product.reviews.totalReviews})
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={!item.product.inStock}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemoveItem(item.productId)}
                disabled={isRemovingItem}
              >
                {isRemovingItem ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              My Wishlist ({wishlistItems.length} items)
            </CardTitle>
            
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkRemove}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected ({selectedItems.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Select All */}
              {wishlistItems.length > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === wishlistItems.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  Select All
                </label>
              )}

              {/* Sort */}
              <Select value={`${sortBy}${sortOrder === 'desc' ? '-desc' : ''}`} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
        </CardContent>
      </Card>

      {/* Wishlist Items */}
      {wishlistLoading ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {[...Array(4)].map((_, i) => (
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
      ) : sortedItems.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {sortedItems.map((item) => (
            <WishlistItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Heart className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-gray-600 mb-4">
              Save items you love by clicking the heart icon on any product
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


