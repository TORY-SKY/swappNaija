"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useAnimation, type PanInfo, useMotionValue } from "framer-motion"
import { ArrowLeft, Heart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { ItemType } from "@/types/item"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"

// Demo items
const demoItems: ItemType[] = [
  {
    id: "1",
    title: "iPhone 11 Pro",
    price: 150000,
    imageUrl: "/placeholder.svg?height=500&width=500",
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
    imageUrl: "/placeholder.svg?height=500&width=500",
    condition: "Like New",
    category: "Furniture",
    isFree: false,
    location: "Abuja",
    ownerId: "user456",
  },
  {
    id: "3",
    title: "Programming Books Bundle",
    price: 0,
    imageUrl: "/placeholder.svg?height=500&width=500",
    condition: "Good",
    category: "Books",
    isFree: true,
    location: "Port Harcourt",
    ownerId: "user789",
  },
  {
    id: "4",
    title: "Gaming Headset",
    price: 25000,
    imageUrl: "/placeholder.svg?height=500&width=500",
    condition: "New",
    category: "Electronics",
    isFree: false,
    location: "Kano",
    ownerId: "user123",
  },
  {
    id: "5",
    title: "Handmade Craft Supplies",
    price: 12000,
    imageUrl: "/placeholder.svg?height=500&width=500",
    condition: "New",
    category: "Crafts",
    isFree: false,
    location: "Enugu",
    ownerId: "user456",
  },
]

export default function ItemSwiper() {
  const [items, setItems] = useState<ItemType[]>(demoItems)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const controls = useAnimation()
  const x = useMotionValue(0)
  const cardElem = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { addToCart } = useCart()

  const currentItem = items[currentIndex]

  const handleDragEnd = async (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = cardElem.current ? cardElem.current.offsetWidth * 0.4 : 150

    if (info.offset.x > threshold) {
      // Swiped right - Like
      await handleAction("right")
    } else if (info.offset.x < -threshold) {
      // Swiped left - Discard
      await handleAction("left")
    } else {
      // Reset position
      controls.start({ x: 0, opacity: 1, transition: { duration: 0.3 } })
    }
  }

  const handleAction = async (dir: string) => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection(dir)

    // Animate card off-screen
    await controls.start({
      x: dir === "left" ? -window.innerWidth : window.innerWidth,
      opacity: 0,
      rotate: dir === "left" ? -10 : 10,
      transition: { duration: 0.3 },
    })

    // Handle action based on direction
    if (dir === "right") {
      handleLike()
    } else {
      handleDiscard()
    }

    // Go to next card if available
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1)
    } else {
      // Reset to start if ended
      setItems(demoItems) // In real app, fetch new items
      setCurrentIndex(0)
    }

    // Reset animation state
    controls.set({ x: 0, opacity: 1, rotate: 0 })
    setIsAnimating(false)
    setDirection("")
  }

  const handleLike = () => {
    toast({
      title: "Item saved!",
      description: `${currentItem.title} has been added to your saved items.`,
    })
  }

  const handleDiscard = () => {
    // Do nothing for discard
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1)
    }
  }

  const handleAddToCart = () => {
    addToCart(currentItem)
    toast({
      title: "Added to cart!",
      description: `${currentItem.title} has been added to your cart.`,
    })
  }

  useEffect(() => {
    // Reset animation when current index changes
    controls.set({ x: 0, opacity: 1, rotate: 0 })
  }, [currentIndex, controls])

  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-80 text-center">
        <p className="text-xl font-semibold mb-4">No more items to show</p>
        <p className="text-muted-foreground mb-6">Check back later for new listings</p>
        <Button onClick={() => setItems(demoItems)}>Refresh Items</Button>
      </div>
    )
  }

  return (
    <div className="relative h-[500px] w-full max-w-md mx-auto">
      {/* Instruction text */}
      <div className="flex justify-center items-center space-x-8 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Swipe left to skip
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Heart className="h-4 w-4 mr-1" /> Swipe right to save
        </div>
      </div>

      {/* Card */}
      <motion.div
        ref={cardElem}
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl glass-card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        whileDrag={{ scale: 1.02 }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/70 z-10" />

        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${currentItem.imageUrl})` }} />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-2xl font-bold">{currentItem.title}</h3>
            {currentItem.isFree ? (
              <Badge className="bg-green-500 hover:bg-green-600">FREE</Badge>
            ) : (
              <span className="text-xl font-semibold">₦{currentItem.price.toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center text-sm space-x-2 mb-4">
            <Badge variant="outline" className="text-white border-white/50">
              {currentItem.condition}
            </Badge>
            <Badge variant="outline" className="text-white border-white/50">
              {currentItem.category}
            </Badge>
            <Badge variant="outline" className="text-white border-white/50">
              {currentItem.location}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button className="flex-1" onClick={handleAddToCart}>
              {currentItem.isFree ? "Reserve Item" : "Add to Cart"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleAction("right")}>
              <Heart className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Indicator overlays */}
        {direction === "left" && (
          <div className="absolute top-10 right-10 bg-destructive text-destructive-foreground p-3 rounded-full z-30">
            <X className="h-8 w-8" />
          </div>
        )}
        {direction === "right" && (
          <div className="absolute top-10 left-10 bg-primary text-primary-foreground p-3 rounded-full z-30">
            <Heart className="h-8 w-8" />
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="flex justify-center mt-6 space-x-4">
        <Button variant="outline" size="icon" onClick={() => handleAction("left")} disabled={isAnimating}>
          <X className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={handlePrevious} disabled={currentIndex === 0 || isAnimating}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleAction("right")} disabled={isAnimating}>
          <Heart className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

