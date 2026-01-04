'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/client-logger';

interface CartSummaryProps {
  className?: string;
  showCheckoutButton?: boolean;
  showPromoCode?: boolean;
  showShippingInfo?: boolean;
}

export function CartSummary({ 
  className = '',
  showCheckoutButton = true,
  showPromoCode = true,
  showShippingInfo = true
}: CartSummaryProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const { items, subtotal, tax, shipping, total, itemCount } = useCart();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handlePromoCodeApply = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    try {
      // TODO: Implement promo code logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      // For now, just show a message
      clientLogger.info('Promo code applied', { promoCode });
    } catch (error) {
      clientLogger.error('Failed to apply promo code', { promoCode }, error instanceof Error ? error : undefined);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  if (itemCount === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-500 mb-4">
            Add some items to get started
          </p>
          <Button onClick={handleContinueShopping} className="w-full">
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Item Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <Badge variant="secondary">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        <Separator />

        {/* Promo Code */}
        {showPromoCode && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Promo Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handlePromoCodeApply}
                disabled={!promoCode.trim() || isApplyingPromo}
              >
                {isApplyingPromo ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">{formatPrice(tax)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? 'Free' : formatPrice(shipping)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* Shipping Info */}
        {showShippingInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="h-4 w-4" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Secure checkout with SSL encryption</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showCheckoutButton && (
          <div className="space-y-2 pt-4">
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
        )}

        {/* Security Badges */}
        <div className="flex justify-center gap-4 pt-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Shield className="h-3 w-3" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Truck className="h-3 w-3" />
            <span>Fast Delivery</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <RefreshCw className="h-3 w-3" />
            <span>Easy Returns</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CartSummary;