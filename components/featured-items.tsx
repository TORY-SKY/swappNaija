"use client"

import { useState } from "react"
import ItemCard from "@/components/item-card"
import type { ItemType } from "@/types/item"

export default function FeaturedItems() {
  const [items] = useState<ItemType[]>([
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
      ownerId: "user456",
    },
    {
      id: "3",
      title: "Programming Books",
      price: 0,
      imageUrl: "/placeholder.svg?height=400&width=400",
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
      imageUrl: "/placeholder.svg?height=400&width=400",
      condition: "New",
      category: "Electronics",
      isFree: false,
      location: "Kano",
      ownerId: "user123",
    },
  ])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

