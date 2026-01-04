-- Add indexes for better performance
-- This migration adds database indexes to improve query performance

-- User table indexes
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users"("createdAt");

-- Category table indexes
CREATE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "idx_categories_parent_id" ON "categories"("parentId");
CREATE INDEX IF NOT EXISTS "idx_categories_name" ON "categories"("name");

-- Product table indexes
CREATE INDEX IF NOT EXISTS "idx_products_slug" ON "products"("slug");
CREATE INDEX IF NOT EXISTS "idx_products_sku" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_products_price" ON "products"("price");
CREATE INDEX IF NOT EXISTS "idx_products_is_active" ON "products"("isActive");
CREATE INDEX IF NOT EXISTS "idx_products_is_featured" ON "products"("isFeatured");
CREATE INDEX IF NOT EXISTS "idx_products_created_at" ON "products"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_products_stock" ON "products"("stock");

-- Order table indexes
CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "orders"("userId");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_orders_order_number" ON "orders"("orderNumber");

-- Order item table indexes
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "idx_order_items_product_id" ON "order_items"("productId");

-- Review table indexes
CREATE INDEX IF NOT EXISTS "idx_reviews_user_id" ON "reviews"("userId");
CREATE INDEX IF NOT EXISTS "idx_reviews_product_id" ON "reviews"("productId");
CREATE INDEX IF NOT EXISTS "idx_reviews_rating" ON "reviews"("rating");
CREATE INDEX IF NOT EXISTS "idx_reviews_created_at" ON "reviews"("createdAt");

-- Wishlist item table indexes
CREATE INDEX IF NOT EXISTS "idx_wishlist_items_user_id" ON "wishlist_items"("userId");
CREATE INDEX IF NOT EXISTS "idx_wishlist_items_product_id" ON "wishlist_items"("productId");

-- Cart item table indexes
CREATE INDEX IF NOT EXISTS "idx_cart_items_user_id" ON "cart_items"("userId");
CREATE INDEX IF NOT EXISTS "idx_cart_items_product_id" ON "cart_items"("productId");

-- Account table indexes
CREATE INDEX IF NOT EXISTS "idx_accounts_user_id" ON "accounts"("userId");
CREATE INDEX IF NOT EXISTS "idx_accounts_provider" ON "accounts"("provider");

-- Session table indexes
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS "idx_sessions_session_token" ON "sessions"("sessionToken");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires" ON "sessions"("expires");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_products_category_active" ON "products"("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS "idx_products_featured_active" ON "products"("isFeatured", "isActive");
CREATE INDEX IF NOT EXISTS "idx_orders_user_status" ON "orders"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_reviews_product_rating" ON "reviews"("productId", "rating");




