// ── All shared TypeScript interfaces for Krishna Enterprises ──────────────────

export interface Address {
  _id?: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  addresses: Address[];
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: Category | string;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  unit: string;
  isActive: boolean;
  featured: boolean;
  tags?: string[];
  isInStock: boolean;
  discount?: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}

export interface OrderItem {
  product: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  deliverySlot: 'morning' | 'afternoon' | 'evening';
  paymentMethod: 'COD' | 'online' | 'UPI' | 'UPI_QR';
  transaction_id?: string | null;
  upiTransactionId?: string | null;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  notes?: string;
  cancelReason?: string;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  ordersByStatus: Record<string, number>;
  topProducts: { product: Product; totalSold: number }[];
  lowStockProducts: Product[];
  recentOrders: Order[];
  monthlyRevenue: { month: string; revenue: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pages?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}
