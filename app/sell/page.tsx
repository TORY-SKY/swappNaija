"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/hooks/use-firestore"
import { useStorage } from "@/hooks/use-storage"
import AdDisplay from "@/components/ad-display"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SellPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { addItem } = useFirestore()
  const { uploadImages } = useStorage()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFree, setIsFree] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState("")

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setRedirecting(true)
      toast({
        title: "Sign in required",
        description: "Please sign in to list items for sale",
      })
      router.push("/auth/sign-in?redirect=/sell")
    }
  }, [user, isLoading, router, toast])

  if (isLoading || redirecting) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)

      // Limit to 5 images
      if (filesArray.length + images.length > 5) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 5 images per listing.",
          variant: "destructive",
        })
        return
      }

      // Create preview URLs
      const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file))

      setImages((prev) => [...prev, ...filesArray])
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    const newPreviewUrls = [...imagePreviewUrls]

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviewUrls[index])

    newImages.splice(index, 1)
    newPreviewUrls.splice(index, 1)

    setImages(newImages)
    setImagePreviewUrls(newPreviewUrls)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (images.length === 0) {
      setError("Please upload at least one image of your item.")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const title = formData.get("title") as string
      const description = formData.get("description") as string
      const category = formData.get("category") as string
      const condition = formData.get("condition") as string
      const location = formData.get("location") as string
      const price = isFree ? 0 : Number(formData.get("price"))

      if (!title || !description || !category || !condition || !location) {
        throw new Error("Please fill in all required fields")
      }

      if (!isFree && (!price || isNaN(price) || price <= 0)) {
        throw new Error("Please enter a valid price")
      }

      console.log("Uploading images...")
      // Upload images to Firebase Storage
      const imageUrls = await uploadImages(images, `items/${user?.uid || "demo"}`)
      console.log("Image URLs:", imageUrls)

      // Add item to Firestore
      console.log("Adding item to Firestore...")
      const itemId = await addItem({
        title,
        description,
        category,
        condition,
        location,
        price,
        isFree,
        imageUrls,
        imageUrl: imageUrls[0], // Set the first image as the main image
        ownerId: user?.uid || "demo-user",
      })

      console.log("Item added with ID:", itemId)

      toast({
        title: "Item listed successfully!",
        description: "Your item has been listed on SwapNaira.",
      })

      router.push("/profile")
    } catch (error: any) {
      console.error("Error listing item:", error)
      setError(error.message || "There was an error listing your item. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">List Your Item</h1>

        <AdDisplay className="mb-8" />

        <Card className="glass-card">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Provide details about the item you want to sell or give away.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="e.g. iPhone 11 Pro 64GB" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your item, including any defects or special features"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="jewelry">Jewelry</SelectItem>
                      <SelectItem value="home">Home Goods</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select name="condition" required defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like-new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g. Lagos, Nigeria" required />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price">Price (₦)</Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="free-item" checked={isFree} onCheckedChange={setIsFree} />
                      <Label htmlFor="free-item" className="text-sm">
                        Free Item
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="e.g. 25000"
                    disabled={isFree}
                    required={!isFree}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Images (up to 5)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <Icons.close className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <div className="aspect-square rounded-md border border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        id="images"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                      <label
                        htmlFor="images"
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Icons.upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Add Image</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Listing Item...
                  </>
                ) : (
                  "List Item"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

