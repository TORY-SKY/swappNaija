"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSavedItems } from "@/hooks/use-saved-items"
import ItemCard from "@/components/item-card"
import { Icons } from "@/components/icons"

export default function SavedItemsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { savedItems, isLoading, removeItem } = useSavedItems()

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/auth/sign-in?redirect=/saved")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Saved Items</h1>

      {savedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedItems.map((item) => (
            <ItemCard key={item.id} item={item} actionType="remove" />
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4 py-10">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <CardTitle>No Saved Items</CardTitle>
            <CardDescription>Items you save will appear here.</CardDescription>
            <Button asChild>
              <a href="/browse">Start Browsing</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

