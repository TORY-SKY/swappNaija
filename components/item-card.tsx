"use client"

import { Heart, Edit, Trash2, ShoppingCart } from "lucide-react"
import type { ItemType } from "@/types/item"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"

interface ItemCardProps {
  item: ItemType
  actionType?: "add" | "remove" | "edit"
}

export default function ItemCard({ item, actionType = "add" }: ItemCardProps) {
  const { addToCart } = useCart()
  const { toast } = useToast()

  const handleAction = () => {
    switch (actionType) {
      case "add":
        addToCart(item)
        toast({
          title: "Added to cart!",
          description: `${item.title} has been added to your cart.`,
        })
        break
      case "remove":
        toast({
          title: "Removed from saved",
          description: `${item.title} has been removed from your saved items.`,
        })
        break
      case "edit":
        // Would navigate to edit page
        break
    }
  }

  return (
    <Card className="glass-card overflow-hidden transition-all hover:shadow-md">
      <div className="relative h-48">
        <Link href={`/items/${item.id}`}>
          <Image src={item.imageUrl || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
        </Link>
        {item.isFree && <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">FREE</Badge>}
      </div>
      <CardHeader className="px-4 py-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          {!item.isFree && <div className="font-bold text-lg">₦{item.price.toLocaleString()}</div>}
        </div>
        <CardDescription className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs font-normal">
            {item.condition}
          </Badge>
          <span className="text-muted-foreground">{item.location}</span>
        </CardDescription>
      </CardHeader>
      <CardFooter className="px-4 py-3 flex gap-2">
        {actionType === "add" && (
          <>
            <Button className="flex-1" onClick={handleAction}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </>
        )}
        {actionType === "remove" && (
          <Button variant="outline" className="w-full" onClick={handleAction}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remove from Saved
          </Button>
        )}
        {actionType === "edit" && (
          <Button variant="outline" className="w-full" onClick={handleAction}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Listing
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

