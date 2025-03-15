"use client"

import { motion } from "framer-motion"
import {
  Smartphone,
  ShoppingBag,
  Sofa,
  BookOpen,
  Car,
  Gift,
  Shirt,
  Gem,
  Home,
  Utensils,
  Briefcase,
  Music,
  Baby,
  Camera,
  Dumbbell,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const categories = [
  {
    name: "Electronics",
    icon: Smartphone,
    href: "/browse?category=electronics",
    color: "bg-blue-100 dark:bg-blue-950 text-blue-500",
  },
  {
    name: "Clothing",
    icon: Shirt,
    href: "/browse?category=clothing",
    color: "bg-purple-100 dark:bg-purple-950 text-purple-500",
  },
  {
    name: "Furniture",
    icon: Sofa,
    href: "/browse?category=furniture",
    color: "bg-amber-100 dark:bg-amber-950 text-amber-500",
  },
  {
    name: "Books",
    icon: BookOpen,
    href: "/browse?category=books",
    color: "bg-green-100 dark:bg-green-950 text-green-500",
  },
  {
    name: "Vehicles",
    icon: Car,
    href: "/browse?category=vehicles",
    color: "bg-red-100 dark:bg-red-950 text-red-500",
  },
  {
    name: "Free Items",
    icon: Gift,
    href: "/browse?type=free",
    color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-500",
  },
  {
    name: "Jewelry",
    icon: Gem,
    href: "/browse?category=jewelry",
    color: "bg-pink-100 dark:bg-pink-950 text-pink-500",
  },
  {
    name: "Home Goods",
    icon: Home,
    href: "/browse?category=home",
    color: "bg-indigo-100 dark:bg-indigo-950 text-indigo-500",
  },
  {
    name: "Kitchen",
    icon: Utensils,
    href: "/browse?category=kitchen",
    color: "bg-yellow-100 dark:bg-yellow-950 text-yellow-500",
  },
  {
    name: "Office",
    icon: Briefcase,
    href: "/browse?category=office",
    color: "bg-cyan-100 dark:bg-cyan-950 text-cyan-500",
  },
  {
    name: "Music",
    icon: Music,
    href: "/browse?category=music",
    color: "bg-violet-100 dark:bg-violet-950 text-violet-500",
  },
  {
    name: "Baby & Kids",
    icon: Baby,
    href: "/browse?category=baby-kids",
    color: "bg-rose-100 dark:bg-rose-950 text-rose-500",
  },
  {
    name: "Photography",
    icon: Camera,
    href: "/browse?category=photography",
    color: "bg-gray-100 dark:bg-gray-800 text-gray-500",
  },
  {
    name: "Sports",
    icon: Dumbbell,
    href: "/browse?category=sports",
    color: "bg-lime-100 dark:bg-lime-950 text-lime-500",
  },
  {
    name: "All Categories",
    icon: ShoppingBag,
    href: "/browse",
    color: "bg-gray-100 dark:bg-gray-800 text-gray-500",
  },
]

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Categories</h1>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse All Items</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map((category, index) => (
          <Link key={category.name} href={category.href} className="flex-shrink-0">
            <motion.div
              className={`flex flex-col items-center p-6 rounded-xl ${category.color} transition-all hover:scale-105 cursor-pointer h-full`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <category.icon className="h-10 w-10 mb-3" />
              <span className="text-sm font-medium text-center">{category.name}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}

