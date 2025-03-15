"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Trash2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import AdDisplay from "@/components/ad-display"
import PaystackCheckout from "@/components/paystack-checkout"

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, getCartTotal } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/sign-in?redirect=/cart")
    }
  }, [user, router])

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeFromCart(itemId)
  }

  const handlePaymentSuccess = async (reference: string) => {
    setIsCheckingOut(true)

    try {
      // Create order in Firestore
      const { getFirestore, collection, addDoc, serverTimestamp } = await import("firebase/firestore")
      const { getApp } = await import("firebase/app")

      const app = getApp()
      const db = getFirestore(app)

      const orderData = {
        userId: user?.uid,
        items: cartItems,
        total: getCartTotal(),
        shippingFee: 1500,
        paymentReference: reference,
        status: "paid",
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, "orders"), orderData)

      toast({
        title: "Order placed successfully!",
        description: `Your order has been placed with reference: ${reference}`,
      })

      clearCart()
      router.push("/profile")
    } catch (error) {
      console.error("Error processing order:", error)
      toast({
        title: "Error",
        description: "There was an error processing your order. Please contact support.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handlePaymentCancel = () => {
    toast({
      title: "Payment cancelled",
      description: "You have cancelled the payment process.",
    })
  }

  const subtotal = getCartTotal()
  const shippingFee = cartItems.length > 0 ? 1500 : 0
  const total = subtotal + shippingFee

  if (!user) {
    return null // Don't render anything while redirecting
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-6">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <Card key={item.id} className="glass-card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-40 sm:h-auto sm:w-40 flex-shrink-0">
                    <Image
                      src={item.imageUrl || "/placeholder.svg?height=200&width=200"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <span className="font-bold">{item.isFree ? "FREE" : `₦${item.price.toLocaleString()}`}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>{item.condition}</span> • <span>{item.category}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Location: {item.location}</div>
                    <div className="mt-auto pt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id, item.title)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4 py-10">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                <CardTitle>Your cart is empty</CardTitle>
                <CardDescription>Items you add to your cart will appear here.</CardDescription>
                <Button asChild>
                  <a href="/browse">Start Shopping</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {cartItems.length > 0 && (
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => router.push("/browse")}>
                Continue Shopping
              </Button>
              <Button variant="destructive" onClick={() => clearCart()}>
                Clear Cart
              </Button>
            </div>
          )}

          <AdDisplay />
        </div>

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div className="space-y-6">
            <Card className="glass-card sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>₦{shippingFee.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <PaystackCheckout
                  amount={total}
                  email={user.email}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                  metadata={{
                    cart_items: cartItems.length,
                    order_type: "SwapNaira Purchase",
                  }}
                  className="w-full"
                  disabled={isCheckingOut}
                />

                {isCheckingOut && (
                  <div className="text-center text-sm text-muted-foreground">Processing your order...</div>
                )}
              </CardFooter>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Accepted Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Image
                    src="https://assets.paystack.com/assets/img/logos/merchants/paystack-logo.png"
                    alt="Paystack"
                    width={120}
                    height={40}
                    className="object-contain"
                  />
                  <Image src="/visa.svg" alt="Visa" width={60} height={40} className="object-contain" />
                  <Image src="/mastercard.svg" alt="Mastercard" width={60} height={40} className="object-contain" />
                  <Image src="/verve.svg" alt="Verve" width={60} height={40} className="object-contain" />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Secured by Paystack. All transactions are encrypted and secure.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

