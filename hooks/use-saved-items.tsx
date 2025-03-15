"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { useToast } from "@/hooks/use-toast"
import type { ItemType } from "@/types/item"

export function useSavedItems() {
  const [savedItems, setSavedItems] = useState<ItemType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Load saved items
  useEffect(() => {
    const loadSavedItems = async () => {
      setIsLoading(true)
      try {
        if (user) {
          console.log("Loading saved items for user:", user.uid)
          // If user is logged in, try to load from Firestore
          try {
            const { getFirestore, doc, getDoc } = await import("firebase/firestore")
            const { getApp } = await import("firebase/app")

            const app = getApp()
            const db = getFirestore(app)

            const savedDoc = await getDoc(doc(db, "savedItems", user.uid))

            if (savedDoc.exists()) {
              const savedData = savedDoc.data()
              setSavedItems(savedData.items || [])
              console.log("Saved items loaded from Firestore:", savedData.items.length)
            } else {
              // If no saved items in Firestore, try to load from localStorage
              const localSaved = localStorage.getItem("savedItems")
              if (localSaved) {
                const parsedSaved = JSON.parse(localSaved)
                setSavedItems(parsedSaved)

                // Save to Firestore for future use
                saveSavedItemsToFirestore(parsedSaved)
              }
            }
          } catch (error) {
            console.error("Error loading saved items from Firestore:", error)
            // Fallback to localStorage
            const localSaved = localStorage.getItem("savedItems")
            if (localSaved) {
              setSavedItems(JSON.parse(localSaved))
            }
          }
        } else {
          // If not logged in, load from localStorage
          const localSaved = localStorage.getItem("savedItems")
          if (localSaved) {
            setSavedItems(JSON.parse(localSaved))
          }
        }
      } catch (error) {
        console.error("Failed to load saved items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedItems()
  }, [user])

  // Save to Firestore and localStorage
  useEffect(() => {
    if (isLoading) return

    // Save to localStorage
    try {
      localStorage.setItem("savedItems", JSON.stringify(savedItems))
    } catch (error) {
      console.error("Failed to save items to localStorage:", error)
    }

    // Save to Firestore if user is logged in
    if (user) {
      saveSavedItemsToFirestore(savedItems)
    }
  }, [savedItems, user, isLoading])

  const saveSavedItemsToFirestore = async (items: ItemType[]) => {
    if (!user) return

    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore")
      const { getApp } = await import("firebase/app")

      const app = getApp()
      const db = getFirestore(app)

      await setDoc(doc(db, "savedItems", user.uid), {
        userId: user.uid,
        items,
        updatedAt: new Date(),
      })

      console.log("Saved items stored in Firestore for user:", user.uid)
    } catch (error) {
      console.error("Error saving items to Firestore:", error)
    }
  }

  const saveItem = (item: ItemType) => {
    setSavedItems((prev) => {
      // Check if item already exists
      const exists = prev.some((savedItem) => savedItem.id === item.id)
      if (exists) {
        return prev // Item already saved
      } else {
        toast({
          title: "Item saved",
          description: `${item.title} has been added to your saved items.`,
        })
        return [...prev, item] // Add new item
      }
    })
  }

  const removeItem = (itemId: string) => {
    setSavedItems((prev) => {
      const item = prev.find((item) => item.id === itemId)
      if (item) {
        toast({
          title: "Item removed",
          description: `${item.title} has been removed from your saved items.`,
        })
      }
      return prev.filter((item) => item.id !== itemId)
    })
  }

  const isSaved = (itemId: string) => {
    return savedItems.some((item) => item.id === itemId)
  }

  return {
    savedItems,
    isLoading,
    saveItem,
    removeItem,
    isSaved,
  }
}

