"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import type { ItemType } from "@/types/item"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface CartContextType {
  cartItems: ItemType[]
  addToCart: (item: ItemType) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  getCartTotal: () => number
  isLoading: boolean
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  getCartTotal: () => 0,
  isLoading: true,
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<ItemType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Load cart from Firestore
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true)
      try {
        if (user) {
          const { getFirestore, doc, getDoc } = await import("firebase/firestore")
          const { getApp } = await import("firebase/app")

          const app = getApp()
          const db = getFirestore(app)
          const cartDoc = await getDoc(doc(db, "userCarts", user.uid))

          if (cartDoc.exists()) {
            const cartData = cartDoc.data()
            setCartItems(cartData.items || [])
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error)
        toast({
          title: "Error",
          description: "Failed to load your cart. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCart()
  }, [user, toast])

  // Save cart to Firestore whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      if (!user) return

      try {
        const { getFirestore, doc, setDoc } = await import("firebase/firestore")
        const { getApp } = await import("firebase/app")

        const app = getApp()
        const db = getFirestore(app)

        await setDoc(doc(db, "userCarts", user.uid), {
          userId: user.uid,
          items: cartItems,
          updatedAt: new Date(),
        })
      } catch (error) {
        console.error("Error saving cart:", error)
      }
    }

    if (!isLoading) {
      saveCart()
    }
  }, [cartItems, user, isLoading])

  const addToCart = async (item: ItemType) => {
    const exists = cartItems.some((cartItem) => cartItem.id === item.id)
    if (exists) {
      toast({
        title: "Item already in cart",
        description: "This item is already in your cart.",
      })
      return
    }
    
    setCartItems((prev) => [...prev, item])
    toast({
      title: "Item added to cart",
      description: `${item.title} has been added to your cart.`,
    })
  }

  const removeFromCart = (itemId: string) => {
    const item = cartItems.find((item) => item.id === itemId)
    if (item) {
      setCartItems((prev) => prev.filter((item) => item.id !== itemId))
      toast({
        title: "Item removed",
        description: `${item.title} has been removed from your cart.`,
      })
    }
  }

  const clearCart = () => {
    setCartItems([])
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    })
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

