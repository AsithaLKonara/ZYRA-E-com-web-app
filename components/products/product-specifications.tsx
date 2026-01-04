'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Package, Truck, Shield } from 'lucide-react';

interface Specification {
  name: string;
  value: string;
  category?: string;
}

interface ProductSpecificationsProps {
  specifications: Specification[];
  productName: string;
  className?: string;
}

export function ProductSpecifications({ 
  specifications, 
  productName,
  className = "" 
}: ProductSpecificationsProps) {
  // Group specifications by category
  const groupedSpecs = specifications.reduce((acc, spec) => {
    const category = spec.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(spec);
    return acc;
  }, {} as Record<string, Specification[]>);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'general':
        return <Settings className="h-5 w-5" />;
      case 'dimensions':
      case 'size':
        return <Package className="h-5 w-5" />;
      case 'shipping':
      case 'delivery':
        return <Truck className="h-5 w-5" />;
      case 'warranty':
      case 'guarantee':
        return <Shield className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Product Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedSpecs).map(([category, specs], categoryIndex) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  {getCategoryIcon(category)}
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specs.map((spec, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-700 flex-1">
                        {spec.name}
                      </span>
                      <span className="text-gray-600 font-medium ml-4">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {categoryIndex < Object.keys(groupedSpecs).length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">Package Contents</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {productName}</li>
              <li>• User Manual</li>
              <li>• Warranty Card</li>
              <li>• Original Packaging</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">Shipping Info</h4>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Free shipping on orders over $50</p>
              <p>• Standard: 3-5 business days</p>
              <p>• Express: 1-2 business days</p>
              <p>• International shipping available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold">Warranty & Support</h4>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 1-year manufacturer warranty</p>
              <p>• 30-day return policy</p>
              <p>• 24/7 customer support</p>
              <p>• Extended warranty available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


