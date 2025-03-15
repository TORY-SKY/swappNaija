export interface PayoutType {
  id: string
  sellerId: string
  amount: number
  requestDate: any
  processedDate?: any
  status: "pending" | "processing" | "completed" | "failed"
  transferReference?: string
  bankDetails: {
    accountName: string
    accountNumber: string
    bankName: string
    bankCode: string
  }
  recipientCode: string
  notes?: string
}

