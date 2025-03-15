"use client"

import { useState, useEffect } from "react"
import { useFirestore } from "@/hooks/use-firestore"
import { useToast } from "@/hooks/use-toast"
import ItemCard from "@/components/item-card"
import { Icons } from "@/components/icons"
import type { ItemType } from "@/types/item"

export default function FeaturedPage() {
  const [items, setItems] = useState<ItemType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getItems } = useFirestore()
  const { toast } = useToast()

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // In a real app, you would fetch featured items with specific criteria
        const featuredItems = await getItems({ limitCount: 12 })
        setItems(featuredItems)
      } catch (error) {
        console.error("Error fetching featured items:", error)
        toast({
          title: "Error",
          description: "Failed to load featured items",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [getItems, toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Featured Items</h1>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icons.package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Featured Items</h2>
          <p className="text-muted-foreground">Check back later for featured items</p>
        </div>
      )}
    </div>
  )
}

