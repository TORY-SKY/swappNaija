"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { useToast } from "@/hooks/use-toast"
import type { OrderType } from "@/types/order"
import type { ItemType } from "@/types/item"
import { isFirebaseConfigValid } from "@/lib/firebase-config"

export function useOrders() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)
  const [db, setDb] = useState<any>(null)

  // Initialize Firebase services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Check if window is defined (client-side)
        if (typeof window === "undefined") return

        // Check if Firebase config is valid
        if (!isFirebaseConfigValid()) {
          console.error("Firebase configuration is incomplete")
          setIsInitialized(false)
          return
        }

        // Dynamically import Firebase modules
        const { getFirestore } = await import("firebase/firestore")
        const { getApp } = await import("firebase/app")

        try {
          // Try to get the Firebase app instance
          const app = getApp()
          const firestoreDb = getFirestore(app)

          setDb(firestoreDb)
          setIsInitialized(true)
          console.log("Firebase services initialized for orders")
        } catch (error) {
          console.error("Error getting Firebase app:", error)
          setIsInitialized(false)
        }
      } catch (error) {
        console.error("Error initializing Firebase services:", error)
        setIsInitialized(false)
      }
    }

    initializeServices()
  }, [])

  // Create a new order
  const createOrder = async (
    product: ItemType,
    quantity: number,
    shippingAddress: OrderType["shippingAddress"],
    paymentReference?: string,
  ): Promise<string> => {
    if (!user) {
      throw new Error("You must be logged in to create an order")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      toast({
        title: "Demo Mode",
        description: "Order would be created in production mode",
      })
      return "mock-order-id"
    }

    try {
      const { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } = await import("firebase/firestore")

      // Verify product exists and is available
      const productRef = doc(db, "products", product.id)
      const productSnap = await getDoc(productRef)

      if (!productSnap.exists()) {
        throw new Error("Product not found")
      }

      const productData = productSnap.data() as ItemType
      if (productData.status !== "active") {
        throw new Error("Product is no longer available")
      }

      // Create the order
      const newOrder: Omit<OrderType, "id"> = {
        buyerId: user.uid,
        sellerId: product.ownerId,
        productId: product.id,
        productTitle: product.title,
        productImage: product.imageUrl,
        quantity,
        amount: product.price * quantity,
        orderDate: serverTimestamp(),
        paymentStatus: paymentReference ? "paid" : "pending",
        deliveryStatus: "pending",
        paymentReference,
        shippingAddress,
      }

      const orderRef = await addDoc(collection(db, "orders"), newOrder)
      console.log("Order created with ID:", orderRef.id)

      // If payment is complete, mark product as sold
      if (paymentReference) {
        await updateDoc(productRef, {
          status: "sold",
          updatedAt: serverTimestamp(),
        })
      }

      return orderRef.id
    } catch (error: any) {
      console.error("Error creating order:", error)
      throw new Error(error.message || "Failed to create order")
    }
  }

  // Get orders (as buyer or seller)
  const getOrders = async (options: {
    role: "buyer" | "seller"
    status?: OrderType["deliveryStatus"]
    paymentStatus?: OrderType["paymentStatus"]
    limit?: number
    lastVisible?: any
  }): Promise<{ orders: OrderType[]; lastVisible: any }> => {
    if (!user) {
      throw new Error("You must be logged in to view orders")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return { orders: getMockOrders(options.role), lastVisible: null }
    }

    try {
      const { collection, query, where, orderBy, limit, startAfter, getDocs } = await import("firebase/firestore")

      const ordersCollection = collection(db, "orders")
      const constraints: any[] = []

      // Filter by role (buyer or seller)
      if (options.role === "buyer") {
        constraints.push(where("buyerId", "==", user.uid))
      } else {
        constraints.push(where("sellerId", "==", user.uid))
      }

      // Filter by delivery status
      if (options.status) {
        constraints.push(where("deliveryStatus", "==", options.status))
      }

      // Filter by payment status
      if (options.paymentStatus) {
        constraints.push(where("paymentStatus", "==", options.paymentStatus))
      }

      // Sort by order date (newest first)
      constraints.push(orderBy("orderDate", "desc"))

      // Apply pagination
      if (options.limit) {
        constraints.push(limit(options.limit))
      }

      if (options.lastVisible) {
        constraints.push(startAfter(options.lastVisible))
      }

      // Execute query
      const q = query(ordersCollection, ...constraints)
      const querySnapshot = await getDocs(q)

      // Extract orders
      const orders: OrderType[] = []
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as OrderType)
      })

      // Get last visible document for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null

      return { orders, lastVisible }
    } catch (error: any) {
      console.error("Error getting orders:", error)
      return { orders: getMockOrders(options.role), lastVisible: null }
    }
  }

  // Get a single order
  const getOrder = async (orderId: string): Promise<OrderType | null> => {
    if (!user) {
      throw new Error("You must be logged in to view an order")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return getMockOrders("buyer").find((o) => o.id === orderId) || null
    }

    try {
      const { doc, getDoc } = await import("firebase/firestore")

      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        return null
      }

      const orderData = orderSnap.data() as OrderType

      // Verify user is either buyer or seller
      if (orderData.buyerId !== user.uid && orderData.sellerId !== user.uid) {
        throw new Error("You don't have permission to view this order")
      }

      return { id: orderSnap.id, ...orderData }
    } catch (error: any) {
      console.error("Error getting order:", error)
      return null
    }
  }

  // Update order status (as seller)
  const updateOrderStatus = async (
    orderId: string,
    status: OrderType["deliveryStatus"],
    trackingInfo?: OrderType["trackingInfo"],
  ): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to update an order")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Check if order exists and user is the seller
      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        throw new Error("Order not found")
      }

      const orderData = orderSnap.data() as OrderType
      if (orderData.sellerId !== user.uid) {
        throw new Error("You don't have permission to update this order")
      }

      // Update the order
      const updates: any = {
        deliveryStatus: status,
        updatedAt: serverTimestamp(),
      }

      if (trackingInfo) {
        updates.trackingInfo = trackingInfo
      }

      await updateDoc(orderRef, updates)
      console.log("Order status updated successfully")
    } catch (error: any) {
      console.error("Error updating order status:", error)
      throw new Error(error.message || "Failed to update order status")
    }
  }

  // Cancel order (as buyer, only if pending)
  const cancelOrder = async (orderId: string): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to cancel an order")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Check if order exists and user is the buyer
      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        throw new Error("Order not found")
      }

      const orderData = orderSnap.data() as OrderType
      if (orderData.buyerId !== user.uid) {
        throw new Error("You don't have permission to cancel this order")
      }

      if (orderData.deliveryStatus !== "pending") {
        throw new Error("Only pending orders can be cancelled")
      }

      // Cancel the order
      await updateDoc(orderRef, {
        deliveryStatus: "cancelled",
        updatedAt: serverTimestamp(),
      })

      console.log("Order cancelled successfully")

      // If the product was marked as sold, mark it as active again
      const { getDoc: getProductDoc, updateDoc: updateProductDoc } = await import("firebase/firestore")
      const productRef = doc(db, "products", orderData.productId)
      const productSnap = await getProductDoc(productRef)

      if (productSnap.exists()) {
        await updateProductDoc(productRef, {
          status: "active",
          updatedAt: serverTimestamp(),
        })
      }
    } catch (error: any) {
      console.error("Error cancelling order:", error)
      throw new Error(error.message || "Failed to cancel order")
    }
  }

  // Confirm delivery (as buyer)
  const confirmDelivery = async (orderId: string): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to confirm delivery")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Check if order exists and user is the buyer
      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        throw new Error("Order not found")
      }

      const orderData = orderSnap.data() as OrderType
      if (orderData.buyerId !== user.uid) {
        throw new Error("You don't have permission to confirm delivery for this order")
      }

      if (orderData.deliveryStatus !== "shipped" && orderData.deliveryStatus !== "delivered") {
        throw new Error("Order must be shipped or delivered to confirm")
      }

      // Confirm delivery
      await updateDoc(orderRef, {
        deliveryStatus: "completed",
        updatedAt: serverTimestamp(),
      })

      console.log("Delivery confirmed successfully")
    } catch (error: any) {
      console.error("Error confirming delivery:", error)
      throw new Error(error.message || "Failed to confirm delivery")
    }
  }

  // Mock orders for demo mode
  const getMockOrders = (role: "buyer" | "seller"): OrderType[] => {
    const mockOrders: OrderType[] = [
      {
        id: "order1",
        buyerId: "user123",
        sellerId: "seller456",
        productId: "product1",
        productTitle: "iPhone 11 Pro",
        productImage: "/placeholder.svg?height=500&width=500",
        quantity: 1,
        amount: 150000,
        orderDate: new Date(),
        paymentStatus: "paid",
        deliveryStatus: "pending",
        paymentReference: "pay_123456789",
        shippingAddress: {
          fullName: "John Doe",
          phoneNumber: "+2348012345678",
          street: "123 Main Street",
          city: "Lagos",
          state: "Lagos State",
          postalCode: "100001",
          country: "Nigeria",
        },
      },
      {
        id: "order2",
        buyerId: "user123",
        sellerId: "seller789",
        productId: "product2",
        productTitle: "Leather Sofa",
        productImage: "/placeholder.svg?height=500&width=500",
        quantity: 1,
        amount: 85000,
        orderDate: new Date(),
        paymentStatus: "paid",
        deliveryStatus: "shipped",
        paymentReference: "pay_987654321",
        shippingAddress: {
          fullName: "John Doe",
          phoneNumber: "+2348012345678",
          street: "123 Main Street",
          city: "Lagos",
          state: "Lagos State",
          postalCode: "100001",
          country: "Nigeria",
        },
        trackingInfo: {
          carrier: "DHL",
          trackingNumber: "DHL12345678",
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
      },
    ]

    // Filter based on role
    if (role === "buyer") {
      return mockOrders.filter((order) => order.buyerId === "user123")
    } else {
      return mockOrders.filter((order) => order.sellerId === "seller456" || order.sellerId === "seller789")
    }
  }

  return {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder,
    confirmDelivery,
  }
}

