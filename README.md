# 👗 ZYRA - Premium Women's Fashion E-Commerce Platform

**An elegant, sophisticated e-commerce platform designed exclusively for modern women's fashion. Built with Next.js 14, TypeScript, and cutting-edge web technologies.**

![ZYRA Fashion](./branding-resources/Cover.png)

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 About ZYRA

**ZYRA** is more than just an e-commerce platform – it's a celebration of women's fashion, style, and individuality. We offer a curated collection of premium clothing, accessories, and fashion essentials for the modern woman who values quality, elegance, and self-expression.

### Our Vision
To empower women through fashion by providing a seamless online shopping experience that combines style, comfort, and sophistication.

### Our Collections
- 👚 **Casual Wear** - Everyday comfort meets style
- 👗 **Formal Dresses** - Elegant pieces for special occasions
- 🧥 **Outerwear** - Stylish coats and jackets
- 👖 **Bottoms** - Premium pants, skirts, and more
- 👕 **Tops** - Blouses, shirts, and tunics
- 👙 **Activewear** - Fashion-forward fitness wear
- 👜 **Accessories** - Complete your look

---

## 🚀 Features

### Core E-commerce Features
- ✨ **Product Catalog**: Beautifully organized collections with detailed product information
- 🛒 **Smart Shopping Cart**: Persistent cart with size/color selection
- 💝 **Wishlist**: Save favorites for later
- 📦 **Order Management**: Track orders from purchase to delivery
- 💳 **Secure Payments**: Stripe integration with multiple payment methods
- 🔐 **User Authentication**: Social login (Google, GitHub) and email authentication
- 👑 **Admin Dashboard**: Comprehensive management tools for store administrators

### Fashion-Specific Features
- 👗 **Size Guides**: Detailed sizing information for each product
- 🎨 **Color Variants**: Multiple color options with accurate representations
- 📸 **High-Quality Images**: Multiple product images and zoom functionality
- ⭐ **Customer Reviews**: Real feedback from verified buyers
- 💄 **Style Recommendations**: AI-powered outfit suggestions
- 📱 **Fashion Reels**: TikTok-style short videos showcasing products
- 🔍 **Advanced Search**: Filter by size, color, style, price, and more

### Premium Features
- 📧 **Email Notifications**: Order confirmations, shipping updates, and promotions
- 🎁 **Gift Cards**: Digital gift cards for special occasions
- 🏷️ **Loyalty Program**: Rewards for repeat customers
- 📊 **Analytics**: Track fashion trends and customer preferences
- 🌍 **Multi-Currency**: Support for international customers
- 🚚 **Shipping Options**: Standard, express, and free shipping tiers
- 💬 **Customer Support**: Real-time chat and email support

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Beautiful, accessible components
- **Zustand** - Lightweight state management
- **React Hook Form** - Elegant form handling
- **Framer Motion** - Smooth animations

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Secure authentication
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Robust relational database
- **Stripe** - Payment processing
- **Resend** - Transactional emails
- **Vercel Blob Storage** - Image and file storage

### DevOps & Monitoring
- **Vercel** - Deployment and hosting
- **Sentry** - Error tracking
- **Google Analytics** - User analytics
- **Playwright** - E2E testing
- **Jest** - Unit testing

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Stripe account
- Resend account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AsithaLKonara/ZYRA-E-com-web-app.git
cd ZYRA-E-com-web-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to http://localhost:3000

---

## 🎨 Brand Identity

### Color Palette
ZYRA uses an elegant and feminine color scheme:
- **Primary**: Soft Rose (#E91E63)
- **Secondary**: Deep Purple (#9C27B0)
- **Accent**: Gold (#FFD700)
- **Neutral**: Soft Gray (#F5F5F5)
- **Dark**: Charcoal (#2C2C2C)

### Typography
- **Headings**: Playfair Display (elegant serif)
- **Body**: Inter (clean sans-serif)

### Brand Voice
- Elegant yet approachable
- Empowering and confident
- Fashion-forward and trendy
- Customer-centric and supportive

---

## 📚 Documentation

### User Guides
- [Shopping Guide](docs/USER_GUIDE.md) - How to shop on ZYRA
- [Size Guide](docs/SIZE_GUIDE.md) - Finding your perfect fit
- [Return Policy](docs/RETURN_POLICY.md) - Hassle-free returns

### Developer Guides
- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - Setup and development
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Architecture](docs/ARCHITECTURE.md) - System architecture

### Admin Guides
- [Admin Guide](docs/ADMIN_GUIDE.md) - Managing your store
- [Product Management](docs/PRODUCT_MANAGEMENT.md) - Adding products
- [Order Management](docs/ORDER_MANAGEMENT.md) - Processing orders

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out

### Products
- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/[id]` - Update product (admin)
- `DELETE /api/products/[id]` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]` - Update order status (admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/[id]` - Update cart item
- `DELETE /api/cart/[id]` - Remove from cart

[View Full API Documentation](docs/API_DOCUMENTATION.md)

---

## 🎯 Product Categories

### Women's Clothing
1. **Dresses**
   - Casual Dresses
   - Formal Dresses
   - Party Dresses
   - Maxi Dresses
   - Mini Dresses

2. **Tops**
   - Blouses
   - T-Shirts
   - Crop Tops
   - Tunics
   - Tank Tops

3. **Bottoms**
   - Jeans
   - Pants
   - Skirts
   - Shorts
   - Leggings

4. **Outerwear**
   - Jackets
   - Coats
   - Blazers
   - Cardigans

5. **Activewear**
   - Sports Bras
   - Leggings
   - Track Suits
   - Yoga Wear

### Accessories
- Bags & Purses
- Jewelry
- Scarves & Wraps
- Belts
- Hats & Caps

---

## 🔒 Security Features

### Customer Security
- Secure password hashing (bcrypt)
- JWT token authentication
- HTTP-only cookies
- CSRF protection
- XSS prevention
- Rate limiting

### Payment Security
- PCI-compliant Stripe integration
- Secure payment processing
- Encrypted data transmission
- Fraud detection

### Data Protection
- GDPR compliant
- Data encryption
- Secure file storage
- Regular security audits

---

## 📊 Analytics & Insights

### Customer Analytics
- Shopping behavior tracking
- Conversion rate optimization
- Cart abandonment analysis
- Product performance metrics

### Fashion Insights
- Trending products
- Popular colors and sizes
- Seasonal trends
- Customer preferences

---

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy with one click

[Detailed Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

### Other Platforms
- Netlify
- Railway
- DigitalOcean
- AWS Amplify

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test suite
npm test -- products
```

---

## 🤝 Contributing

We welcome contributions to make ZYRA even better!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

[Contribution Guidelines](CONTRIBUTING.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help
- 📧 **Email**: support@zyra-fashion.com
- 💬 **Live Chat**: Available on our website
- 📱 **Social Media**: @zyra_fashion

### Community
- [Discord Server](https://discord.gg/zyra)
- [Twitter](https://twitter.com/zyra_fashion)
- [Instagram](https://instagram.com/zyra_fashion)
- [Facebook](https://facebook.com/zyra.fashion)

---

## 🗺️ Roadmap

### Coming Soon
- [ ] Mobile app (iOS & Android)
- [ ] Virtual try-on with AR
- [ ] Personal stylist AI
- [ ] Subscription boxes
- [ ] International shipping
- [ ] Multi-language support
- [ ] Loyalty rewards program
- [ ] Fashion blog integration

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Stripe for secure payment processing
- All our contributors and customers

---

## 📞 Contact

- **Website**: https://zyra-fashion.com
- **Email**: hello@zyra-fashion.com
- **Instagram**: @zyra_fashion
- **Twitter**: @zyra_fashion
- **GitHub**: [AsithaLKonara/ZYRA-E-com-web-app](https://github.com/AsithaLKonara/ZYRA-E-com-web-app)

---

**Built with 💖 for women who love fashion**

*ZYRA - Where Style Meets Elegance*
