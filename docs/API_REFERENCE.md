# ZYRA Fashion - API Reference

## Overview

This API reference provides comprehensive documentation for all ZYRA Fashion API endpoints, including request/response formats, authentication, error handling, and code examples.

## Base Information

- **Base URL**: `https://zyra-ultra.vercel.app/api`
- **API Version**: v1
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer Token

## Authentication

### Getting a Token

```bash
curl -X POST https://zyra-ultra.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Using the Token

```bash
curl -X GET https://zyra-ultra.vercel.app/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Additional error details
  }
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting

- **General endpoints**: 100 requests/minute
- **Authentication**: 10 requests/minute
- **Admin endpoints**: 50 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Authentication

#### POST /auth/signin
Sign in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER"
    },
    "session": {
      "token": "jwt_token",
      "expiresAt": "2024-01-01T01:00:00Z"
    }
  }
}
```

#### POST /auth/signup
Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "isActive": true,
      "emailVerified": false
    }
  },
  "message": "User registered successfully"
}
```

#### GET /auth/session
Get current user session.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "isActive": true,
      "emailVerified": true
    }
  }
}
```

#### POST /auth/signout
Sign out current user.

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### Products

#### GET /products
Get all products with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): Filter by category slug
- `search` (optional): Search term
- `sort` (optional): Sort field (price, name, createdAt)
- `order` (optional): Sort order (asc, desc)

**Example:**
```bash
curl -X GET "https://zyra-ultra.vercel.app/api/products?page=1&limit=20&category=electronics&search=laptop&sort=price&order=asc"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "MacBook Pro",
        "description": "Powerful laptop for professionals",
        "price": 1999.99,
        "imageUrl": ["https://example.com/image1.jpg"],
        "category": {
          "id": "uuid",
          "name": "Electronics",
          "slug": "electronics"
        },
        "stock": 10,
        "sku": "MBP-001",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /products/{id}
Get a specific product by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "MacBook Pro",
      "description": "Powerful laptop for professionals",
      "price": 1999.99,
      "imageUrl": ["https://example.com/image1.jpg"],
      "category": {
        "id": "uuid",
        "name": "Electronics",
        "slug": "electronics"
      },
      "stock": 10,
      "sku": "MBP-001",
      "isActive": true,
      "reviews": [
        {
          "id": "uuid",
          "rating": 5,
          "comment": "Excellent product!",
          "user": {
            "name": "John Doe"
          },
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### POST /products
Create a new product (Admin only).

**Request:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "imageUrl": ["https://example.com/image.jpg"],
  "categoryId": "uuid",
  "stock": 50,
  "sku": "NP-001",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "New Product",
      "description": "Product description",
      "price": 99.99,
      "imageUrl": ["https://example.com/image.jpg"],
      "categoryId": "uuid",
      "stock": 50,
      "sku": "NP-001",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Product created successfully"
}
```

#### PUT /products/{id}
Update a product (Admin only).

**Request:**
```json
{
  "name": "Updated Product Name",
  "price": 149.99,
  "stock": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "Updated Product Name",
      "price": 149.99,
      "stock": 25,
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Product updated successfully"
}
```

#### DELETE /products/{id}
Delete a product (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Categories

#### GET /categories
Get all categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and accessories",
        "imageUrl": "https://example.com/category.jpg",
        "productCount": 25,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### GET /categories/{slug}
Get a specific category by slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices and accessories",
      "imageUrl": "https://example.com/category.jpg",
      "products": [
        {
          "id": "uuid",
          "name": "Product Name",
          "price": 99.99,
          "imageUrl": ["https://example.com/image.jpg"]
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Shopping Cart

#### GET /cart
Get user's shopping cart.

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "price": 99.99,
            "imageUrl": ["https://example.com/image.jpg"]
          }
        }
      ],
      "totalItems": 2,
      "totalPrice": 199.98,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### POST /cart
Add item to cart.

**Request:**
```json
{
  "productId": "uuid",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cartItem": {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 1,
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "price": 99.99
      }
    }
  },
  "message": "Item added to cart successfully"
}
```

#### PUT /cart/{productId}
Update cart item quantity.

**Request:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cartItem": {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 3,
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "price": 99.99
      }
    }
  },
  "message": "Cart item updated successfully"
}
```

#### DELETE /cart/{productId}
Remove item from cart.

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

#### DELETE /cart
Clear entire cart.

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

### Orders

#### GET /orders
Get user's orders with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by order status

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-001",
        "status": "COMPLETED",
        "paymentStatus": "PAID",
        "totalAmount": 199.98,
        "shippingAddress": {
          "firstName": "John",
          "lastName": "Doe",
          "address1": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "US"
        },
        "items": [
          {
            "id": "uuid",
            "productId": "uuid",
            "quantity": 2,
            "price": 99.99,
            "product": {
              "name": "Product Name",
              "imageUrl": ["https://example.com/image.jpg"]
            }
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### GET /orders/{id}
Get a specific order by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-001",
      "status": "COMPLETED",
      "paymentStatus": "PAID",
      "totalAmount": 199.98,
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      },
      "billingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      },
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "price": 99.99,
          "product": {
            "name": "Product Name",
            "imageUrl": ["https://example.com/image.jpg"]
          }
        }
      ],
      "paymentIntentId": "pi_xxx",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### POST /orders
Create a new order.

**Request:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "notes": "Please deliver during business hours"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-001",
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "totalAmount": 199.98,
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      },
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "price": 99.99
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Order created successfully"
}
```

### Payments

#### POST /payments/create-intent
Create a Stripe payment intent.

**Request:**
```json
{
  "orderId": "uuid",
  "amount": 19998
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

#### POST /payments/confirm
Confirm a payment.

**Request:**
```json
{
  "paymentIntentId": "pi_xxx",
  "paymentMethodId": "pm_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "paymentIntentId": "pi_xxx",
    "status": "succeeded"
  }
}
```

#### POST /payments/cancel
Cancel a payment.

**Request:**
```json
{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "paymentIntentId": "pi_xxx",
    "status": "canceled"
  }
}
```

#### POST /payments/refund
Process a refund.

**Request:**
```json
{
  "orderId": "uuid",
  "amount": 9999,
  "reason": "Customer requested refund"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "refundId": "re_xxx",
    "status": "succeeded",
    "amount": 9999
  }
}
```

### Admin Endpoints

#### GET /admin/users
Get all users (Admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by user role
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "CUSTOMER",
        "isActive": true,
        "emailVerified": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### PUT /admin/users/{id}
Update a user (Admin only).

**Request:**
```json
{
  "role": "ADMIN",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "isActive": true,
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "User updated successfully"
}
```

#### GET /admin/analytics
Get analytics data (Admin only).

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y)
- `metric` (optional): Metric type (revenue, orders, users, products)

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "revenue": {
        "total": 50000.00,
        "growth": 15.5,
        "period": "30d"
      },
      "orders": {
        "total": 250,
        "growth": 8.2,
        "period": "30d"
      },
      "users": {
        "total": 1500,
        "growth": 12.1,
        "period": "30d"
      },
      "products": {
        "total": 100,
        "active": 95,
        "period": "30d"
      }
    }
  }
}
```

### File Upload

#### POST /upload
Upload a file.

**Request:**
```
Content-Type: multipart/form-data

file: <file>
filename: "document.pdf"
access: "public"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://blob.vercel-storage.com/file.pdf",
    "pathname": "file.pdf",
    "contentType": "application/pdf",
    "size": 1024000
  }
}
```

#### POST /upload/image
Upload and optimize an image.

**Request:**
```
Content-Type: multipart/form-data

file: <image-file>
filename: "product.jpg"
access: "public"
width: 800
height: 600
quality: 80
format: "webp"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://blob.vercel-storage.com/product_optimized.webp",
    "pathname": "product_optimized.webp",
    "contentType": "image/webp",
    "size": 512000
  }
}
```

#### DELETE /upload/delete
Delete a file.

**Request:**
```json
{
  "url": "https://blob.vercel-storage.com/file.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Search

#### GET /search
Search products.

**Query Parameters:**
- `q` (required): Search query
- `category` (optional): Filter by category
- `price_min` (optional): Minimum price
- `price_max` (optional): Maximum price
- `sort` (optional): Sort field
- `order` (optional): Sort order

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "MacBook Pro",
        "description": "Powerful laptop for professionals",
        "price": 1999.99,
        "imageUrl": ["https://example.com/image.jpg"],
        "category": {
          "name": "Electronics",
          "slug": "electronics"
        },
        "relevanceScore": 0.95
      }
    ],
    "total": 15,
    "query": "laptop",
    "filters": {
      "category": "electronics",
      "price_min": 100,
      "price_max": 2000
    }
  }
}
```

### Reviews

#### GET /reviews
Get product reviews.

**Query Parameters:**
- `productId` (required): Product ID
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Excellent product!",
        "user": {
          "name": "John Doe"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 25,
      "ratingDistribution": {
        "5": 15,
        "4": 7,
        "3": 2,
        "2": 1,
        "1": 0
      }
    }
  }
}
```

#### POST /reviews
Create a product review.

**Request:**
```json
{
  "productId": "uuid",
  "rating": 5,
  "comment": "Excellent product! Highly recommended."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "uuid",
      "productId": "uuid",
      "userId": "uuid",
      "rating": 5,
      "comment": "Excellent product! Highly recommended.",
      "user": {
        "name": "John Doe"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Review created successfully"
}
```

## Error Codes

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `VALIDATION_ERROR` | Input validation failed | Check request body format |
| `AUTHENTICATION_REQUIRED` | User not authenticated | Include valid JWT token |
| `AUTHORIZATION_DENIED` | Insufficient permissions | Check user role |
| `RESOURCE_NOT_FOUND` | Resource doesn't exist | Verify resource ID |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait before retrying |
| `PAYMENT_FAILED` | Payment processing failed | Check payment details |
| `INSUFFICIENT_STOCK` | Product out of stock | Reduce quantity or choose different product |

### Error Response Examples

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

#### Authentication Error
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please sign in to access this resource"
}
```

#### Authorization Error
```json
{
  "success": false,
  "error": "Access denied",
  "message": "Admin privileges required"
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```typescript
import { NeoshopClient } from '@zyra/sdk'

const client = new NeoshopClient({
  baseUrl: 'https://zyra-ultra.vercel.app/api',
  apiKey: 'your-api-key'
})

// Get products
const products = await client.products.list({
  page: 1,
  limit: 20,
  category: 'electronics'
})

// Create order
const order = await client.orders.create({
  items: [{ productId: 'uuid', quantity: 2 }],
  shippingAddress: { /* address */ }
})
```

### Python

```python
from zyra import NeoshopClient

client = NeoshopClient(
    base_url='https://zyra-ultra.vercel.app/api',
    api_key='your-api-key'
)

# Get products
products = client.products.list(
    page=1,
    limit=20,
    category='electronics'
)

# Create order
order = client.orders.create({
    'items': [{'productId': 'uuid', 'quantity': 2}],
    'shippingAddress': { /* address */ }
})
```

## Webhooks

### Stripe Webhooks

The API automatically handles Stripe webhooks for payment events:

- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed

### Custom Webhooks

You can subscribe to custom events:

```http
POST /api/webhooks/subscribe
```

**Request:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["order.created", "order.updated", "user.registered"]
}
```

## Testing

### Postman Collection

Import the Postman collection for easy API testing:

[Download Postman Collection](./postman/zyra-ultra-api.json)

### cURL Examples

#### Get Products
```bash
curl -X GET "https://zyra-ultra.vercel.app/api/products?page=1&limit=20" \
  -H "Authorization: Bearer your-jwt-token"
```

#### Create Order
```bash
curl -X POST "https://zyra-ultra.vercel.app/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "items": [{"productId": "uuid", "quantity": 2}],
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "US"
    }
  }'
```

## Support

For API support, please contact:

- **Email**: api-support@zyra-ultra.com
- **Documentation**: [https://docs.zyra-ultra.com](https://docs.zyra-ultra.com)
- **GitHub**: [https://github.com/zyra-ultra/api](https://github.com/zyra-ultra/api)

---

**API Version**: 1.0.0  
**Last Updated**: January 2024




