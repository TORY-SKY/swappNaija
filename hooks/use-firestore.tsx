"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { useToast } from "@/hooks/use-toast"
import type { ItemType } from "@/types/item"
// Import the centralized Firebase config
import { isFirebaseConfigValid } from "@/lib/firebase-config"

export function useFirestore() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)
  const [db, setDb] = useState<any>(null)

  // Initialize Firestore
  useEffect(() => {
    const initializeFirestore = async () => {
      try {
        // Check if window is defined (client-side)
        if (typeof window === "undefined") return

        // Check if Firebase config is valid
        if (!isFirebaseConfigValid()) {
          console.error("Firebase configuration is incomplete")
          setIsInitialized(false)

          if (!isInitialized) {
            toast({
              title: "Firestore Error",
              description: "Using demo mode due to incomplete Firebase configuration",
              variant: "destructive",
            })
          }
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
          console.log("Firestore initialized successfully")
        } catch (error) {
          console.error("Error getting Firebase app:", error)
          setIsInitialized(false)

          // Show error toast only once
          if (!isInitialized) {
            toast({
              title: "Firestore Error",
              description: "Using demo mode due to Firestore initialization error",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Error initializing Firestore:", error)
        setIsInitialized(false)
      }
    }

    initializeFirestore()
  }, [toast, isInitialized])

  // Get a single item by ID
  const getItem = async (id: string) => {
    try {
      if (!isInitialized || !db) {
        console.log("Firestore not initialized, returning mock data")
        const mockItems = getMockItems()
        return mockItems.find((item) => item.id === id) || null
      }

      const { doc, getDoc } = await import("firebase/firestore")
      const docRef = doc(db, "items", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ItemType
      } else {
        return null
      }
    } catch (error) {
      console.error("Error getting item:", error)
      // Return mock data as fallback
      const mockItems = getMockItems()
      return mockItems.find((item) => item.id === id) || null
    }
  }

  // Get items with optional filtering
  const getItems = async (
    options: {
      category?: string
      isFree?: boolean
      ownerId?: string
      maxPrice?: number
      condition?: string
      limitCount?: number
    } = {},
  ) => {
    try {
      if (!isInitialized || !db) {
        console.log("Firestore not initialized, returning mock data")
        return getMockItems()
      }

      const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore")

      const itemsCollection = collection(db, "items")
      const constraints: any[] = []

      if (options.category) {
        constraints.push(where("category", "==", options.category))
      }

      if (options.isFree !== undefined) {
        constraints.push(where("isFree", "==", options.isFree))
      }

      if (options.ownerId) {
        constraints.push(where("ownerId", "==", options.ownerId))
      }

      if (options.maxPrice) {
        constraints.push(where("price", "<=", options.maxPrice))
      }

      if (options.condition) {
        constraints.push(where("condition", "==", options.condition))
      }

      // Add ordering by creation date (newest first)
      constraints.push(orderBy("createdAt", "desc"))

      if (options.limitCount) {
        constraints.push(limit(options.limitCount))
      }

      const q = query(itemsCollection, ...constraints)
      const querySnapshot = await getDocs(q)

      const items: ItemType[] = []
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ItemType)
      })

      console.log(`Retrieved ${items.length} items from Firestore`)
      return items
    } catch (error) {
      console.error("Error getting items:", error)
      // Return mock data as fallback
      return getMockItems()
    }
  }

  // Add a new item
  const addItem = async (itemData: Omit<ItemType, "id" | "createdAt">) => {
    try {
      if (!user) {
        throw new Error("User must be authenticated to add items")
      }

      if (!isInitialized || !db) {
        console.log("Firestore not initialized, mocking add item")
        toast({
          title: "Demo Mode",
          description: "Item would be added to Firestore in production mode",
        })
        return "mock-item-id"
      }

      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

      // Log the data being sent to Firestore for debugging
      console.log("Adding item to Firestore:", itemData)

      const itemWithMetadata = {
        ...itemData,
        createdAt: serverTimestamp(),
        ownerId: user.uid,
        ownerName: user.displayName || "Anonymous",
        ownerPhotoURL: user.photoURL || null,
      }

      const docRef = await addDoc(collection(db, "items"), itemWithMetadata)
      console.log("Item added with ID:", docRef.id)

      toast({
        title: "Success",
        description: "Item has been listed successfully",
      })

      return docRef.id
    } catch (error: any) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add item, using demo mode",
        variant: "destructive",
      })
      return "mock-item-id"
    }
  }

  // Update an existing item
  const updateItem = async (id: string, itemData: Partial<ItemType>) => {
    try {
      if (!user) throw new Error("User must be authenticated to update items")

      if (!isInitialized || !db) {
        console.log("Firestore not initialized, mocking update item")
        toast({
          title: "Demo Mode",
          description: "Item would be updated in Firestore in production mode",
        })
        return true
      }

      const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      const docRef = doc(db, "items", id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error("Item not found")
      }

      const currentData = docSnap.data()
      if (currentData.ownerId !== user.uid) {
        throw new Error("You don't have permission to update this item")
      }

      await updateDoc(docRef, {
        ...itemData,
        updatedAt: serverTimestamp(),
      })

      console.log("Item updated successfully:", id)
      return true
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
      return false
    }
  }

  // Delete an item
  const deleteItem = async (id: string) => {
    try {
      if (!user) throw new Error("User must be authenticated to delete items")

      if (!isInitialized || !db) {
        console.log("Firestore not initialized, mocking delete item")
        toast({
          title: "Demo Mode",
          description: "Item would be deleted from Firestore in production mode",
        })
        return true
      }

      const { doc, getDoc, deleteDoc } = await import("firebase/firestore")

      const docRef = doc(db, "items", id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error("Item not found")
      }

      const currentData = docSnap.data()
      if (currentData.ownerId !== user.uid) {
        throw new Error("You don't have permission to delete this item")
      }

      await deleteDoc(docRef)
      console.log("Item deleted successfully:", id)
      return true
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
      return false
    }
  }

  // Get user data
  const getUser = async (userId: string) => {
    try {
      if (!isInitialized || !db) {
        console.log("Firestore not initialized, returning mock user data")
        return {
          id: userId,
          displayName: "Demo User",
          email: "user@example.com",
          createdAt: new Date(),
        }
      }

      const { doc, getDoc } = await import("firebase/firestore")

      const docRef = doc(db, "users", userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return {
          id: userId,
          displayName: "Demo User",
          email: "user@example.com",
          createdAt: new Date(),
        }
      }
    } catch (error) {
      console.error("Error getting user:", error)
      return {
        id: userId,
        displayName: "Demo User",
        email: "user@example.com",
        createdAt: new Date(),
      }
    }
  }

  // Get user's listed items
  const getUserItems = async (userId: string) => {
    try {
      if (!isInitialized || !db) {
        console.log("Firestore not initialized, returning mock data")
        return getMockItems().filter((item) => item.ownerId === userId)
      }

      return await getItems({ ownerId: userId })
    } catch (error) {
      console.error("Error getting user items:", error)
      return getMockItems().filter((item) => item.ownerId === userId)
    }
  }

  // Listen for real-time updates to items
  const listenToItems = (callback: (items: ItemType[]) => void, options: any = {}) => {
    if (!isInitialized || !db) {
      console.log("Firestore not initialized, cannot listen to items")
      callback(getMockItems())
      return () => {}
    }

    const setupListener = async () => {
      try {
        const { collection, query, where, orderBy, limit, onSnapshot } = await import("firebase/firestore")

        const itemsCollection = collection(db, "items")
        const constraints: any[] = []

        if (options.category) {
          constraints.push(where("category", "==", options.category))
        }

        if (options.isFree !== undefined) {
          constraints.push(where("isFree", "==", options.isFree))
        }

        if (options.ownerId) {
          constraints.push(where("ownerId", "==", options.ownerId))
        }

        // Add ordering by creation date (newest first)
        constraints.push(orderBy("createdAt", "desc"))

        if (options.limitCount) {
          constraints.push(limit(options.limitCount))
        }

        const q = query(itemsCollection, ...constraints)

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const items: ItemType[] = []
            snapshot.forEach((doc) => {
              items.push({ id: doc.id, ...doc.data() } as ItemType)
            })
            console.log(`Real-time update: Retrieved ${items.length} items`)
            callback(items)
          },
          (error) => {
            console.error("Error listening to items:", error)
            callback(getMockItems())
          },
        )

        return unsubscribe
      } catch (error) {
        console.error("Error setting up listener:", error)
        callback(getMockItems())
        return () => {}
      }
    }

    const unsubscribePromise = setupListener()

    // Return a function that will unsubscribe when called
    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe())
    }
  }

  // For demo purposes, return mock data if Firestore is not available
  const getMockItems = (): ItemType[] => {
    return [
      {
        id: "1",
        title: "iPhone 11 Pro",
        price: 150000,
        imageUrl: "/placeholder.svg?height=500&width=500",
        imageUrls: ["/placeholder.svg?height=500&width=500"],
        condition: "Good",
        category: "Electronics",
        isFree: false,
        location: "Lagos",
        ownerId: "user123",
        description: "Slightly used iPhone 11 Pro with 64GB storage. Battery health at 85%.",
        createdAt: new Date(),
      },
      {
        id: "2",
        title: "Leather Sofa",
        price: 85000,
        imageUrl: "/placeholder.svg?height=500&width=500",
        imageUrls: ["/placeholder.svg?height=500&width=500"],
        condition: "Like New",
        category: "Furniture",
        isFree: false,
        location: "Abuja",
        ownerId: "user456",
        description: "Beautiful leather sofa in excellent condition. Only used for 6 months.",
        createdAt: new Date(),
      },
      {
        id: "3",
        title: "Programming Books Bundle",
        price: 0,
        imageUrl: "/placeholder.svg?height=500&width=500",
        imageUrls: ["/placeholder.svg?height=500&width=500"],
        condition: "Good",
        category: "Books",
        isFree: true,
        location: "Port Harcourt",
        ownerId: "user789",
        description: "Collection of programming books including JavaScript, Python, and React.",
        createdAt: new Date(),
      },
    ]
  }

  return {
    getItem,
    getItems,
    addItem,
    updateItem,
    deleteItem,
    getUser,
    getUserItems,
    listenToItems,
    getMockItems,
  }
}

