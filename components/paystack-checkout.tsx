"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { initializePayment, verifyPayment } from "@/lib/paystack-service"

interface PaystackCheckoutProps {
  amount: number
  email: string
  onSuccess: (reference: string) => void
  onCancel: () => void
  reference?: string
  metadata?: Record<string, any>
  className?: string
  disabled?: boolean
  callbackUrl?: string
}

export default function PaystackCheckout({
  amount,
  email,
  onSuccess,
  onCancel,
  reference,
  metadata = {},
  className = "",
  disabled = false,
  callbackUrl,
}: PaystackCheckoutProps) {
  const [isInitializing, setIsInitializing] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById("paystack-script")) {
      setScriptLoaded(true)
      setIsInitializing(false)
      return
    }

    // Load Paystack script
    const script = document.createElement("script")
    script.id = "paystack-script"
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true

    script.onload = () => {
      console.log("Paystack script loaded successfully")
      setScriptLoaded(true)
      setIsInitializing(false)
    }

    script.onerror = (error) => {
      console.error("Failed to load Paystack script:", error)
      toast({
        title: "Payment Error",
        description: "Failed to load payment gateway. Please try again later.",
        variant: "destructive",
      })
      setIsInitializing(false)
    }

    document.body.appendChild(script)

    return () => {
      // Don't remove the script on component unmount to prevent reloading
    }
  }, [toast])

  const handlePayment = async () => {
    if (!scriptLoaded || isProcessing) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready yet. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Use the public test key for development
      const paystackPublicKey = "pk_test_1b9963f31a1a052e1dc913273c7cd09e9ee05700" // User's Paystack test public key

      // For a real app, initialize payment through your backend
      // For demo, we'll use the client-side approach
      const paymentData = {
        key: paystackPublicKey,
        email: email || user?.email || "",
        amount: amount * 100, // Paystack amount is in kobo (100 kobo = 1 Naira)
        ref: reference || generateReference(),
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: user?.displayName || "Guest User",
            },
            ...Object.entries(metadata).map(([key, value]) => ({
              display_name: key,
              variable_name: key.toLowerCase().replace(/\s+/g, "_"),
              value,
            })),
          ],
        },
        callback: async (response: { reference: string }) => {
          console.log("Payment successful:", response)

          try {
            // Verify the payment (in a real app, do this server-side)
            const verification = await verifyPayment(response.reference)

            if (verification.status) {
              onSuccess(response.reference)
            } else {
              toast({
                title: "Payment Verification Failed",
                description: "We couldn't verify your payment. Please contact support.",
                variant: "destructive",
              })
            }
          } catch (error) {
            console.error("Verification error:", error)
            toast({
              title: "Payment Verification Error",
              description: "An error occurred while verifying your payment.",
              variant: "destructive",
            })
          }

          setIsProcessing(false)
        },
        onClose: () => {
          console.log("Payment window closed")
          setIsProcessing(false)
          onCancel()
        },
      }

      if (callbackUrl) {
        paymentData.callback_url = callbackUrl
      }

      // Initialize Paystack payment
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup(paymentData)
        handler.openIframe()
      } else {
        // Alternative: use our API service if PaystackPop is not available
        const result = await initializePayment(amount, email, metadata, callbackUrl)
        window.location.href = result.authorizationUrl
      }
    } catch (error) {
      console.error("Paystack error:", error)
      toast({
        title: "Payment Error",
        description: "An error occurred while processing your payment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const generateReference = () => {
    const date = new Date().getTime()
    return `swapnaira-${date}-${Math.floor(Math.random() * 1000000)}`
  }

  return (
    <Button onClick={handlePayment} disabled={isInitializing || isProcessing || disabled} className={className}>
      {isInitializing || isProcessing ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          {isInitializing ? "Loading Payment System..." : "Processing Payment..."}
        </>
      ) : (
        "Pay with Paystack"
      )}
    </Button>
  )
}

// Add PaystackPop to the Window interface
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => {
        openIframe: () => void
      }
    }
  }
}

