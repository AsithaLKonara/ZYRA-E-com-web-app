import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductCard } from '@/components/products/product-card'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { useToast } from '@/hooks/use-toast'

// Mock the hooks
jest.mock('@/hooks/use-cart')
jest.mock('@/hooks/use-wishlist')
jest.mock('@/hooks/use-toast')

const mockUseCart = useCart as jest.MockedFunction<typeof useCart>
const mockUseWishlist = useWishlist as jest.MockedFunction<typeof useWishlist>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

const mockProduct = {
  id: '1',
  name: 'Test Product',
  description: 'A test product description',
  price: 99.99,
  images: ['/test-image.jpg'],
  inStock: true,
  stockQuantity: 10,
  tags: ['test', 'sample'],
  reviews: {
    averageRating: 4.5,
    totalReviews: 10,
  },
  category: {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
  },
}

describe('ProductCard', () => {
  const mockAddToCart = jest.fn()
  const mockAddToWishlist = jest.fn()
  const mockRemoveFromWishlist = jest.fn()
  const mockToast = jest.fn()

  beforeEach(() => {
    mockUseCart.mockReturnValue({
      addToCart: mockAddToCart,
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      items: [],
      isOpen: false,
      isLoading: false,
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      toggleCart: jest.fn(),
      openCart: jest.fn(),
      closeCart: jest.fn(),
    })

    mockUseWishlist.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: jest.fn().mockReturnValue(false),
      itemCount: 0,
      items: [],
      isLoading: false,
      clearWishlist: jest.fn(),
    })

    mockUseToast.mockReturnValue({
      toast: mockToast,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('A test product description')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('displays product rating correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('(10)')).toBeInTheDocument()
  })

  it('shows out of stock badge when product is not in stock', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false }
    render(<ProductCard product={outOfStockProduct} />)
    
    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
  })

  it('shows sale badge when product has sale tag', () => {
    const saleProduct = { ...mockProduct, tags: ['sale', 'test'] }
    render(<ProductCard product={saleProduct} />)
    
    expect(screen.getByText('Sale')).toBeInTheDocument()
  })

  it('calls addToCart when Add to Cart button is clicked', async () => {
    render(<ProductCard product={mockProduct} />)
    
    const addToCartButton = screen.getByText('Add to Cart')
    fireEvent.click(addToCartButton)
    
    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith('1', 1)
    })
  })

  it('shows loading state when adding to cart', async () => {
    mockUseCart.mockReturnValue({
      addToCart: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      items: [],
      isOpen: false,
      isLoading: false,
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      toggleCart: jest.fn(),
      openCart: jest.fn(),
      closeCart: jest.fn(),
    })

    render(<ProductCard product={mockProduct} />)
    
    const addToCartButton = screen.getByText('Add to Cart')
    fireEvent.click(addToCartButton)
    
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled()
  })

  it('disables Add to Cart button when product is out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false }
    render(<ProductCard product={outOfStockProduct} />)
    
    const addToCartButton = screen.getByText('Add to Cart')
    expect(addToCartButton).toBeDisabled()
  })

  it('shows stock warning when quantity is low', () => {
    const lowStockProduct = { ...mockProduct, stockQuantity: 3 }
    render(<ProductCard product={lowStockProduct} />)
    
    expect(screen.getByText('Only 3 left!')).toBeInTheDocument()
  })

  it('handles wishlist toggle correctly', async () => {
    const mockIsInWishlist = jest.fn().mockReturnValue(false)
    mockUseWishlist.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
      itemCount: 0,
      items: [],
      isLoading: false,
      clearWishlist: jest.fn(),
    })

    render(<ProductCard product={mockProduct} showQuickActions={true} />)
    
    // Hover to show quick actions
    const productCard = screen.getByRole('button', { name: /add to cart/i }).closest('.group')
    fireEvent.mouseEnter(productCard!)
    
    await waitFor(() => {
      const wishlistButton = screen.getByRole('button', { name: /heart/i })
      fireEvent.click(wishlistButton)
    })
    
    expect(mockAddToWishlist).toHaveBeenCalledWith('1')
  })

  it('shows correct wishlist state when item is in wishlist', () => {
    const mockIsInWishlist = jest.fn().mockReturnValue(true)
    mockUseWishlist.mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
      itemCount: 0,
      items: [],
      isLoading: false,
      clearWishlist: jest.fn(),
    })

    render(<ProductCard product={mockProduct} showQuickActions={true} />)
    
    // Hover to show quick actions
    const productCard = screen.getByRole('button', { name: /add to cart/i }).closest('.group')
    fireEvent.mouseEnter(productCard!)
    
    const wishlistButton = screen.getByRole('button', { name: /heart/i })
    expect(wishlistButton).toHaveClass('text-red-600')
  })

  it('renders product tags correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('sample')).toBeInTheDocument()
  })

  it('handles missing product image gracefully', () => {
    const productWithoutImage = { ...mockProduct, images: [] }
    render(<ProductCard product={productWithoutImage} />)
    
    expect(screen.getByText('No Image')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <ProductCard product={mockProduct} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('hides quick actions when showQuickActions is false', () => {
    render(<ProductCard product={mockProduct} showQuickActions={false} />)
    
    // Hover to check if quick actions appear
    const productCard = screen.getByRole('button', { name: /add to cart/i }).closest('.group')
    fireEvent.mouseEnter(productCard!)
    
    expect(screen.queryByRole('button', { name: /heart/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eye/i })).not.toBeInTheDocument()
  })
})




