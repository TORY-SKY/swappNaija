"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { useToast } from "@/hooks/use-toast"
import type { ItemType } from "@/types/item"
import { isFirebaseConfigValid } from "@/lib/firebase-config"

export function useProducts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)
  const [db, setDb] = useState<any>(null)
  const [storage, setStorage] = useState<any>(null)

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
        const { getFirestore, getStorage } = await import("firebase/firestore")
        const { getApp } = await import("firebase/app")

        try {
          // Try to get the Firebase app instance
          const app = getApp()
          const firestoreDb = getFirestore(app)
          const storageInstance = getStorage(app)

          setDb(firestoreDb)
          setStorage(storageInstance)
          setIsInitialized(true)
          console.log("Firebase services initialized for products")
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

  // Create a new product
  const createProduct = async (
    productData: Omit<ItemType, "id" | "createdAt" | "status" | "ownerId" | "ownerName" | "ownerPhotoURL">,
  ): Promise<string> => {
    if (!user) {
      throw new Error("You must be logged in to create a product")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      toast({
        title: "Demo Mode",
        description: "Product would be created in production mode",
      })
      return "mock-product-id"
    }

    try {
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

      const newProduct = {
        ...productData,
        ownerId: user.uid,
        ownerName: user.displayName || "Anonymous",
        ownerPhotoURL: user.photoURL || null,
        status: "active" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
      }

      const docRef = await addDoc(collection(db, "products"), newProduct)
      console.log("Product created with ID:", docRef.id)

      return docRef.id
    } catch (error: any) {
      console.error("Error creating product:", error)
      throw new Error(error.message || "Failed to create product")
    }
  }

  // Upload product images
  const uploadProductImages = async (files: File[], productId: string): Promise<string[]> => {
    if (!user) {
      throw new Error("You must be logged in to upload images")
    }

    if (!isInitialized || !storage) {
      console.log("Firebase not initialized, using mock mode")
      return files.map((_, index) => `/placeholder.svg?height=500&width=500&index=${index}`)
    }

    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")

      const uploadPromises = files.map((file, index) => {
        return new Promise<string>((resolve, reject) => {
          const storageRef = ref(storage, `products/${productId}/${Date.now()}_${index}`)
          const uploadTask = uploadBytesResumable(storageRef, file)

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              console.log(`Upload progress: ${progress}%`)
            },
            (error) => {
              console.error("Error uploading image:", error)
              reject(error)
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(downloadURL)
            },
          )
        })
      })

      return await Promise.all(uploadPromises)
    } catch (error: any) {
      console.error("Error uploading images:", error)
      throw new Error(error.message || "Failed to upload images")
    }
  }

  // Update product images
  const updateProductImages = async (productId: string, imageUrls: string[]): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to update product images")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, updateDoc } = await import("firebase/firestore")

      const productRef = doc(db, "products", productId)
      await updateDoc(productRef, {
        imageUrls,
        imageUrl: imageUrls[0] || null, // Set first image as main image
        updatedAt: new Date(),
      })

      console.log("Product images updated")
    } catch (error: any) {
      console.error("Error updating product images:", error)
      throw new Error(error.message || "Failed to update product images")
    }
  }

  // Get products with filtering
  const getProducts = async (
    options: {
      category?: string
      subcategory?: string
      status?: "active" | "inactive" | "sold"
      ownerId?: string
      featured?: boolean
      minPrice?: number
      maxPrice?: number
      condition?: string
      limit?: number
      lastVisible?: any
      sortBy?: "createdAt" | "price" | "views"
      sortDirection?: "asc" | "desc"
    } = {},
  ): Promise<{ products: ItemType[]; lastVisible: any }> => {
    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return { products: getMockProducts(), lastVisible: null }
    }

    try {
      const { collection, query, where, orderBy, limit, startAfter, getDocs } = await import("firebase/firestore")

      const productsCollection = collection(db, "products")
      const constraints: any[] = []

      // Apply filters
      if (options.category) {
        constraints.push(where("category", "==", options.category))
      }

      if (options.subcategory) {
        constraints.push(where("subcategory", "==", options.subcategory))
      }

      if (options.status) {
        constraints.push(where("status", "==", options.status))
      } else {
        // Default to active products
        constraints.push(where("status", "==", "active"))
      }

      if (options.ownerId) {
        constraints.push(where("ownerId", "==", options.ownerId))
      }

      if (options.featured !== undefined) {
        constraints.push(where("featured", "==", options.featured))
      }

      if (options.minPrice !== undefined) {
        constraints.push(where("price", ">=", options.minPrice))
      }

      if (options.maxPrice !== undefined) {
        constraints.push(where("price", "<=", options.maxPrice))
      }

      if (options.condition) {
        constraints.push(where("condition", "==", options.condition))
      }

      // Apply sorting
      const sortField = options.sortBy || "createdAt"
      const sortDir = options.sortDirection || "desc"
      constraints.push(orderBy(sortField, sortDir))

      // Apply pagination
      if (options.limit) {
        constraints.push(limit(options.limit))
      }

      if (options.lastVisible) {
        constraints.push(startAfter(options.lastVisible))
      }

      // Execute query
      const q = query(productsCollection, ...constraints)
      const querySnapshot = await getDocs(q)

      // Extract products
      const products: ItemType[] = []
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as ItemType)
      })

      // Get last visible document for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null

      return { products, lastVisible }
    } catch (error) {
      console.error("Error getting products:", error)
      return { products: getMockProducts(), lastVisible: null }
    }
  }

  // Get a single product
  const getProduct = async (productId: string): Promise<ItemType | null> => {
    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return getMockProducts().find((p) => p.id === productId) || null
    }

    try {
      const { doc, getDoc, updateDoc, increment } = await import("firebase/firestore")

      const productRef = doc(db, "products", productId)
      const productSnap = await getDoc(productRef)

      if (!productSnap.exists()) {
        return null
      }

      // Increment view count
      await updateDoc(productRef, {
        views: increment(1),
      })

      return { id: productSnap.id, ...productSnap.data() } as ItemType
    } catch (error) {
      console.error("Error getting product:", error)
      return getMockProducts().find((p) => p.id === productId) || null
    }
  }

  // Update a product
  const updateProduct = async (productId: string, data: Partial<ItemType>): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to update a product")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Check if product exists and belongs to user
      const productRef = doc(db, "products", productId)
      const productSnap = await getDoc(productRef)

      if (!productSnap.exists()) {
        throw new Error("Product not found")
      }

      const productData = productSnap.data()
      if (productData.ownerId !== user.uid) {
        throw new Error("You don't have permission to update this product")
      }

      // Update the product
      await updateDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })

      console.log("Product updated successfully")
    } catch (error: any) {
      console.error("Error updating product:", error)
      throw new Error(error.message || "Failed to update product")
    }
  }

  // Delete a product
  const deleteProduct = async (productId: string): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to delete a product")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, getDoc, deleteDoc } = await import("firebase/firestore")

      // Check if product exists and belongs to user
      const productRef = doc(db, "products", productId)
      const productSnap = await getDoc(productRef)

      if (!productSnap.exists()) {
        throw new Error("Product not found")
      }

      const productData = productSnap.data()
      if (productData.ownerId !== user.uid) {
        throw new Error("You don't have permission to delete this product")
      }

      // Delete the product
      await deleteDoc(productRef)
      console.log("Product deleted successfully")

      // In a real app, you would also delete associated images from storage
    } catch (error: any) {
      console.error("Error deleting product:", error)
      throw new Error(error.message || "Failed to delete product")
    }
  }

  // Mark product as sold
  const markProductAsSold = async (productId: string): Promise<void> => {
    if (!user) {
      throw new Error("You must be logged in to mark a product as sold")
    }

    if (!isInitialized || !db) {
      console.log("Firebase not initialized, using mock mode")
      return
    }

    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Check if product exists and belongs to user
      const productRef = doc(db, "products", productId)
      const productSnap = await getDoc(productRef)

      if (!productSnap.exists()) {
        throw new Error("Product not found")
      }

      const productData = productSnap.data()
      if (productData.ownerId !== user.uid) {
        throw new Error("You don't have permission to update this product")
      }

      // Mark as sold
      await updateDoc(productRef, {
        status: "sold",
        updatedAt: serverTimestamp(),
      })

      console.log("Product marked as sold")
    } catch (error: any) {
      console.error("Error marking product as sold:", error)
      throw new Error(error.message || "Failed to mark product as sold")
    }
  }

  // Get user's products
  const getUserProducts = async (userId: string, status?: "active" | "inactive" | "sold"): Promise<ItemType[]> => {
    return (await getProducts({ ownerId: userId, status })).products
  }

  // Mock products for demo mode
  const getMockProducts = (): ItemType[] => {
    return [
      {
        id: "1",
        title: "iPhone 11 Pro",
        description: "Slightly used iPhone 11 Pro with 64GB storage. Battery health at 85%.",
        price: 150000,
        imageUrl: "/placeholder.svg?height=500&width=500",
        imageUrls: ["/placeholder.svg?height=500&width=500"],
        condition: "Good",
        category: "Electronics",
        subcategory: "Smartphones",
        isFree: false,
        location: "Lagos",
        ownerId: "user123",
        ownerName: "John Doe",
        status: "active",
        views: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        title: "Leather Sofa",
        description: "Beautiful leather sofa in excellent condition. Only used for 6 months.",
        price: 85000,
        imageUrl: "/placeholder.svg?height=500&width=500",
        imageUrls: ["/placeholder.svg?height=500&width=500"],
        condition: "Like New",
        category: "Furniture",
        subcategory: "Sofas",
        isFree: false,
        location: "Abuja",
        ownerId: "user456",
        ownerName: "Jane Smith",
        status: "active",
        views: 32,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        title: "Programming Books Bundle",
        description: "Collection of programming books including JavaScript, Python, and React.",
        price: 0,
        imageUrl: "/placeholder.svg?height=500&width=500",
        imageUrls: ["/placeholder.svg?height=500&width=500"],
        condition: "Good",
        category: "Books",
        subcategory: "Educational",
        isFree: true,
        location: "Port Harcourt",
        ownerId: "user789",
        ownerName: "David Wilson",
        status: "active",
        views: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
  }

  return {
    createProduct,
    uploadProductImages,
    updateProductImages,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    markProductAsSold,
    getUserProducts,
  }
}

