import { NextResponse } from "next/server"

// IMPORTANT: In a production environment, this should be stored in environment variables
// and never exposed in client-side code
const PAYSTACK_SECRET_KEY = "sk_test_5c4827142de8e78648d2ca1944181ad2b75b4109"
const PAYSTACK_BASE_URL = "https://api.paystack.co"

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case "verify-payment":
        return await verifyPayment(data.reference)
      case "create-recipient":
        return await createRecipient(data)
      case "initiate-transfer":
        return await initiateTransfer(data)
      case "verify-account":
        return await verifyAccount(data.accountNumber, data.bankCode)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Paystack API error:", error)
    return NextResponse.json({ error: error.message || "An error occurred processing your request" }, { status: 500 })
  }
}

// Verify payment
async function verifyPayment(reference: string) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to verify payment")
  }

  return NextResponse.json(data)
}

// Create transfer recipient
async function createRecipient(data: any) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: data.name,
      account_number: data.accountNumber,
      bank_code: data.bankCode,
      currency: "NGN",
    }),
  })

  const responseData = await response.json()

  if (!response.ok) {
    throw new Error(responseData.message || "Failed to create recipient")
  }

  return NextResponse.json(responseData)
}

// Initiate transfer
async function initiateTransfer(data: any) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: data.amount * 100, // Convert to kobo
      recipient: data.recipientCode,
      reason: data.reason || "Payout from SwapNaira",
    }),
  })

  const responseData = await response.json()

  if (!response.ok) {
    throw new Error(responseData.message || "Failed to initiate transfer")
  }

  return NextResponse.json(responseData)
}

// Verify bank account
async function verifyAccount(accountNumber: string, bankCode: string) {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to verify account")
  }

  return NextResponse.json(data)
}

// Get list of banks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "get-banks") {
      const response = await fetch(`${PAYSTACK_BASE_URL}/bank`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get banks")
      }

      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Paystack API error:", error)
    return NextResponse.json({ error: error.message || "An error occurred processing your request" }, { status: 500 })
  }
}

