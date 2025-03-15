"use client"

import { motion } from "framer-motion"
import { Smartphone, ShoppingBag, Sofa, BookOpen, Car, Gift, Shirt, Gem, Home } from "lucide-react"
import Link from "next/link"

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
    name: "All Categories",
    icon: ShoppingBag,
    href: "/categories",
    color: "bg-gray-100 dark:bg-gray-800 text-gray-500",
  },
]

export default function CategoryFilter() {
  return (
    <div className="overflow-x-auto pb-4">
      <motion.div
        className="flex space-x-4"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {categories.map((category, index) => (
          <Link key={category.name} href={category.href} className="flex-shrink-0">
            <motion.div
              className={`flex flex-col items-center p-4 rounded-xl ${category.color} transition-all hover:scale-105 cursor-pointer`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <category.icon className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">{category.name}</span>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}

