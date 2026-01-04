'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, X, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { CartItem } from './cart-item';
import { CartSummary } from './cart-summary';

export function CartSidebar() {
  const { isOpen, closeCart, items, itemCount, subtotal, total } = useCart();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    closeCart();
    router.push('/products');
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {itemCount > 0 && (
              <Badge variant="secondary">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {itemCount === 0 ? (
            // Empty Cart
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-500 mb-6">
                Add some items to get started
              </p>
              <Button onClick={handleContinueShopping} className="w-full">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      showWishlistButton={true}
                    />
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Cart Summary */}
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatPrice(total - subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {subtotal >= 50 ? 'Free' : '$9.99'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleCheckout} 
                    className="w-full"
                    size="lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button 
                    onClick={handleContinueShopping} 
                    variant="outline" 
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>

                {/* Security Badges */}
                <div className="flex justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>🔒</span>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>🚚</span>
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>↩️</span>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CartSidebar;