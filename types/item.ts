export interface ItemType {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string
  imageUrls?: string[]
  condition: string
  category: string
  subcategory?: string
  isFree: boolean
  location: string
  ownerId: string
  ownerName?: string
  ownerPhotoURL?: string
  createdAt?: any
  updatedAt?: any
  status: "active" | "inactive" | "sold"
  featured?: boolean
  views?: number
  specifications?: Record<string, string>
  shippingDetails?: {
    weight?: number
    dimensions?: {
      length?: number
      width?: number
      height?: number
    }
    shippingFee?: number
    freeShipping?: boolean
  }
}

