// Update the service to use our API route instead of direct Paystack calls

import type { UserProfile } from "@/types/user"

// Paystack API base URL
const PAYSTACK_BASE_URL = "https://api.paystack.co"

// Initialize payment
export async function initializePayment(
  amount: number,
  email: string,
  metadata: any = {},
  callbackUrl?: string,
): Promise<{ reference: string; authorizationUrl: string }> {
  try {
    // For client-side initialization, we'll use the Paystack inline JS
    // This function will now just generate a reference for use with the inline JS
    const reference = `ref_${Date.now()}_${Math.floor(Math.random() * 1000000)}`

    return {
      reference,
      authorizationUrl: `https://checkout.paystack.com/${reference}`,
    }
  } catch (error) {
    console.error("Error initializing payment:", error)
    throw new Error("Failed to initialize payment")
  }
}

// Verify payment
export async function verifyPayment(reference: string): Promise<{
  status: boolean
  message: string
  data: {
    amount: number
    reference: string
    status: string
    paidAt: string
  }
}> {
  try {
    const response = await fetch("/api/paystack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "verify-payment",
        reference,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to verify payment")
    }

    return await response.json()
  } catch (error) {
    console.error("Error verifying payment:", error)
    throw new Error("Failed to verify payment")
  }
}

// Create transfer recipient
export async function createTransferRecipient(
  user: UserProfile,
  bankDetails: {
    accountNumber: string
    bankCode: string
    accountName?: string
  },
): Promise<{ recipientCode: string }> {
  try {
    const response = await fetch("/api/paystack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create-recipient",
        name: bankDetails.accountName || user.displayName || user.email,
        accountNumber: bankDetails.accountNumber,
        bankCode: bankDetails.bankCode,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to create recipient")
    }

    const data = await response.json()
    return {
      recipientCode: data.data.recipient_code,
    }
  } catch (error) {
    console.error("Error creating transfer recipient:", error)
    throw new Error("Failed to create transfer recipient")
  }
}

// Initiate transfer
export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reason: string,
): Promise<{ reference: string; transferCode: string }> {
  try {
    const response = await fetch("/api/paystack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "initiate-transfer",
        amount,
        recipientCode,
        reason,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to initiate transfer")
    }

    const data = await response.json()
    return {
      reference: data.data.reference,
      transferCode: data.data.transfer_code,
    }
  } catch (error) {
    console.error("Error initiating transfer:", error)
    throw new Error("Failed to initiate transfer")
  }
}

// Get list of banks
export async function getBanks(): Promise<
  Array<{
    id: number
    name: string
    code: string
    country: string
  }>
> {
  try {
    const response = await fetch("/api/paystack?action=get-banks")

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to get banks")
    }

    const data = await response.json()
    return data.data.map((bank: any) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      country: bank.country,
    }))
  } catch (error) {
    console.error("Error getting banks:", error)
    throw new Error("Failed to get banks")
  }
}

// Verify bank account
export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{
  accountNumber: string
  accountName: string
  bankId: number
}> {
  try {
    const response = await fetch("/api/paystack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "verify-account",
        accountNumber,
        bankCode,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to verify bank account")
    }

    const data = await response.json()
    return {
      accountNumber,
      accountName: data.data.account_name,
      bankId: Number.parseInt(bankCode),
    }
  } catch (error) {
    console.error("Error verifying bank account:", error)
    throw new Error("Failed to verify bank account")
  }
}

