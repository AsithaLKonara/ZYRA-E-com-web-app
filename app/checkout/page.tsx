'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface CheckoutForm {
  email: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardDetails: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    name: string;
  };
  sameAsShipping: boolean;
  saveInfo: boolean;
  newsletter: boolean;
  terms: boolean;
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, itemCount, subtotal, tax, shipping, total, clearCart } = useCart();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutForm>({
    email: session?.user?.email || '',
    shippingAddress: {
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phone: '',
    },
    billingAddress: {
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phone: '',
    },
    paymentMethod: 'card',
    cardDetails: {
      number: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      name: '',
    },
    sameAsShipping: true,
    saveInfo: false,
    newsletter: false,
    terms: false,
  });

  const steps = [
    { id: 1, name: 'Shipping', description: 'Delivery information' },
    { id: 2, name: 'Payment', description: 'Payment method' },
    { id: 3, name: 'Review', description: 'Order summary' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CheckoutForm],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSameAsShippingChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsShipping: checked,
      billingAddress: checked ? prev.shippingAddress : prev.billingAddress,
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.email &&
          formData.shippingAddress.firstName &&
          formData.shippingAddress.lastName &&
          formData.shippingAddress.address1 &&
          formData.shippingAddress.city &&
          formData.shippingAddress.state &&
          formData.shippingAddress.zipCode
        );
      case 2:
        if (formData.paymentMethod === 'card') {
          return !!(
            formData.cardDetails.number &&
            formData.cardDetails.expiryMonth &&
            formData.cardDetails.expiryYear &&
            formData.cardDetails.cvv &&
            formData.cardDetails.name
          );
        }
        return true;
      case 3:
        return formData.terms;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast({
        title: 'Please fill in all required fields',
        description: 'Make sure all required information is provided',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast({
        title: 'Please accept the terms and conditions',
        description: 'You must accept the terms to proceed',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: formData.shippingAddress,
          billingAddress: formData.sameAsShipping 
            ? formData.shippingAddress 
            : formData.billingAddress,
          paymentMethod: formData.paymentMethod,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();

      // Process payment
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: formData.paymentMethod,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment processing failed');
      }

      const payment = await paymentResponse.json();

      // Clear cart
      clearCart();

      // Redirect to success page
      router.push(`/checkout/success?orderId=${order.id}&paymentId=${payment.paymentId}`);
    } catch (error: any) {
      toast({
        title: 'Checkout failed',
        description: error.message || 'An error occurred during checkout',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-4">
            Add some items to your cart before checking out
          </p>
          <Button onClick={() => router.push('/products')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      currentStep >= step.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && 'Shipping Information'}
                  {currentStep === 2 && 'Payment Method'}
                  {currentStep === 3 && 'Order Review'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Step 1: Shipping */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.shippingAddress.firstName}
                          onChange={(e) => handleInputChange('shippingAddress.firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.shippingAddress.lastName}
                          onChange={(e) => handleInputChange('shippingAddress.lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address1">Address Line 1 *</Label>
                      <Input
                        id="address1"
                        value={formData.shippingAddress.address1}
                        onChange={(e) => handleInputChange('shippingAddress.address1', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="address2">Address Line 2</Label>
                      <Input
                        id="address2"
                        value={formData.shippingAddress.address2}
                        onChange={(e) => handleInputChange('shippingAddress.address2', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.shippingAddress.city}
                          onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.shippingAddress.state}
                          onChange={(e) => handleInputChange('shippingAddress.state', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={formData.shippingAddress.zipCode}
                          onChange={(e) => handleInputChange('shippingAddress.zipCode', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.shippingAddress.phone}
                        onChange={(e) => handleInputChange('shippingAddress.phone', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label>Payment Method *</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Button
                          variant={formData.paymentMethod === 'card' ? 'default' : 'outline'}
                          onClick={() => handleInputChange('paymentMethod', 'card')}
                          className="flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Credit Card
                        </Button>
                        <Button
                          variant={formData.paymentMethod === 'paypal' ? 'default' : 'outline'}
                          onClick={() => handleInputChange('paymentMethod', 'paypal')}
                          className="flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          PayPal
                        </Button>
                      </div>
                    </div>

                    {formData.paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number *</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={formData.cardDetails.number}
                            onChange={(e) => handleInputChange('cardDetails.number', e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryMonth">Expiry Month *</Label>
                            <Input
                              id="expiryMonth"
                              placeholder="MM"
                              value={formData.cardDetails.expiryMonth}
                              onChange={(e) => handleInputChange('cardDetails.expiryMonth', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="expiryYear">Expiry Year *</Label>
                            <Input
                              id="expiryYear"
                              placeholder="YYYY"
                              value={formData.cardDetails.expiryYear}
                              onChange={(e) => handleInputChange('cardDetails.expiryYear', e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cvv">CVV *</Label>
                            <Input
                              id="cvv"
                              placeholder="123"
                              value={formData.cardDetails.cvv}
                              onChange={(e) => handleInputChange('cardDetails.cvv', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cardName">Name on Card *</Label>
                            <Input
                              id="cardName"
                              value={formData.cardDetails.name}
                              onChange={(e) => handleInputChange('cardDetails.name', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sameAsShipping"
                          checked={formData.sameAsShipping}
                          onCheckedChange={handleSameAsShippingChange}
                        />
                        <Label htmlFor="sameAsShipping">
                          Billing address same as shipping
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="saveInfo"
                          checked={formData.saveInfo}
                          onCheckedChange={(checked) => handleInputChange('saveInfo', checked)}
                        />
                        <Label htmlFor="saveInfo">
                          Save this information for next time
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                              {item.product.images.length > 0 ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                  <span className="text-xs text-gray-400">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product.name}</h4>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="newsletter"
                          checked={formData.newsletter}
                          onCheckedChange={(checked) => handleInputChange('newsletter', checked)}
                        />
                        <Label htmlFor="newsletter">
                          Subscribe to our newsletter for updates and special offers
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms"
                          checked={formData.terms}
                          onCheckedChange={(checked) => handleInputChange('terms', checked)}
                          required
                        />
                        <Label htmlFor="terms">
                          I agree to the{' '}
                          <a href="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </a>
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Place Order
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4" />
                    <span>Free shipping on orders over $50</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}