"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AdDisplayProps {
  className?: string
}

export default function AdDisplay({ className }: AdDisplayProps) {
  const [ads, setAds] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  // Simulate fetching ads from an API
  useEffect(() => {
    const fetchAds = async () => {
      try {
        // In a real app, this would be an API call to fetch ads
        // For demo purposes, we'll simulate some ads
        const mockAds = [
          {
            id: 1,
            title: "Premium Membership",
            description: "Upgrade to Premium for priority listings and no fees!",
            imageUrl: "/placeholder.svg?height=200&width=600",
            url: "/premium",
          },
          {
            id: 2,
            title: "Download Our App",
            description: "Get the SwapNaira mobile app for a better experience",
            imageUrl: "/placeholder.svg?height=200&width=600",
            url: "/download",
          },
        ]

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setAds(mockAds)
      } catch (error) {
        console.error("Error fetching ads:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAds()
  }, [])

  // Rotate ads every 10 seconds
  useEffect(() => {
    if (ads.length <= 1) return

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [ads.length])

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  // Don't render if no ads or dismissed
  if (isLoading || ads.length === 0 || isDismissed) {
    return null
  }

  const currentAd = ads[currentAdIndex]

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-4">
        {currentAd.imageUrl && (
          <img
            src={currentAd.imageUrl || "/placeholder.svg"}
            alt={currentAd.title}
            className="w-full sm:w-1/3 h-auto rounded-md object-cover"
          />
        )}
        <div className="flex-1">
          <h3 className="font-medium text-lg">{currentAd.title}</h3>
          <p className="text-muted-foreground mt-1">{currentAd.description}</p>
          <Button size="sm" className="mt-3" asChild>
            <a href={currentAd.url}>Learn More</a>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={handleDismiss}>
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  )
}

