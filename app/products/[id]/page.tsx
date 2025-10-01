'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  RefreshCw,
  ArrowLeft,
  Share2,
  Minus,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/products/product-card';
import { ProductImageGallery } from '@/components/products/product-image-gallery';
import { ProductReviewsSection } from '@/components/products/product-reviews-section';
import { ProductSpecifications } from '@/components/products/product-specifications';
import { ProductRelated } from '@/components/products/product-related';
import { ProductImageZoom } from '@/components/products/product-image-zoom';

interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    reviews: Array<{
      id: string;
      user: {
        name: string;
        avatar?: string;
      };
      rating: number;
      comment: string;
      createdAt: string;
    }>;
  };
  specifications: Array<{
    name: string;
    value: string;
  }>;
  relatedProducts: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    inStock: boolean;
    category: {
      name: string;
      slug: string;
    };
  }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      router.push('/404');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      toast({
        title: 'Added to Cart',
        description: `${product.name} has been added to your cart`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    
    try {
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update wishlist',
        variant: 'destructive',
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Product not found
          </h1>
          <p className="text-gray-600 mb-4">
            The product you're looking for doesn't exist
          </p>
          <Button onClick={() => router.push('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span>/</span>
          <span>{product.category.name}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <ProductImageGallery
              images={product.images}
              productName={product.name}
              className="cursor-pointer"
              onClick={() => setIsImageZoomOpen(true)}
            />
            
            <ProductImageZoom
              images={product.images}
              productName={product.name}
              isOpen={isImageZoomOpen}
              onClose={() => setIsImageZoomOpen(false)}
              initialIndex={selectedImage}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{product.category.name}</Badge>
                {!product.inStock && (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(product.reviews.averageRating)}
                  <span className="text-sm text-gray-600 ml-2">
                    ({product.reviews.totalReviews} reviews)
                  </span>
                </div>
              </div>
              
              <p className="text-3xl font-bold text-gray-900 mb-4">
                {formatPrice(product.price)}
              </p>
              
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">In Stock</span>
                  {product.stockQuantity <= 10 && (
                    <span className="text-sm text-orange-600">
                      (Only {product.stockQuantity} left!)
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isAddingToCart}
                  className="flex-1"
                  size="lg"
                >
                  {isAddingToCart ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleWishlistToggle}
                  className={`${
                    isInWishlist(product.id) 
                      ? 'text-red-600 border-red-600 hover:bg-red-50' 
                      : ''
                  }`}
                >
                  <Heart 
                    className={`h-5 w-5 ${
                      isInWishlist(product.id) ? 'fill-current' : ''
                    }`} 
                  />
                </Button>
                
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="h-4 w-4" />
                <span>Easy returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.reviews.totalReviews})</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-600 leading-relaxed">
                      {product.longDescription}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <ProductSpecifications
                specifications={product.specifications}
                productName={product.name}
              />
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <ProductReviewsSection
                productId={product.id}
                reviews={product.reviews.reviews}
                averageRating={product.reviews.averageRating}
                totalReviews={product.reviews.totalReviews}
                onReviewSubmit={async (review) => {
                  // TODO: Implement review submission
                  console.log('Submit review:', review);
                }}
              />
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Shipping Information</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Free shipping on orders over $50</li>
                        <li>• Standard shipping: 3-5 business days</li>
                        <li>• Express shipping: 1-2 business days</li>
                        <li>• International shipping available</li>
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Return Policy</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 30-day return window</li>
                        <li>• Items must be in original condition</li>
                        <li>• Free return shipping</li>
                        <li>• Refunds processed within 5-7 business days</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <ProductRelated
          productId={product.id}
          categoryId={product.category.id}
          className="mt-16"
        />
      </div>
    </div>
  );
}