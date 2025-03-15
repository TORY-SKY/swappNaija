"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { useToast } from "@/hooks/use-toast"
import type { PayoutType } from "@/types/payout"
import { isFirebaseConfigValid } from "@/lib/firebase-config"

export function usePayouts() {
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
          console.log("Firebase services initialized for payouts")
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

  // Request a payout
  const requestPayout = async (amount: number, bankDetails: PayoutType["bankDetails"]): Promise<string> => {
    if (!user) {
      throw new Error("You must be logged in to request a payout")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      toast({
        title: "Demo Mode",
        description: "Payout request would be created in production mode",
      })
      return "mock-payout-id"
    }

    try {
      const { collection, addDoc, serverTimestamp, query, where, getDocs } = await import("firebase/firestore")

      // Check if user has a recipient code
      const userProfile = await getUserProfile()
      if (!userProfile?.paystackRecipientCode) {
        throw new Error("You need to set up your bank details and get a recipient code first")
      }

      // Check if user has any completed orders
      const ordersCollection = collection(db, "orders")
      const q = query(
        ordersCollection,
        where("sellerId", "==", user.uid),
        where("deliveryStatus", "==", "completed"),
        where("paymentStatus", "==", "paid"),
      )

      const orderSnapshot = await getDocs(q)
      if (orderSnapshot.empty) {
        throw new Error("You don't have any completed orders to request a payout for")
      }

      // Create the payout request
      const newPayout: Omit<PayoutType, "id"> = {
        sellerId: user.uid,
        amount,
        requestDate: serverTimestamp(),
        status: "pending",
        bankDetails,
        recipientCode: userProfile.paystackRecipientCode,
      }

      const payoutRef = await addDoc(collection(db, "payouts"), newPayout)
      console.log("Payout request created with ID:", payoutRef.id)

      return payoutRef.id
    } catch (error: any) {
      console.error("Error requesting payout:", error)
      throw new Error(error.message || "Failed to request payout")
    }
  }

  // Get user's payouts
  const getPayouts = async (
    options: {
      status?: PayoutType["status"]
      limit?: number
      lastVisible?: any
    } = {},
  ): Promise<{ payouts: PayoutType[]; lastVisible: any }> => {
    if (!user) {
      throw new Error("You must be logged in to view payouts")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return { payouts: getMockPayouts(), lastVisible: null }
    }

    try {
      const { collection, query, where, orderBy, limit, startAfter, getDocs } = await import("firebase/firestore")

      const payoutsCollection = collection(db, "payouts")
      const constraints: any[] = []

      // Filter by seller ID
      constraints.push(where("sellerId", "==", user.uid))

      // Filter by status
      if (options.status) {
        constraints.push(where("status", "==", options.status))
      }

      // Sort by request date (newest first)
      constraints.push(orderBy("requestDate", "desc"))

      // Apply pagination
      if (options.limit) {
        constraints.push(limit(options.limit))
      }

      if (options.lastVisible) {
        constraints.push(startAfter(options.lastVisible))
      }

      // Execute query
      const q = query(payoutsCollection, ...constraints)
      const querySnapshot = await getDocs(q)

      // Extract payouts
      const payouts: PayoutType[] = []
      querySnapshot.forEach((doc) => {
        payouts.push({ id: doc.id, ...doc.data() } as PayoutType)
      })

      // Get last visible document for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null

      return { payouts, lastVisible }
    } catch (error: any) {
      console.error("Error getting payouts:", error)
      return { payouts: getMockPayouts(), lastVisible: null }
    }
  }

  // Get a single payout
  const getPayout = async (payoutId: string): Promise<PayoutType | null> => {
    if (!user) {
      throw new Error("You must be logged in to view a payout")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return getMockPayouts().find((p) => p.id === payoutId) || null
    }

    try {
      const { doc, getDoc } = await import("firebase/firestore")

      const payoutRef = doc(db, "payouts", payoutId)
      const payoutSnap = await getDoc(payoutRef)

      if (!payoutSnap.exists()) {
        return null
      }

      const payoutData = payoutSnap.data() as PayoutType

      // Verify user is the seller
      if (payoutData.sellerId !== user.uid) {
        throw new Error("You don't have permission to view this payout")
      }

      return { id: payoutSnap.id, ...payoutData }
    } catch (error: any) {
      console.error("Error getting payout:", error)
      return null
    }
  }

  // Cancel a pending payout request
  const cancelPayout = async (payoutId: string): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to cancel a payout")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Check if payout exists and user is the seller
      const payoutRef = doc(db, "payouts", payoutId)
      const payoutSnap = await getDoc(payoutRef)

      if (!payoutSnap.exists()) {
        throw new Error("Payout not found")
      }

      const payoutData = payoutSnap.data() as PayoutType
      if (payoutData.sellerId !== user.uid) {
        throw new Error("You don't have permission to cancel this payout")
      }

      if (payoutData.status !== "pending") {
        throw new Error("Only pending payouts can be cancelled")
      }

      // Cancel the payout
      await updateDoc(payoutRef, {
        status: "failed",
        updatedAt: serverTimestamp(),
        notes: "Cancelled by seller",
      })

      console.log("Payout cancelled successfully")
    } catch (error: any) {
      console.error("Error cancelling payout:", error)
      throw new Error(error.message || "Failed to cancel payout")
    }
  }

  // Get user profile with recipient code
  const getUserProfile = async () => {
    if (!user || !db) return null

    try {
      const { doc, getDoc } = await import("firebase/firestore")
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return userSnap.data()
      }
      return null
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  // Mock payouts for demo mode
  const getMockPayouts = (): PayoutType[] => {
    return [
      {
        id: "payout1",
        sellerId: "user123",
        amount: 135000, // 90% of 150000 (platform fee of 10%)
        requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        processedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: "completed",
        transferReference: "transfer_123456789",
        bankDetails: {
          accountName: "John Doe",
          accountNumber: "0123456789",
          bankName: "Access Bank",
          bankCode: "044",
        },
        recipientCode: "RCP_1234567890",
      },
      {
        id: "payout2",
        sellerId: "user123",
        amount: 76500, // 90% of 85000 (platform fee of 10%)
        requestDate: new Date(),
        status: "pending",
        bankDetails: {
          accountName: "John Doe",
          accountNumber: "0123456789",
          bankName: "Access Bank",
          bankCode: "044",
        },
        recipientCode: "RCP_1234567890",
      },
    ]
  }

  return {
    requestPayout,
    getPayouts,
    getPayout,
    cancelPayout,
  }
}

