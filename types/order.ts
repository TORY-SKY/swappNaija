export interface OrderType {
  id: string
  buyerId: string
  sellerId: string
  productId: string
  productTitle: string
  productImage?: string
  quantity: number
  amount: number
  orderDate: any
  paymentStatus: "pending" | "paid" | "failed"
  deliveryStatus: "pending" | "shipped" | "delivered" | "completed" | "cancelled"
  paymentReference?: string
  shippingAddress: {
    fullName: string
    phoneNumber: string
    street: string
    city: string
    state: string
    postalCode?: string
    country: string
  }
  trackingInfo?: {
    carrier?: string
    trackingNumber?: string
    estimatedDelivery?: any
  }
  notes?: string
}

