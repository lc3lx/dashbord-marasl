// User types
export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: "admin" | "customer" | "employee"
  status: "active" | "inactive" | "suspended"
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Order types
export interface Order {
  _id: string
  orderNumber: string
  customerId: string
  customerName: string
  items: OrderItem[]
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  shippingAddress: Address
  paymentMethod: string
  paymentStatus: "pending" | "paid" | "failed"
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

// Shipment types
export interface Shipment {
  _id: string
  trackingNumber: string
  orderId: string
  customerId: string
  shippingCompany: string
  status: "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled"
  origin: Address
  destination: Address
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  cost: number
  estimatedDelivery?: string
  actualDelivery?: string
  createdAt: string
  updatedAt: string
}

// Wallet types
export interface Wallet {
  _id: string
  customerId: string
  balance: number
  currency: string
  transactions: Transaction[]
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  _id: string
  walletId: string
  customerId: string
  type: "credit" | "debit"
  amount: number
  description: string
  status: "pending" | "completed" | "failed"
  method?: string
  moyasarPaymentId?: string
  createdAt: string
  updatedAt: string
}

// Address types
export interface Address {
  street: string
  city: string
  state?: string
  country: string
  postalCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

// Announcement types
export interface Announcement {
  _id: string
  title: string
  content: string
  type: "info" | "warning" | "success" | "error"
  priority: "low" | "medium" | "high"
  targetAudience: "all" | "customers" | "employees"
  isActive: boolean
  startDate?: string
  endDate?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Notification types
export interface Notification {
  _id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  link?: string
  createdAt: string
}

// Coupon types
export interface Coupon {
  _id: string
  code: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usageCount: number
  isActive: boolean
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// Shipping Company types
export interface ShippingCompany {
  _id: string
  name: string
  nameAr: string
  logo?: string
  isActive: boolean
  apiKey?: string
  apiEndpoint?: string
  supportedCities: string[]
  pricing: {
    basePrice: number
    perKgPrice: number
  }
  createdAt: string
  updatedAt: string
}

// Package types
export interface Package {
  _id: string
  name: string
  nameAr: string
  description: string
  price: number
  duration: number // in days
  features: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Dashboard Stats types
export interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalShipments: number
  activeUsers: number
  pendingOrders: number
  deliveredShipments: number
  recentActivities: Activity[]
}

export interface Activity {
  _id: string
  type: string
  description: string
  userId?: string
  userName?: string
  timestamp: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
