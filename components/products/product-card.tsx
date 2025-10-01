'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';

interface ProductCardProps {
  product: {
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
  };
  showQuickActions?: boolean;
  className?: string;
}

export function ProductCard({ 
  product, 
  showQuickActions = true, 
  className = '' 
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleAddToCart = async () => {
    if (!product.inStock) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently out of stock',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addToCart(product.id, 1);
      toast({
        title: 'Added to Cart',
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
      toast({
        title: 'Removed from Wishlist',
        description: `${product.name} has been removed from your wishlist`,
      });
    } else {
      await addToWishlist(product.id);
      toast({
        title: 'Added to Wishlist',
        description: `${product.name} has been added to your wishlist`,
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
      {/* Product Image */}
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden">
          {product.images.length > 0 && !imageError ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          
          {/* Quick Actions Overlay */}
          {showQuickActions && (
            <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-full items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 w-10 rounded-full p-0"
                  onClick={handleWishlistToggle}
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isInWishlist(product.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-white'
                    }`} 
                  />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 w-10 rounded-full p-0"
                  asChild
                >
                  <Link href={`/products/${product.id}`}>
                    <Eye className="h-4 w-4 text-white" />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="h-10 w-10 rounded-full p-0"
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isLoading}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Stock Badge */}
          {!product.inStock && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}

          {/* Sale Badge */}
          {product.tags.includes('sale') && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-red-500 text-white">
                Sale
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Product Info */}
      <CardContent className="p-4">
        {/* Category */}
        {product.category && (
          <div className="mb-2">
            <Link 
              href={`/categories/${product.category.slug}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {product.category.name}
            </Link>
          </div>
        )}

        {/* Product Name */}
        <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">
          <Link 
            href={`/products/${product.id}`}
            className="hover:text-blue-600"
          >
            {product.name}
          </Link>
        </h3>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
          {product.description}
        </p>

        {/* Rating */}
        {product.reviews && product.reviews.totalReviews > 0 && (
          <div className="mb-3 flex items-center gap-1">
            <div className="flex">
              {renderStars(product.reviews.averageRating)}
            </div>
            <span className="text-sm text-gray-500">
              ({product.reviews.totalReviews})
            </span>
          </div>
        )}

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{product.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Price and Actions */}
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.stockQuantity <= 5 && product.inStock && (
            <span className="text-xs text-orange-600">
              Only {product.stockQuantity} left!
            </span>
          )}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!product.inStock || isLoading}
          className="flex-1 max-w-[120px]"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProductCard;