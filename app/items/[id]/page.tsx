"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, Share2, MapPin, ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore } from "@/hooks/use-firestore"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useSavedItems } from "@/hooks/use-saved-items"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"
import AdDisplay from "@/components/ad-display"
import type { ItemType } from "@/types/item"

export default function ItemDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { getItem, getUser } = useFirestore()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { saveItem, removeItem, isSaved } = useSavedItems()
  const { toast } = useToast()

  const [item, setItem] = useState<ItemType | null>(null)
  const [owner, setOwner] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [itemIsSaved, setItemIsSaved] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (typeof id !== "string") return

        const itemData = await getItem(id)
        if (!itemData) {
          router.push("/browse")
          return
        }

        setItem(itemData)

        // Fetch owner data
        if (itemData.ownerId) {
          const ownerData = await getUser(itemData.ownerId)
          setOwner(ownerData)
        }

        // Check if item is saved
        setItemIsSaved(isSaved(id))
      } catch (error) {
        console.error("Error fetching item:", error)
        toast({
          title: "Error",
          description: "Failed to load item details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchItem()
  }, [id, getItem, getUser, router, toast, isSaved])

  const handleAddToCart = () => {
    if (!item) return

    addToCart(item)
    toast({
      title: "Added to cart",
      description: `${item.title} has been added to your cart.`,
    })
  }

  const handleSaveItem = () => {
    if (!item) return

    if (itemIsSaved) {
      removeItem(item.id)
    } else {
      saveItem(item)
    }

    setItemIsSaved(!itemIsSaved)
  }

  const handleShare = () => {
    if (navigator.share && typeof navigator.share === "function") {
      navigator.share({
        title: item?.title,
        text: `Check out this item on SwapNaira: ${item?.title}`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Item link has been copied to clipboard",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Item not found</h1>
        <p className="mb-6">The item you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/browse")}>Browse Items</Button>
      </div>
    )
  }

  // For demo purposes, create some placeholder data
  const demoItem: ItemType = {
    id: id as string,
    title: "iPhone 11 Pro Max 256GB",
    price: 280000,
    description:
      "Selling my iPhone 11 Pro Max 256GB in excellent condition. Space Gray color. Battery health at 89%. Comes with original charger and box. Minor scratches on the back but screen is flawless. Used with a case since day one.",
    condition: "Good",
    category: "Electronics",
    location: "Lagos, Nigeria",
    isFree: false,
    ownerId: "user123",
    createdAt: new Date(),
    imageUrls: [
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
    ],
  }

  // Use demo data if no item data is available
  const displayItem = item.imageUrls ? item : demoItem

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            <Image
              src={displayItem.imageUrls?.[selectedImage] || "/placeholder.svg?height=600&width=600"}
              alt={displayItem.title}
              fill
              className="object-cover"
              priority
            />
            {displayItem.isFree && (
              <Badge className="absolute top-4 right-4 bg-green-500 hover:bg-green-600">FREE</Badge>
            )}
          </div>

          {/* Thumbnails */}
          {displayItem.imageUrls && displayItem.imageUrls.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {displayItem.imageUrls.map((url, index) => (
                <button
                  key={index}
                  className={`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === index ? "border-primary" : "border-transparent"
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <Image src={url || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{displayItem.title}</h1>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSaveItem}
                  className={itemIsSaved ? "text-red-500" : ""}
                >
                  <Heart className={`h-5 w-5 ${itemIsSaved ? "fill-current" : ""}`} />
                  <span className="sr-only">Save</span>
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                  <span className="sr-only">Share</span>
                </Button>
              </div>
            </div>

            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {displayItem.location}
            </div>

            <div className="mt-4">
              {displayItem.isFree ? (
                <span className="text-3xl font-bold text-green-500">FREE</span>
              ) : (
                <span className="text-3xl font-bold">₦{displayItem.price.toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{displayItem.category}</Badge>
            <Badge variant="secondary">{displayItem.condition}</Badge>
            <Badge variant="secondary">{new Date(displayItem.createdAt || Date.now()).toLocaleDateString()}</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {displayItem.isFree ? "Reserve Item" : "Add to Cart"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                toast({
                  title: "Message sent",
                  description: "Your message has been sent to the seller.",
                })
              }}
            >
              Contact Seller
            </Button>
          </div>

          <Separator />

          <Tabs defaultValue="description">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">
                Description
              </TabsTrigger>
              <TabsTrigger value="seller" className="flex-1">
                Seller
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-4">
              <p className="whitespace-pre-line">{displayItem.description}</p>
            </TabsContent>
            <TabsContent value="seller" className="pt-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>{owner?.displayName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{owner?.displayName || "User"}</h3>
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(owner?.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Message sent",
                      description: "Your message has been sent to the seller.",
                    })
                  }}
                >
                  Message Seller
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <AdDisplay />
        </div>
      </div>

      {/* Related Items */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Similar Items</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* This would be populated with actual related items in a real app */}
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/items/${i + 1}`)}
              >
                <div className="relative aspect-square">
                  <Image
                    src={`/placeholder.svg?height=300&width=300`}
                    alt="Related item"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate">Similar Item {i + 1}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold">₦{(Math.random() * 100000).toFixed(0)}</span>
                    <Badge variant="outline">{["Good", "Like New", "Fair", "New"][i % 4]}</Badge>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

