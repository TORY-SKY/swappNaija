"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { useToast } from "@/hooks/use-toast"
// Import the centralized Firebase config
import { isFirebaseConfigValid } from "@/lib/firebase-config"

export function useStorage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [progress, setProgress] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [storage, setStorage] = useState<any>(null)

  // Initialize Storage
  useEffect(() => {
    // Update the initializeStorage function to check config validity
    const initializeStorage = async () => {
      try {
        // Check if window is defined (client-side)
        if (typeof window === "undefined") return

        // Check if Firebase config is valid
        if (!isFirebaseConfigValid()) {
          console.error("Firebase configuration is incomplete")
          setIsInitialized(false)

          if (!isInitialized) {
            toast({
              title: "Storage Error",
              description: "Using demo mode due to incomplete Firebase configuration",
              variant: "destructive",
            })
          }
          return
        }

        // Dynamically import Firebase modules
        const { getStorage } = await import("firebase/storage")
        const { getApp } = await import("firebase/app")

        try {
          // Try to get the Firebase app instance
          const app = getApp()
          const storageInstance = getStorage(app)
          setStorage(storageInstance)
          setIsInitialized(true)
          console.log("Storage initialized successfully")
        } catch (error) {
          console.error("Error getting Firebase app:", error)
          setIsInitialized(false)

          // Show error toast only once
          if (!isInitialized) {
            toast({
              title: "Storage Error",
              description: "Using demo mode due to Storage initialization error",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Error initializing Storage:", error)
        setIsInitialized(false)
      }
    }

    initializeStorage()
  }, [toast, isInitialized])

  // Upload a single file
  const uploadFile = async (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!user) throw new Error("User must be authenticated to upload files")

        if (!isInitialized || !storage) {
          console.log("Storage not initialized, returning mock URL")
          // Simulate upload progress
          let currentProgress = 0
          const interval = setInterval(() => {
            currentProgress += 20
            setProgress(Math.min(currentProgress, 100))
            if (currentProgress >= 100) {
              clearInterval(interval)
              resolve("/placeholder.svg?height=500&width=500")
            }
          }, 300)
          return
        }

        const uploadFileAsync = async () => {
          try {
            const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")

            const storageRef = ref(storage, path)
            const uploadTask = uploadBytesResumable(storageRef, file)

            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                setProgress(progress)
              },
              (error) => {
                console.error("Error uploading file:", error)
                reject(error)
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve(downloadURL)
              },
            )
          } catch (error) {
            console.error("Error in uploadFileAsync:", error)
            reject(error)
          }
        }

        uploadFileAsync()
      } catch (error) {
        console.error("Error in uploadFile:", error)

        // Simulate upload progress for demo mode
        let currentProgress = 0
        const interval = setInterval(() => {
          currentProgress += 20
          setProgress(Math.min(currentProgress, 100))
          if (currentProgress >= 100) {
            clearInterval(interval)
            resolve("/placeholder.svg?height=500&width=500")
          }
        }, 300)
      }
    })
  }

  // Upload multiple images
  const uploadImages = async (files: File[], basePath: string): Promise<string[]> => {
    try {
      if (!user) throw new Error("User must be authenticated to upload images")

      if (!isInitialized || !storage) {
        console.log("Storage not initialized, returning mock URLs")
        toast({
          title: "Demo Mode",
          description: "Using placeholder images in demo mode",
        })

        // Simulate upload progress
        let currentProgress = 0
        const interval = setInterval(() => {
          currentProgress += 10
          setProgress(Math.min(currentProgress, 100))
          if (currentProgress >= 100) clearInterval(interval)
        }, 200)

        // Return placeholder URLs after a delay
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return files.map((_, index) => `/placeholder.svg?height=500&width=500&index=${index}`)
      }

      const uploadPromises = files.map((file, index) => {
        const path = `${basePath}/${Date.now()}_${index}_${file.name}`
        return uploadFile(file, path)
      })

      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "Upload Error",
        description: "Failed to upload images, using placeholders instead",
        variant: "destructive",
      })

      // Return placeholder URLs
      return files.map((_, index) => `/placeholder.svg?height=500&width=500&index=${index}`)
    }
  }

  // Delete a file
  const deleteFile = async (url: string): Promise<boolean> => {
    try {
      if (!user) throw new Error("User must be authenticated to delete files")

      if (!isInitialized || !storage) {
        console.log("Storage not initialized, mocking delete file")
        toast({
          title: "Demo Mode",
          description: "File would be deleted in production mode",
        })
        return true
      }

      const { ref, deleteObject } = await import("firebase/storage")

      // Extract the path from the URL
      const fileRef = ref(storage, url)
      await deleteObject(fileRef)
      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
      return false
    }
  }

  return {
    uploadFile,
    uploadImages,
    deleteFile,
    progress,
  }
}

