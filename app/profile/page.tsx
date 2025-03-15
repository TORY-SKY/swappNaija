"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { Icons } from "@/components/icons"
import ItemCard from "@/components/item-card"
import type { ItemType } from "@/types/item"

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<{
    listed: ItemType[]
    saved: ItemType[]
    purchased: ItemType[]
  }>({
    listed: [],
    saved: [],
    purchased: [],
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/sign-in")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Placeholder items for demonstration
  const listedItems: ItemType[] = [
    {
      id: "1",
      title: "iPhone 11 Pro",
      price: 150000,
      imageUrl: "/placeholder.svg?height=400&width=400",
      condition: "Good",
      category: "Electronics",
      isFree: false,
      location: "Lagos",
      ownerId: "user123",
    },
    {
      id: "2",
      title: "Leather Sofa",
      price: 85000,
      imageUrl: "/placeholder.svg?height=400&width=400",
      condition: "Like New",
      category: "Furniture",
      isFree: false,
      location: "Abuja",
      ownerId: "user123",
    },
  ]

  const savedItems: ItemType[] = [
    {
      id: "3",
      title: "Gaming Headset",
      price: 25000,
      imageUrl: "/placeholder.svg?height=400&width=400",
      condition: "New",
      category: "Electronics",
      isFree: false,
      location: "Port Harcourt",
      ownerId: "user456",
    },
    {
      id: "4",
      title: "Coffee Table",
      price: 0,
      imageUrl: "/placeholder.svg?height=400&width=400",
      condition: "Fair",
      category: "Furniture",
      isFree: true,
      location: "Kano",
      ownerId: "user789",
    },
  ]

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        {/* Profile Card */}
        <Card className="glass-card">
          <CardHeader className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-bold">{user.displayName || user.email}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue={user.displayName || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+234" />
            </div>
            <Button className="w-full">Update Profile</Button>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Items Tabs */}
        <div className="space-y-6">
          <Tabs defaultValue="listed" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="listed" className="flex-1">
                My Listed Items
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">
                Saved Items
              </TabsTrigger>
              <TabsTrigger value="purchased" className="flex-1">
                Purchase History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="listed" className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Items You're Selling</h3>
                <Button size="sm" onClick={() => router.push("/sell")}>
                  Add New Item
                </Button>
              </div>
              {listedItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listedItems.map((item) => (
                    <ItemCard key={item.id} item={item} actionType="edit" />
                  ))}
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4">
                    <Icons.package className="h-12 w-12 text-muted-foreground" />
                    <CardTitle>No Items Listed</CardTitle>
                    <CardDescription>You haven't listed any items for sale yet.</CardDescription>
                    <Button>List Your First Item</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="saved" className="pt-4">
              <h3 className="text-lg font-medium mb-4">Items You've Saved</h3>
              {savedItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedItems.map((item) => (
                    <ItemCard key={item.id} item={item} actionType="remove" />
                  ))}
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4">
                    <Icons.heart className="h-12 w-12 text-muted-foreground" />
                    <CardTitle>No Saved Items</CardTitle>
                    <CardDescription>Items you save will appear here.</CardDescription>
                    <Button asChild>
                      <a href="/browse">Start Browsing</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="purchased" className="pt-4">
              <h3 className="text-lg font-medium mb-4">Your Purchase History</h3>
              <Card className="glass-card">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4">
                  <Icons.shoppingBag className="h-12 w-12 text-muted-foreground" />
                  <CardTitle>No Purchase History</CardTitle>
                  <CardDescription>Items you purchase will appear here.</CardDescription>
                  <Button asChild>
                    <a href="/browse">Find Something to Buy</a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

