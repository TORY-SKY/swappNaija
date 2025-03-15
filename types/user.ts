export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  photoURL?: string
  userType: "buyer" | "seller" | "both"
  createdAt: any
  lastLogin?: any
  bankDetails?: {
    accountName?: string
    accountNumber?: string
    bankName?: string
    bankCode?: string
  }
  paystackRecipientCode?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  isVerified?: boolean
}

export interface BankDetail {
  name: string
  code: string
  longcode?: string
  gateway?: string
  active?: boolean
  country?: string
  currency?: string
  type?: string
}

