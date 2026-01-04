'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
      inStock: boolean;
      stockQuantity: number;
    };
    quantity: number;
  };
  onQuantityChange?: (itemId: string, quantity: number) => void;
  onRemove?: (itemId: string) => void;
  showWishlistButton?: boolean;
  className?: string;
}

export function CartItem({ 
  item, 
  onQuantityChange, 
  onRemove,
  showWishlistButton = true,
  className = '' 
}: CartItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const { toast } = useToast();
  const { updateQuantity, removeItem } = useCart();
  const { addToWishlist } = useWishlist();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.product.stockQuantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${item.product.stockQuantity} items available`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      setQuantity(newQuantity);
      await updateQuantity(item.id, newQuantity);
      onQuantityChange?.(item.id, newQuantity);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
      setQuantity(item.quantity); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await removeItem(item.id);
      onRemove?.(item.id);
      toast({
        title: 'Item Removed',
        description: `${item.product.name} has been removed from your cart`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToWishlist = async () => {
    try {
      await addToWishlist(item.productId);
      await removeItem(item.id);
      onRemove?.(item.id);
      toast({
        title: 'Moved to Wishlist',
        description: `${item.product.name} has been moved to your wishlist`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move item to wishlist',
        variant: 'destructive',
      });
    }
  };

  const totalPrice = item.product.price * quantity;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Product Image */}
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
            {item.product.images.length > 0 ? (
              <Image
                src={item.product.images[0]!}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <span className="text-xs text-gray-400">No Image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <Link 
              href={`/products/${item.product.id}`}
              className="block font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
            >
              {item.product.name}
            </Link>
            <p className="text-sm text-gray-500">
              {formatPrice(item.product.price)} each
            </p>
            {!item.product.inStock && (
              <p className="text-sm text-red-600">Out of Stock</p>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || isLoading}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Input
              type="number"
              min="1"
              max={item.product.stockQuantity}
              value={quantity}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value) || 1;
                handleQuantityChange(newQuantity);
              }}
              className="h-8 w-16 text-center"
              disabled={isLoading}
            />
            
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= item.product.stockQuantity || isLoading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {formatPrice(totalPrice)}
            </p>
            {quantity > 1 && (
              <p className="text-sm text-gray-500">
                {formatPrice(item.product.price)} × {quantity}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemove}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            {showWishlistButton && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                onClick={handleMoveToWishlist}
                disabled={isLoading}
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CartItem;